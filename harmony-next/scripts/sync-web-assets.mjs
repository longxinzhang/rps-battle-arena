import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const harmonyRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(harmonyRoot, '..');
const targetRoot = path.join(harmonyRoot, 'entry/src/main/resources/rawfile/world-rps');

const entries = ['index.html', 'css', 'js', 'assets'];

async function syncEntry(entry) {
  const source = path.join(repoRoot, entry);
  const target = path.join(targetRoot, entry);
  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true });
}

async function normalizeRawfileHtml() {
  const htmlPath = path.join(targetRoot, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  const normalized = html.replace(/src="js\/game\.js\?[^"]+"/, 'src="js/game.js"');
  await writeFile(htmlPath, normalized);
}

await mkdir(targetRoot, { recursive: true });
for (const entry of entries) {
  await syncEntry(entry);
}
await normalizeRawfileHtml();

console.log(`Synced Web assets to ${path.relative(repoRoot, targetRoot)}`);
