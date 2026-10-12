import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guards for the wireframe-mode tool: it must stay copyable into any React
// prototype, small, and cheap while it idles. See
// `.cursor/skills/wireframe-mode/SKILL.md`.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolDir = resolve(root, 'src/prototype-settings');
// `mountDashboard.jsx` is this repo's Dashboard wiring; the tool is copied without it.
const REPO_ONLY = new Set(['mountDashboard.jsx']);
const sources = readdirSync(toolDir)
  .filter(name => /\.(jsx?|css)$/.test(name) && !REPO_ONLY.has(name))
  .map(name => ({ name, text: readFileSync(resolve(toolDir, name), 'utf8') }));
const code = sources.filter(({ name }) => name.endsWith('.js') || name.endsWith('.jsx'));
const read = name => sources.find(file => file.name === name).text;

// Bytes of source (JS, JSX and CSS, comments included). Raise it on purpose, not by accident.
const SOURCE_BUDGET_BYTES = 120_000;
const ALLOWED_PACKAGES = new Set(['react', 'react-dom', 'react-dom/client', 'modern-screenshot', 'react/jsx-runtime']);

test('the tool imports only its own folder and a short list of packages', () => {
  for (const { name, text } of code) {
    const specifiers = [...text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map(match => match[1]);
    for (const specifier of specifiers) {
      if (specifier.startsWith('./')) {
        assert.ok(!specifier.slice(2).includes('/'), `${name} reaches into a subfolder: ${specifier}`);
      } else {
        assert.ok(ALLOWED_PACKAGES.has(specifier), `${name} imports ${specifier}; the tool must stay copyable on its own`);
      }
    }
  }
});

test('every relative import resolves to a file in the folder', () => {
  const names = new Set(readdirSync(toolDir));
  for (const { name, text } of code) {
    for (const [, specifier] of text.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)) {
      const file = specifier.slice(2);
      assert.ok(
        names.has(file) || ['.js', '.jsx', '.css'].some(extension => names.has(file + extension)),
        `${name} imports ${specifier}, which isn't in src/prototype-settings`,
      );
      assert.ok(!REPO_ONLY.has(file), `${name} depends on ${file}, which isn't copied with the tool`);
    }
  }
});

test('the tool names no surface or app class in its code', () => {
  for (const { name, text } of sources) {
    const body = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    assert.doesNotMatch(body, /\.dash-|\.dashboard-|\.console-|data-dashboard|\bstripe\b/i, `${name} is coupled to an app`);
  }
});

test('the source stays within its size budget', () => {
  const bytes = sources.reduce((sum, { text }) => sum + Buffer.byteLength(text), 0);
  assert.ok(bytes <= SOURCE_BUDGET_BYTES, `tool source is ${bytes} bytes; budget is ${SOURCE_BUDGET_BYTES}`);
});

test('modern-screenshot loads on first export, never up front', () => {
  for (const { name, text } of code) {
    assert.doesNotMatch(text, /^import[^;]*from\s+['"]modern-screenshot['"]/m, `${name} imports modern-screenshot statically`);
  }
  assert.match(read('exportScreenshot.js'), /import\(\s*['"]modern-screenshot['"]\s*\)/);
});

test('idle cost guards stay in the engine', () => {
  const engine = read('wireframeEngine.js');
  // Hit tests go through one helper that tries the cheap lookup first.
  assert.equal(engine.match(/elementsFromPoint\(/g).length, 1, 'use pageElementAt for hit tests');
  assert.match(engine, /TICK_BUDGET_MS/);
  assert.match(engine, /ANIMATION_GAP_MS/);
  // The engine only redraws in response to something: `schedule` and `tick` (backoff
  // and settling) are the only places that ask for a frame. No free-running loop.
  const frames = engine.match(/requestAnimationFrame\(/g).length;
  assert.ok(frames <= 3, `the engine schedules frames in ${frames} places; keep redraws demand-driven`);
});

test('the pen animates on the compositor while wireframe is off', () => {
  const css = read('prototypeSettings.css');
  const pen = css.match(/\.ps-pen::after\s*\{[^}]*\}/);
  assert.ok(pen, '.ps-pen::after is missing');
  assert.match(pen[0], /transform:/);
  assert.doesNotMatch(css.match(/@keyframes ps-pen-shimmer\s*\{[\s\S]*?\n\}/)?.[0] ?? '', /mask-position|background-position/);
});

test('every prop is documented in the README table', () => {
  const component = read('PrototypeSettings.jsx');
  const signature = component.match(/export default function PrototypeSettings\(\{([\s\S]*?)\}\)/)[1];
  const props = [...signature.matchAll(/^\s*(\w+)/gm)].map(match => match[1]);
  const readme = readFileSync(resolve(toolDir, 'README.md'), 'utf8');
  for (const prop of props) assert.match(readme, new RegExp(`\\|\\s*\`${prop}\``), `README has no row for the ${prop} prop`);
});
