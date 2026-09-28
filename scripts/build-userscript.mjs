import { readFile, writeFile } from 'node:fs/promises';
import prettier from 'prettier';

const userscriptPath = new URL('../legacy_enhancement_suite.user.js', import.meta.url);
const solverPath = new URL('./blackjack-solver.mjs', import.meta.url);
const startMarker = '// BEGIN GENERATED BLACKJACK SOLVER';
const endMarker = '// END GENERATED BLACKJACK SOLVER';

const userscript = await readFile(userscriptPath, 'utf8');
const source = await readFile(solverPath, 'utf8');
const start = userscript.indexOf(startMarker);
const end = userscript.indexOf(endMarker);
if (start === -1 || end === -1 || end <= start) {
  throw new Error('Blackjack solver markers are missing or out of order');
}
const browserSource = source.replace('export function solveBlackjack', 'function solveBlackjack');
if (browserSource === source) throw new Error('Blackjack solver export was not found');
const generated = await prettier.format(
  `var blackjackSolveHand = (function () {\n${browserSource}\nreturn solveBlackjack;\n})();`,
  { filepath: userscriptPath.pathname, singleQuote: true, printWidth: 100 },
);
const updated =
  userscript.slice(0, start + startMarker.length) +
  '\n' +
  generated.trimEnd() +
  '\n' +
  userscript.slice(end);
if (process.argv.includes('--check')) {
  if (userscript !== updated) {
    throw new Error('Embedded blackjack solver is out of date; run npm run build:userscript');
  }
} else {
  await writeFile(userscriptPath, updated);
}
