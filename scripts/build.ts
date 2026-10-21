/// <reference types="bun" />
/// <reference types="node" />
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

// Builds the current version (src/) into dist/, every backups/vYYYYMMDD-suffix
// into dist/vYYYYMMDD-suffix/ (suffix is one lowercase word) and a list of all of them into dist/backups/
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

// Everything comes from the files: a backup's date from its folder name, its title from its first <title>,
// the latest version's name from <meta name="version" content="vYYYYMMDD-suffix"> in src/index.html
const read = (html: string) => readFileSync(html, 'utf8');
const titleOf = (html: string) => read(html).match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? '';
const dateOf = (v: string) => v.replace(/^v(\d{4})(\d{2})(\d{2}).*$/, '$1-$2-$3');
const VERSION = /^v\d{8}-[a-z0-9]+$/;

const folders = readdirSync('backups', { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
const wrong = folders.filter(v => !VERSION.test(v));
if (wrong.length) throw new Error(`backups/ folders must be named vYYYYMMDD-suffix: ${wrong.join(', ')}`);
const backups = folders.sort();
const latest = read('src/index.html').match(/<meta name="version" content="([^"]*)">/)?.[1] ?? '';
if (!VERSION.test(latest)) throw new Error('src/index.html needs <meta name="version" content="vYYYYMMDD-suffix">');
if (backups.includes(latest)) throw new Error(`backups/${latest} clashes with the latest version`);

rmSync('dist', { recursive: true, force: true });
parcel('src/index.html', 'dist', base);
for (const v of backups) parcel(`backups/${v}/index.html`, `dist/${v}`, `${base}${v}/`);

const escape = (s: string) => s.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
const item = (href: string, name: string, version: string, html: string) =>
    `<li><a href="${href}"><b>${name}</b><time>${dateOf(version)}</time><span>${escape(titleOf(html))}</span><code>${href}</code></a></li>`;
const items = [
    item(base, 'latest', latest, 'src/index.html'),
    ...[...backups].reverse().map(v => item(`${base}${v}/`, v, v, `backups/${v}/index.html`)),
];
mkdirSync('dist/backups', { recursive: true });
writeFileSync('dist/backups/index.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ameliia backups</title>
<style>
:root { --bg: #f8fafc; --card: #fff; --text: #0f172a; --muted: #64748b; --line: #e2e8f0; --accent: #4f46e5; color-scheme: light dark }
@media (prefers-color-scheme: dark) { :root { --bg: #0f172a; --card: #1e293b; --text: #f1f5f9; --muted: #94a3b8; --line: #334155; --accent: #818cf8 } }
* { box-sizing: border-box }
body { margin: 0; padding: 24px 16px; background: var(--bg); color: var(--text); font: 16px/1.4 system-ui, -apple-system, sans-serif }
main { max-width: 30rem; margin: 0 auto }
h1 { margin: 0 0 16px; font-size: 1.25rem }
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px }
a { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); color: inherit; text-decoration: none }
a:hover, a:focus-visible { border-color: var(--accent); outline: none }
b { color: var(--accent); overflow-wrap: anywhere }
time { color: var(--muted); font-size: .85rem; text-align: right }
span, code { grid-column: 1 / -1 }
span { font-size: .95rem }
code { color: var(--muted); font: .8rem ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere }
</style>
</head>
<body>
<main>
<h1>Ameliia backups</h1>
<ul>
${items.join('\n')}
</ul>
</main>
</body>
</html>
`);
console.log(`\nbuilt latest (${latest}), ${backups.join(', ')} + backups/`);
