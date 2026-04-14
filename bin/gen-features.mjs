#!/usr/bin/env node
// Generates src/data/features.ts from src/data/features.yaml.
// Run automatically via prestart/prebuild npm scripts.

import { readFileSync, writeFileSync } from 'fs';
import { load } from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const yamlPath = join(root, 'src', 'data', 'features.yaml');
const tsPath = join(root, 'src', 'data', 'features.ts');

const data = load(readFileSync(yamlPath, 'utf8'));

const ts = `// AUTO-GENERATED — edit src/data/features.yaml instead
// Run \`npm run gen-features\` (or npm start/build) to regenerate.

export type Level = 'oss' | 'ea';

export const LEVEL_LABELS: Record<Level, string> = {
    oss: 'k8shell OSS',
    ea:  'Early Access',
};

export type LevelEntry = { [K in Level]?: boolean };

export interface FeatureTable {
    id: string;
    name: string;
    levels: LevelEntry[];
    items: string[];
}

export interface FeaturesData {
    tables: FeatureTable[];
}

const features: FeaturesData = ${JSON.stringify(data, null, 4)};

export default features;
`;

writeFileSync(tsPath, ts, 'utf8');
console.log('[gen-features] wrote', tsPath);
