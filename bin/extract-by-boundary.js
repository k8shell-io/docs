#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { program } = require('commander');
const pathBounds = require('svg-path-bounds');

program
  .requiredOption('--in <file>', 'input SVG file')
  .requiredOption('--out <file>', 'output SVG file')
  .requiredOption('--color <hexOrRgb>', 'boundary color (e.g., "#ff0000" or "rgb(255,0,0)")')
  .option('--prefer <attr>', 'choose "stroke" or "fill" for boundary detection', 'stroke')
  .option('--pad <number>', 'pad the boundary bbox on all sides', v => parseFloat(v), 0)
  .option('--links <file>', 'JSON file mapping label text to URL for clickable regions')
  .parse(process.argv);

const opts = program.opts();
const inputPath = path.resolve(opts.in);
const outputPath = path.resolve(opts.out);
const preferAttr = (opts.prefer || 'stroke').toLowerCase() === 'fill' ? 'fill' : 'stroke';
const boundaryColor = normalizeColor(opts.color);
const padExtra = isFinite(opts.pad) ? Number(opts.pad) : 0;

// ---------- Helpers ----------
function normalizeColor(c) {
  if (!c) return null;
  c = ('' + c).trim().toLowerCase();
  // hex #rgb -> #rrggbb
  if (c.startsWith('#')) {
    if (c.length === 4) return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    if (c.length === 7) return c;
    return c;
  }
  // rgb/rgba(r,g,b[,a])
  const m = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/);
  if (m) {
    const r = Math.max(0, Math.min(255, Math.round(parseFloat(m[1]))));
    const g = Math.max(0, Math.min(255, Math.round(parseFloat(m[2]))));
    const b = Math.max(0, Math.min(255, Math.round(parseFloat(m[3]))));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  return c;
}

function getTagName(el) {
  return el.tagName || el.name || '';
}

function readStyleAttr($el, name) {
  const style = ($el.attr('style') || '').trim();
  if (!style) return null;
  const parts = style.split(';').map(s => s.trim()).filter(Boolean);
  for (const p of parts) {
    const [k, v] = p.split(':').map(s => s.trim());
    if (k && v && k.toLowerCase() === name.toLowerCase()) return v;
  }
  return null;
}

function readColorFrom($el, attrName) {
  const direct = $el.attr(attrName);
  if (direct) return normalizeColor(direct);
  const fromStyle = readStyleAttr($el, attrName);
  if (fromStyle) return normalizeColor(fromStyle);
  return null;
}

function parseTranslateFromTransform(transformStr) {
  // returns {tx, ty} aggregated from translate(...) & matrix(... e f)
  let tx = 0, ty = 0;
  if (!transformStr) return { tx, ty };

  // translate(x[,y])
  const tRe = /translate\(\s*([-\d.]+)(?:[ ,]\s*([-\d.]+))?\s*\)/gi;
  let m;
  while ((m = tRe.exec(transformStr))) {
    tx += parseFloat(m[1] || '0') || 0;
    ty += parseFloat(m[2] || '0') || 0;
  }

  // matrix(a,b,c,d,e,f) -> add e,f as translation
  const matRe = /matrix\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/gi;
  while ((m = matRe.exec(transformStr))) {
    tx += parseFloat(m[5] || '0') || 0;
    ty += parseFloat(m[6] || '0') || 0;
  }

  return { tx, ty };
}

function addTranslateToBBox([x1, y1, x2, y2], tx, ty) {
  return [x1 + tx, y1 + ty, x2 + tx, y2 + ty];
}

function bboxFromPoints(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}

function parsePoints(str) {
  if (!str) return [];
  const clean = str.trim().replace(/,/g, ' ');
  const nums = clean.split(/\s+/).map(Number).filter(n => !isNaN(n));
  const pts = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts;
}

function intersects(b1, b2) {
  // [x1,y1,x2,y2] overlap test
  if (!b1 || !b2) return false;
  const [a1, b1y, a2, b2y] = b1;
  const [c1, d1y, c2, d2y] = b2;
  return !(a2 < c1 || c2 < a1 || b2y < d1y || d2y < b1y);
}

function num(v, def = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? def : n;
}

// compute bbox for a leaf shape, adding cumulative translation
function computeLeafBBox($, el, cumTx, cumTy) {
  const $el = $(el);
  const tag = getTagName(el).toLowerCase();

  // local transform translate
  const { tx: ltx, ty: lty } = parseTranslateFromTransform($el.attr('transform') || '');
  const tx = cumTx + ltx;
  const ty = cumTy + lty;

  try {
    if (tag === 'path') {
      const d = $el.attr('d');
      if (!d) return null;
      const [x1, y1, x2, y2] = pathBounds(d);
      return addTranslateToBBox([x1, y1, x2, y2], tx, ty);
    } else if (tag === 'rect') {
      const x = num($el.attr('x'));
      const y = num($el.attr('y'));
      const w = num($el.attr('width'));
      const h = num($el.attr('height'));
      return addTranslateToBBox([x, y, x + w, y + h], tx, ty);
    } else if (tag === 'circle') {
      const cx = num($el.attr('cx'));
      const cy = num($el.attr('cy'));
      const r = num($el.attr('r'));
      return addTranslateToBBox([cx - r, cy - r, cx + r, cy + r], tx, ty);
    } else if (tag === 'ellipse') {
      const cx = num($el.attr('cx'));
      const cy = num($el.attr('cy'));
      const rx = num($el.attr('rx'));
      const ry = num($el.attr('ry'));
      return addTranslateToBBox([cx - rx, cy - ry, cx + rx, cy + ry], tx, ty);
    } else if (tag === 'line') {
      const x1 = num($el.attr('x1'));
      const y1 = num($el.attr('y1'));
      const x2 = num($el.attr('x2'));
      const y2 = num($el.attr('y2'));
      const bb = bboxFromPoints([[x1, y1], [x2, y2]]);
      return bb ? addTranslateToBBox(bb, tx, ty) : null;
    } else if (tag === 'polyline' || tag === 'polygon') {
      const pts = parsePoints($el.attr('points'));
      const bb = bboxFromPoints(pts);
      return bb ? addTranslateToBBox(bb, tx, ty) : null;
    } else if (tag === 'image') {
      const x = num($el.attr('x'));
      const y = num($el.attr('y'));
      const w = num($el.attr('width'));
      const h = num($el.attr('height'));
      return addTranslateToBBox([x, y, x + w, y + h], tx, ty);
    } else if (tag === 'text') {
      // Approximation: treat (x,y) as a point bbox
      const x = num($el.attr('x'));
      const y = num($el.attr('y'));
      return addTranslateToBBox([x, y, x, y], tx, ty);
    }
  } catch {
    return null;
  }
  return null;
}

// find boundary <path> with matching color
function findBoundaryPath($, $svg, color, preferAttr) {
  const secondary = preferAttr === 'stroke' ? 'fill' : 'stroke';
  const paths = $svg.find('path');

  const matchBy = (attr) => {
    let found = null;
    paths.each((_, el) => {
      if (found) return;
      const $el = $(el);
      const c = readColorFrom($el, attr);
      if (c && c === color) found = $el;
    });
    return found;
  };

  let $boundary = matchBy(preferAttr);
  if (!$boundary || $boundary.length === 0) $boundary = matchBy(secondary);
  if (!$boundary || $boundary.length === 0) return { bbox: null, $boundary: null };

  // accumulate translate from ancestors and self
  let cumTx = 0, cumTy = 0;
  let node = $boundary[0];
  while (node) {
    const $node = $(node);
    const { tx, ty } = parseTranslateFromTransform($node.attr('transform') || '');
    cumTx += tx; cumTy += ty;
    node = node.parent;
  }

  const d = $boundary.attr('d');
  if (!d) return { bbox: null, $boundary: null };
  const [x1, y1, x2, y2] = pathBounds(d);
  return { bbox: addTranslateToBBox([x1, y1, x2, y2], cumTx, cumTy), $boundary };
}

// remove non-intersecting leaves recursively; keep <defs>; remove boundary element itself
function pruneToIntersecting($, $parent, targetBBox, cumTx = 0, cumTy = 0, boundaryEl = null) {
  const children = [...$parent.contents().toArray()];
  for (const node of children) {
    if (node.type !== 'tag') continue;
    const tag = getTagName(node).toLowerCase();

    if (tag === 'defs') continue; // keep defs untouched

    if (boundaryEl && node === boundaryEl) {
      $(node).remove();
      continue;
    }

    const $node = $(node);
    const { tx: ltx, ty: lty } = parseTranslateFromTransform($node.attr('transform') || '');
    const ntx = cumTx + ltx, nty = cumTy + lty;

    const isLeaf = /^(path|rect|circle|ellipse|line|polyline|polygon|image|text)$/.test(tag);
    if (isLeaf) {
      const bb = computeLeafBBox($, node, cumTx, cumTy);
      if (!bb || !intersects(bb, targetBBox)) {
        $node.remove();
      }
      continue;
    }

    // recurse for groups/containers
    pruneToIntersecting($, $node, targetBBox, ntx, nty, boundaryEl);

    // remove empty groups (excluding defs)
    const hasKept = $node.children().toArray().some(ch => ch.type === 'tag' && getTagName(ch).toLowerCase() !== 'defs');
    if (!hasKept) $node.remove();
  }
}

function expandBBox([x1, y1, x2, y2], pad) {
  return [x1 - pad, y1 - pad, x2 + pad, y2 + pad];
}

// ---------- Link overlay helpers ----------

function unionBBox(b1, b2) {
  return [Math.min(b1[0], b2[0]), Math.min(b1[1], b2[1]), Math.max(b1[2], b2[2]), Math.max(b1[3], b2[3])];
}

function normalizeText(str) {
  return (str || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// Cumulative translation from all ancestors above el (not including el's own transform)
function getAncestorTranslation($, el) {
  let tx = 0, ty = 0;
  let node = el.parent;
  while (node && node.type === 'tag') {
    const { tx: ltx, ty: lty } = parseTranslateFromTransform($(node).attr('transform') || '');
    tx += ltx;
    ty += lty;
    node = node.parent;
  }
  return { tx, ty };
}

// Union bbox of all shape (non-text) leaf descendants of groupEl, in original SVG coordinates
function computeGroupUnionBBox($, groupEl) {
  const { tx: ancTx, ty: ancTy } = getAncestorTranslation($, groupEl);
  const { tx: grpTx, ty: grpTy } = parseTranslateFromTransform($(groupEl).attr('transform') || '');
  const baseTx = ancTx + grpTx;
  const baseTy = ancTy + grpTy;

  let union = null;

  // Visit descendant nodes; cumTx/cumTy is the translation from all ancestors above the node
  function visitNode(el, cumTx, cumTy) {
    if (el.type !== 'tag') return;
    const tag = getTagName(el).toLowerCase();
    if (tag === 'defs') return;

    // Shapes only — exclude text (point bbox) to get the visual shape boundary
    const isShape = /^(path|rect|circle|ellipse|line|polyline|polygon|image)$/.test(tag);
    if (isShape) {
      const bb = computeLeafBBox($, el, cumTx, cumTy);
      if (bb) union = union ? unionBBox(union, bb) : bb;
      return;
    }

    // Recurse into groups, passing this node's full cumulative translation to children
    const $el = $(el);
    const { tx: ltx, ty: lty } = parseTranslateFromTransform($el.attr('transform') || '');
    const ntx = cumTx + ltx;
    const nty = cumTy + lty;
    $el.children().toArray().forEach(child => visitNode(child, ntx, nty));
  }

  $(groupEl).children().toArray().forEach(child => visitNode(child, baseTx, baseTy));
  return union;
}

// For each label in linksMap, find its shape group bbox using spatial matching.
// Excalidraw SVGs use a flat structure where text labels and shape groups are siblings,
// so we compute the text element's absolute position and find the smallest shape-group
// bbox that contains it.
function resolveLinkOverlays($, $svg, linksMap) {
  const overlays = [];
  const allText = $svg.find('text').toArray();

  // Pre-compute bboxes for all shape-containing <g> elements
  const allShapeGroups = $svg.find('g').toArray().filter(g =>
    $(g).find('path, rect, circle, ellipse, polygon, polyline').length > 0
  );

  for (const [label, url] of Object.entries(linksMap)) {
    const normalized = normalizeText(label);
    const textEl = allText.find(el => normalizeText($(el).text()) === normalized);
    if (!textEl) {
      console.warn(`[extract-by-boundary] Warning: no text element found for label "${label}"`);
      continue;
    }

    // Compute text element's absolute position in original SVG coordinates.
    // getAncestorTranslation starts from textEl.parent and walks up, so it captures
    // the cumulative translation from the immediate parent group onward.
    const textLocalX = parseFloat($(textEl).attr('x') || '0');
    const textLocalY = parseFloat($(textEl).attr('y') || '0');
    const { tx: textOwnTx, ty: textOwnTy } = parseTranslateFromTransform($(textEl).attr('transform') || '');
    const { tx: ancTx, ty: ancTy } = getAncestorTranslation($, textEl);
    const textAbsX = ancTx + textOwnTx + textLocalX;
    const textAbsY = ancTy + textOwnTy + textLocalY;

    // Find the smallest shape-group bbox that contains the text point
    let bestBBox = null;
    let bestArea = Infinity;

    for (const g of allShapeGroups) {
      const bbox = computeGroupUnionBBox($, g);
      if (!bbox) continue;
      const [x1, y1, x2, y2] = bbox;
      if (textAbsX >= x1 && textAbsX <= x2 && textAbsY >= y1 && textAbsY <= y2) {
        const area = (x2 - x1) * (y2 - y1);
        if (area < bestArea) {
          bestArea = area;
          bestBBox = bbox;
        }
      }
    }

    if (!bestBBox) {
      console.warn(`[extract-by-boundary] Warning: no shape group bbox contains text position for label "${label}" (text at ${textAbsX.toFixed(1)}, ${textAbsY.toFixed(1)})`);
      continue;
    }

    overlays.push({ label, url, bbox: bestBBox, textGroup: textEl.parent });
  }
  return overlays;
}

// ---------- Main ----------
try {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const $ = cheerio.load(raw, { xmlMode: true, decodeEntities: false });
  const $svg = $('svg').first();
  if ($svg.length === 0) throw new Error('No <svg> root found');

  // 1) Find boundary + bbox
  let { bbox: boundaryBBox, $boundary } = findBoundaryPath($, $svg, boundaryColor, preferAttr);
  if (!boundaryBBox) throw new Error(`Boundary <path> with ${preferAttr}/fill color ${boundaryColor} not found`);

  // Optional padding
  if (padExtra && isFinite(padExtra) && padExtra > 0) {
    boundaryBBox = expandBBox(boundaryBBox, padExtra);
  }

  const [rx1, ry1, rx2, ry2] = boundaryBBox;
  const rectW = rx2 - rx1;
  const rectH = ry2 - ry1;
  if (rectW <= 0 || rectH <= 0) throw new Error('Boundary rectangle has non-positive width/height');

  // 2) Keep only elements whose bbox intersects the rectangle
  pruneToIntersecting($, $svg, boundaryBBox, 0, 0, $boundary ? $boundary[0] : null);

  // 2b) Remove white background rect (makes SVG transparent for theming)
  $svg.find('rect').each((_, el) => {
    const $el = $(el);
    const fill = ($el.attr('fill') || '').toLowerCase().trim();
    const x = parseFloat($el.attr('x') || '0');
    const y = parseFloat($el.attr('y') || '0');
    if ((fill === '#ffffff' || fill === 'white') && x === 0 && y === 0) {
      $el.remove();
    }
  });

  // 2c) Resolve link overlays in original coordinate space (before rebasing)
  let linkOverlays = [];
  if (opts.links) {
    const linksPath = path.resolve(opts.links);
    let linksMap;
    try {
      linksMap = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
    } catch (e) {
      throw new Error(`Failed to read links file ${linksPath}: ${e.message}`);
    }
    linkOverlays = resolveLinkOverlays($, $svg, linksMap);
  }

  // 3) Rebase to origin: move all non-<defs> into a translated group (-rx1, -ry1)
  const $contentGroup = $('<g/>').attr('transform', `translate(${-rx1}, ${-ry1})`);
  $svg.children().toArray().forEach(node => {
    if (node.type !== 'tag') return;
    const tag = (node.name || node.tagName || '').toLowerCase();
    if (tag === 'defs') return; // keep defs at root
    $contentGroup.append($(node)); // move
  });

  // 3b) Append link anchors on top of content.
  // Each <a> contains the label's text group (so CSS :hover can reach <text> children
  // for underline styling) plus a transparent overlay rect that makes the entire shape
  // area clickable. The text group is detached from its original position and re-appended
  // here; since text labels are already the topmost visual layer in Excalidraw SVGs this
  // does not change the rendered appearance.
  for (const { url, bbox, textGroup } of linkOverlays) {
    const [ex1, ey1, ex2, ey2] = bbox;
    const ew = ex2 - ex1;
    const eh = ey2 - ey1;
    if (ew <= 0 || eh <= 0) continue;
    const $aEl = $('<a/>').attr('href', url);
    // Move the text's parent <g> inside the <a> so CSS hover reaches <text> nodes
    if (textGroup && textGroup.type === 'tag') {
      const $textGroup = $(textGroup).remove();
      $aEl.append($textGroup);
    }
    const $rectEl = $('<rect/>').attr('x', ex1).attr('y', ey1)
      .attr('width', ew).attr('height', eh)
      .attr('fill', 'transparent').attr('stroke', 'none')
      .attr('style', 'cursor:pointer');
    $aEl.append($rectEl);
    $contentGroup.append($aEl);
  }

  $svg.append($contentGroup);

  // 4) Normalize viewBox to 0 0 w h; optional snap to integers if desired
  $svg.attr('viewBox', `0 0 ${rectW} ${rectH}`);
  $svg.removeAttr('width');
  $svg.removeAttr('height');
  $svg.attr('preserveAspectRatio', 'xMinYMin meet');

  // 5) Write output
  fs.writeFileSync(outputPath, $.xml($svg), 'utf8');
  console.log(`✔ Wrote ${outputPath}`);
  console.log(`   viewBox="0 0 ${rectW} ${rectH}" (rebased from ${rx1},${ry1})`);
  process.exit(0);
} catch (err) {
  console.error('✖', err.message);
  process.exit(1);
}