import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { visit } from 'unist-util-visit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function excalidrawGenPlugin(userOpts = {}) {
  const opts = {
    srcDir: 'drawings',
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
      if (!url.startsWith('idraw:')) return;

      const name = url.slice('idraw:'.length);
      if (!/\.excalidraw\.svg$/i.test(name)) {
        throw new Error(`[remark-excalidraw-gen] Unsupported idraw URL: ${url}`);
      }
      node.url = processOne(name);
    });
  };
}