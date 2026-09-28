import assert from 'node:assert/strict';
import test from 'node:test';
import { solveBlackjack } from './blackjack-solver.mjs';

test('Q and 4 against an ace favors a hit and reports complete probabilities', () => {
  const answer = solveBlackjack({ player: ['Q', '4'], dealer: 'A' });
  assert.equal(answer.suggestedAction, 'hit');
  assert.equal(answer.suggestedWinProbability, answer.actions.hit.winProbability);
  assert.equal(answer.playerTotal, 14);
  assert.equal(answer.cardsRemaining, 49);
  assert.ok(Math.abs(answer.actions.hit.winProbability - 0.1605108156870218) < 1e-12);
  for (const outcome of Object.values(answer.actions)) {
    const sum = outcome.winProbability + outcome.pushProbability + outcome.lossProbability;
    assert.ok(Math.abs(sum - 1) < 1e-12);
  }
});

test('a natural wins unless the dealer also has blackjack', () => {
  const answer = solveBlackjack({ player: ['A', 'K'], dealer: 'A' });
  assert.equal(answer.suggestedAction, 'stand');
  assert.deepEqual(Object.keys(answer.actions), ['stand']);
  assert.ok(Math.abs(answer.actions.stand.winProbability - 34 / 49) < 1e-12);
  assert.ok(Math.abs(answer.actions.stand.expectedProfitPerInitialBet - (1.5 * 34) / 49) < 1e-12);
});

test('odd bets round down natural blackjack winnings', () => {
  const answer = solveBlackjack({ player: ['A', 'K'], dealer: '5', bet: 5 });
  assert.equal(answer.actions.stand.winProbability, 1);
  assert.equal(answer.actions.stand.expectedProfitTokens, 7);
});

test('doubling is only offered with two initial cards', () => {
  const opening = solveBlackjack({ player: ['5', '6'], dealer: '6' });
  assert.equal(opening.suggestedAction, 'double');
  assert.ok(
    Math.abs(opening.actions.double.expectedProfitPerInitialBet - 0.7578170140082809) < 1e-12,
  );
  const later = solveBlackjack({ player: ['2', '4', '5'], dealer: '6' });
  assert.deepEqual(Object.keys(later.actions), ['stand', 'hit']);
  const disabled = solveBlackjack({ player: ['5', '6'], dealer: '6', canDouble: false });
  assert.deepEqual(Object.keys(disabled.actions), ['stand', 'hit']);
});

test('dealer blackjack pushes any player 21, including a three-card 21', () => {
  const answer = solveBlackjack({ player: ['7', '7', '7'], dealer: 'A' });
  assert.equal(answer.suggestedAction, 'stand');
  assert.ok(answer.actions.stand.pushProbability >= 16 / 48);
});

test('no dealer peek makes hitting preferable to doubling 11 against an ace', () => {
  const answer = solveBlackjack({ player: ['5', '6'], dealer: 'A' });
  assert.equal(answer.suggestedAction, 'hit');
  assert.ok(
    answer.actions.hit.expectedProfitPerInitialBet >
      answer.actions.double.expectedProfitPerInitialBet,
  );
});

test('known exposed cards change the conditional odds', () => {
  const baseline = solveBlackjack({ player: ['Q', '4'], dealer: 'A' });
  const known = solveBlackjack({ player: ['Q', '4'], dealer: 'A', seen: ['10', 'J', 'K'] });
  assert.equal(known.cardsRemaining, 46);
  assert.notEqual(known.actions.hit.winProbability, baseline.actions.hit.winProbability);
});

test('rejects states that cannot come from a single deck', () => {
  assert.throws(
    () => solveBlackjack({ player: ['A', 'A'], dealer: 'A', seen: ['A', 'A'] }),
    /exceed one deck/,
  );
  assert.throws(
    () => solveBlackjack({ player: ['Q', 'Q'], dealer: 'Q', seen: ['Q', 'Q'] }),
    /exceed one deck/,
  );
  assert.throws(() => solveBlackjack({ player: ['5'], dealer: '6' }), /at least two/);
  assert.throws(
    () => solveBlackjack({ player: ['5', '6', '2'], dealer: '6', canDouble: true }),
    /canDouble/,
  );
  assert.throws(() => solveBlackjack({ player: ['5', '6'], dealer: '6', bet: 2.5 }), /bet/);
  assert.throws(() => solveBlackjack({ player: ['5', '6'], dealer: '6', bet: 4 }), /bet/);
  assert.throws(() => solveBlackjack({ player: ['5', '6'], dealer: '6', bet: 151 }), /bet/);
});
