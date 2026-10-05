// Copies pdf.js runtime assets into /public/pdfjs so the browser can load them from stable URLs:
//   - pdf.worker.min.mjs  (rendering worker)
//   - standard_fonts/     (needed for PDFs that use non-embedded standard fonts)
//   - cmaps/              (needed for CID-keyed fonts, common in Indic-language PDFs)
// Runs automatically on `npm install` (postinstall) and before dev/build.
import { copyFileSync, cpSync, mkdirSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const pkgDir = path.dirname(require.resolve('pdfjs-dist/package.json'));
const destDir = path.resolve('public', 'pdfjs');
mkdirSync(destDir, { recursive: true });

copyFileSync(path.join(pkgDir, 'legacy', 'build', 'pdf.worker.min.mjs'), path.join(destDir, 'pdf.worker.min.mjs'));
cpSync(path.join(pkgDir, 'standard_fonts'), path.join(destDir, 'standard_fonts'), { recursive: true });
cpSync(path.join(pkgDir, 'cmaps'), path.join(destDir, 'cmaps'), { recursive: true });
console.log('pdf.js assets copied to public/pdfjs (worker, standard_fonts, cmaps)');
