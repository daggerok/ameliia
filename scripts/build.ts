/// <reference types="bun" />
/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

// Builds the latest version (src/) into dist/, every archived versions/v0.N into dist/v0.N/
// and a list of all of them into dist/v/
// Usage: bun scripts/build.ts [public-url], e.g. /ameliia/ for GitHub Pages
const base = (process.argv[2] ?? '/').replace(/\/?$/, '/');

const parcel = (entry: string, distDir: string, publicUrl: string) => {
    console.log(`\n${entry} -> ${distDir} (${publicUrl})`);
    const { exitCode } = Bun.spawnSync(
        ['bunx', 'parcel', 'build', entry, '--no-cache', '--no-source-maps', '--dist-dir', distDir, '--public-url', publicUrl],
        { stdout: 'inherit', stderr: 'inherit' },
    );
    if (exitCode !== 0) process.exit(exitCode || 1);
};

const versions = readdirSync('versions')
    .filter(v => /^v0\.\d+$/.test(v))
    .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));

rmSync('dist', { recursive: true, force: true });
parcel('src/index.html', 'dist', base);
for (const v of versions) parcel(`versions/${v}/index.html`, `dist/${v}`, `${base}${v}/`);

// Labels are optional: a folder missing from versions.json falls back to its <title>
type Label = { date?: string; title?: string };
const labels: Record<string, Label> = existsSync('versions/versions.json')
    ? JSON.parse(readFileSync('versions/versions.json', 'utf8'))
    : {};
const titleOf = (html: string) => readFileSync(html, 'utf8').match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? '';
const escape = (s: string) => s.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
const item = (href: string, name: string, html: string) => {
    const { date = '', title = titleOf(html) } = labels[name] ?? {};
    return `<li><a href="${href}"><b>${name}</b><span>${escape(title)}</span><time>${date}</time></a></li>`;
};
const items = [
    item('../', 'latest', 'src/index.html'),
    ...[...versions].reverse().map(v => item(`../${v}/`, v, `versions/${v}/index.html`)),
];
mkdirSync('dist/v', { recursive: true });
writeFileSync('dist/v/index.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ameliia versions</title>
<style>
:root { --bg: #f8fafc; --card: #fff; --text: #0f172a; --muted: #64748b; --line: #e2e8f0; --accent: #4f46e5; color-scheme: light dark }
@media (prefers-color-scheme: dark) { :root { --bg: #0f172a; --card: #1e293b; --text: #f1f5f9; --muted: #94a3b8; --line: #334155; --accent: #818cf8 } }
* { box-sizing: border-box }
body { margin: 0; padding: 24px 16px; background: var(--bg); color: var(--text); font: 16px/1.4 system-ui, -apple-system, sans-serif }
main { max-width: 28rem; margin: 0 auto }
h1 { margin: 0 0 16px; font-size: 1.25rem }
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px }
a { display: grid; grid-template-columns: 4.5rem 1fr; gap: 2px 12px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); color: inherit; text-decoration: none }
a:hover, a:focus-visible { border-color: var(--accent); outline: none }
b { color: var(--accent); grid-row: span 2; align-self: center }
time { color: var(--muted); font-size: .85rem }
</style>
</head>
<body>
<main>
<h1>Ameliia versions</h1>
<ul>
${items.join('\n')}
</ul>
</main>
</body>
</html>
`);
console.log(`\nbuilt latest + ${versions.join(', ')} + v/`);
