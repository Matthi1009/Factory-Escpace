// Prüft die Modulgrenzen: Kein Feature-Modul darf aus einem anderen Feature-Ordner importieren.
// Läuft automatisch bei `npm run build`. Keine Abhängigkeiten, nur Node.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const featuresDir = join(root, 'src', 'features');
const coreDir = join(root, 'src', 'core');
const importRe = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (/\.(ts|tsx|js|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const errors = [];
function check(file, isAllowed) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(importRe)) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (!spec.startsWith('.')) continue;
    const target = resolve(dirname(file), spec);
    const msg = isAllowed(target);
    if (msg) errors.push(`${relative(root, file)}: import '${spec}' – ${msg}`);
  }
}

// Feature-Module: nur eigener Ordner + core
for (const mod of readdirSync(featuresDir)) {
  const modDir = join(featuresDir, mod);
  if (!statSync(modDir).isDirectory()) continue;
  for (const file of walk(modDir)) {
    check(file, (target) => {
      if (target.startsWith(modDir + sep) || target === modDir) return null;
      if (target.startsWith(coreDir + sep) || target === coreDir) return null;
      return 'Feature-Module dürfen nur aus dem eigenen Ordner und aus src/core importieren';
    });
  }
}
// Core: darf nie aus Features importieren
for (const file of walk(coreDir)) {
  check(file, (target) =>
    target.startsWith(featuresDir + sep) ? 'src/core darf nicht aus src/features importieren' : null,
  );
}

if (errors.length) {
  console.error('Modulgrenzen verletzt:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('Modulgrenzen ok.');
