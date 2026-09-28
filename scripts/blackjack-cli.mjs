import { solveBlackjack } from './blackjack-solver.mjs';

try {
  const state = JSON.parse(process.argv[2] ?? '');
  console.log(JSON.stringify(solveBlackjack(state), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
