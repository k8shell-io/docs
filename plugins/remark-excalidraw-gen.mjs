import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { visit } from 'unist-util-visit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getSvgSize(filePath) {
  try {
    const svg = fs.readFileSync(filePath, 'utf8');
    const m = svg.match(/viewBox="([\d.\s-]+)"/);
    if (m) {
      const [minX, minY, w, h] = m[1].trim().split(/\s+/).map(Number);
      return { width: w, height: h };
    }
    const mw = svg.match(/width="([\d.]+)"/);
    const mh = svg.match(/height="([\d.]+)"/);
    return {
      width: mw ? parseFloat(mw[1]) : 0,
      height: mh ? parseFloat(mh[1]) : 0,
    };
  } catch {
    return { width: 0, height: 0 };
  }
}

export default function excalidrawGenPlugin(userOpts = {}) {
  const opts = {
    srcDir: '',
    outDir: 'static/img/gen-svg',
    extractScript: 'bin/extract-by-boundary.js',
    color: '#ff0000',
    pad: 0,
    prefer: 'stroke',
    ...userOpts,
  };

  return async function transformer(tree, vfile) {
    const siteDir = vfile?.data?.docusaurus?.siteDir || process.cwd();
    const SRC_DIR = path.resolve(siteDir, opts.srcDir);
    const OUT_DIR = path.resolve(siteDir, opts.outDir);
    const EXTRACT = path.resolve(siteDir, opts.extractScript);

    fs.mkdirSync(OUT_DIR, { recursive: true });

    const processOne = (name) => {
      const inPath = path.join(SRC_DIR, name);
      console.log('[remark-excalidraw-gen] Processing', inPath);
      if (!fs.existsSync(inPath)) {
        throw new Error(`[remark-excalidraw-gen] Source not found: ${inPath}`);
      }
      const outName = name.replace(/\.excalidraw\.svg$/i, '.svg');
      const outPath = path.join(OUT_DIR, outName);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      const need =
        !fs.existsSync(outPath) ||
        fs.statSync(outPath).mtimeMs < fs.statSync(inPath).mtimeMs;

      if (need) {
        const args = [
          EXTRACT,
          '--in', inPath,
          '--out', outPath,
          '--color', String(opts.color),
          '--prefer', String(opts.prefer),
          '--pad', String(opts.pad),
        ];

        // Use the same Node binary Docusaurus runs with
        const bin = process.execPath;

        const res = spawnSync(bin, args, {
          cwd: siteDir,
          env: process.env,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        if (res.error) {
          throw new Error(`[remark-excalidraw-gen] Failed to spawn extractor: ${res.error.message}`);
        }
        if (res.status !== 0) {
          // Surface real stderr/stdout so you can see boundary-not-found etc.
          throw new Error(
            `[remark-excalidraw-gen] Extractor failed (exit ${res.status}).\n` +
            `Command: ${bin} ${args.map(a => JSON.stringify(a)).join(' ')}\n` +
            (res.stdout ? `stdout:\n${res.stdout}\n` : '') +
            (res.stderr ? `stderr:\n${res.stderr}\n` : '')
          );
        }
        if (process.env.DEBUG_IDRAW) {
          console.log('[remark-excalidraw-gen] ✓', path.relative(siteDir, outPath));
        }
      }

      return `/img/gen-svg/${outName}`;
    };

    visit(tree, 'image', (node) => {
      const url = String(node.url || '');
      if (!url.startsWith('svg-gen:')) return;

      const name = url.slice('svg-gen:'.length);
      if (!/\.excalidraw\.svg$/i.test(name)) {
        throw new Error(`[remark-excalidraw-gen] Unsupported svg-gen URL: ${url}`);
      }

      const publicUrl = processOne(name);                // e.g. "/img/gen-svg/foo.svg"
      const outPath = path.join(OUT_DIR, name.replace(/\.excalidraw\.svg$/i, '.svg'));
      const { width, height } = getSvgSize(outPath);

      node.url = publicUrl;
      node.data = node.data || {};
      node.data.hProperties = {
        ...(node.data.hProperties || {}),
        ...(width && height ? { width, height } : {}),
        decoding: 'async',
        loading: 'lazy',
      };
    });
  };
}