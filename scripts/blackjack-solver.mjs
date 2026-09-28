const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FULL_DECK = [4, 4, 4, 4, 4, 4, 4, 4, 4, 16];
const ACTION_ORDER = ['stand', 'hit', 'double'];

function cardRank(card) {
  const rank = String(card)
    .trim()
    .toUpperCase()
    .replace(/[♠♥♦♣]$/, '');
  if (rank === 'A') return rank;
  if (rank === 'T') return '10';
  if (['10', 'J', 'Q', 'K'].includes(rank)) return rank;
  const value = Number(rank);
  if (Number.isInteger(value) && value >= 2 && value <= 9) return String(value);
  throw new Error(`Invalid card: ${card}`);
}

function cardValue(card) {
  const rank = cardRank(card);
  return rank === 'A' ? 1 : ['10', 'J', 'Q', 'K'].includes(rank) ? 10 : Number(rank);
}

function handState(cards) {
  let hard = 0;
  let aces = 0;
  for (const card of cards) {
    const value = cardValue(card);
    hard += value;
    if (value === 1) aces++;
  }
  return { hard, aces };
}

function total(hard, aces) {
  return hard + (aces && hard + 10 <= 21 ? 10 : 0);
}

function removeCard(counts, index) {
  const next = counts.slice();
  next[index]--;
  return next;
}

function blankOutcomes() {
  // Bust, 17, 18, 19, 20, 21.
  return [0, 0, 0, 0, 0, 0];
}

function addWeighted(target, source, weight) {
  for (let i = 0; i < target.length; i++) target[i] += source[i] * weight;
}

function result(win, push, expectedProfit) {
  return {
    winProbability: win,
    pushProbability: push,
    lossProbability: Math.max(0, 1 - win - push),
    expectedProfitPerInitialBet: expectedProfit,
  };
}

/**
 * Solve one Legacy casino blackjack decision from the exposed cards.
 * All probabilities are conditional on the supplied visible cards. Unknown
 * dealer cards are integrated over the remaining single deck.
 */
export function solveBlackjack({ player, dealer, seen = [], canDouble, bet } = {}) {
  if (!Array.isArray(player) || player.length < 2) {
    throw new Error('player must contain at least two cards');
  }
  if (!Array.isArray(seen)) throw new Error('seen must be an array');
  if (dealer === undefined) throw new Error('dealer upcard is required');
  const doubleAllowed = canDouble ?? player.length === 2;
  if (typeof doubleAllowed !== 'boolean' || (doubleAllowed && player.length !== 2)) {
    throw new Error('canDouble requires exactly two player cards');
  }
  if (bet !== undefined && (!Number.isSafeInteger(bet) || bet < 5 || bet > 150)) {
    throw new Error('bet must be an integer from 5 to 150');
  }

  const counts = FULL_DECK.slice();
  const ranksSeen = new Map();
  for (const card of [...player, dealer, ...seen]) {
    const rank = cardRank(card);
    ranksSeen.set(rank, (ranksSeen.get(rank) ?? 0) + 1);
    if (ranksSeen.get(rank) > 4) throw new Error('Visible cards exceed one deck');
    const index = VALUES.indexOf(cardValue(card));
    if (--counts[index] < 0) throw new Error('Visible cards exceed one deck');
  }
  const dealerUp = cardValue(dealer);
  const initial = handState(player);
  if (total(initial.hard, initial.aces) > 21) {
    throw new Error('Player hand is already bust');
  }
  const dealerMemo = new Map();
  const outcomeMemo = new Map();
  const playerMemo = new Map();

  function dealerFinish(deck, hard, aces) {
    const key = `${deck.join(',')}:${hard}:${aces}`;
    if (dealerMemo.has(key)) return dealerMemo.get(key);
    const score = total(hard, aces);
    const outcomes = blankOutcomes();
    if (score > 21) {
      outcomes[0] = 1;
    } else if (score >= 18 || (score === 17 && !(aces && hard === 7))) {
      outcomes[score - 16] = 1;
    } else {
      const remaining = deck.reduce((sum, count) => sum + count, 0);
      if (!remaining) throw new Error('Not enough cards for dealer to finish');
      for (let i = 0; i < deck.length; i++) {
        if (deck[i]) {
          addWeighted(
            outcomes,
            dealerFinish(removeCard(deck, i), hard + VALUES[i], aces + (i === 0)),
            deck[i] / remaining,
          );
        }
      }
    }
    dealerMemo.set(key, outcomes);
    return outcomes;
  }

  function dealerOutcomes(deck) {
    const key = deck.join(',');
    if (outcomeMemo.has(key)) return outcomeMemo.get(key);
    const remaining = deck.reduce((sum, count) => sum + count, 0);
    if (!remaining) throw new Error('No cards remain for dealer');
    const outcomes = blankOutcomes();
    for (let i = 0; i < deck.length; i++) {
      if (deck[i]) {
        addWeighted(
          outcomes,
          dealerFinish(removeCard(deck, i), dealerUp + VALUES[i], (dealerUp === 1) + (i === 0)),
          deck[i] / remaining,
        );
      }
    }
    outcomeMemo.set(key, outcomes);
    return outcomes;
  }

  function stand(deck, hard, aces) {
    const score = total(hard, aces);
    if (score > 21) return result(0, 0, -1);
    const outcomes = dealerOutcomes(deck);
    let win = outcomes[0];
    for (let dealerScore = 17; dealerScore < score; dealerScore++) {
      win += outcomes[dealerScore - 16];
    }
    const push = score >= 17 ? outcomes[score - 16] : 0;
    return result(win, push, 2 * win + push - 1);
  }

  function best(deck, hard, aces) {
    const key = `${deck.join(',')}:${hard}:${aces}`;
    if (playerMemo.has(key)) return playerMemo.get(key);
    const choices = { stand: stand(deck, hard, aces), hit: draw(deck, hard, aces, false) };
    const chosen = ACTION_ORDER.filter((action) => choices[action]).reduce((bestAction, action) =>
      choices[action].expectedProfitPerInitialBet > choices[bestAction].expectedProfitPerInitialBet
        ? action
        : bestAction,
    );
    playerMemo.set(key, choices[chosen]);
    return choices[chosen];
  }

  function draw(deck, hard, aces, doubling) {
    const remaining = deck.reduce((sum, count) => sum + count, 0);
    if (!remaining) throw new Error('No cards remain to draw');
    let win = 0;
    let push = 0;
    let expectedProfit = 0;
    for (let i = 0; i < deck.length; i++) {
      if (!deck[i]) continue;
      const nextHard = hard + VALUES[i];
      const nextAces = aces + (i === 0);
      const nextDeck = removeCard(deck, i);
      const next =
        total(nextHard, nextAces) > 21
          ? result(0, 0, -1)
          : doubling
            ? stand(nextDeck, nextHard, nextAces)
            : best(nextDeck, nextHard, nextAces);
      const weight = deck[i] / remaining;
      win += weight * next.winProbability;
      push += weight * next.pushProbability;
      expectedProfit += weight * next.expectedProfitPerInitialBet;
    }
    return result(win, push, expectedProfit * (doubling ? 2 : 1));
  }

  const natural = player.length === 2 && total(initial.hard, initial.aces) === 21;
  if (natural) {
    const remaining = counts.reduce((sum, count) => sum + count, 0);
    const dealerBlackjack =
      dealerUp === 1 ? counts[9] / remaining : dealerUp === 10 ? counts[0] / remaining : 0;
    const win = 1 - dealerBlackjack;
    const naturalProfit = bet === undefined ? 1.5 : Math.floor(1.5 * bet) / bet;
    const standResult = result(win, dealerBlackjack, naturalProfit * win);
    if (bet !== undefined)
      standResult.expectedProfitTokens = standResult.expectedProfitPerInitialBet * bet;
    return {
      suggestedAction: 'stand',
      suggestedWinProbability: standResult.winProbability,
      actions: { stand: standResult },
      playerTotal: 21,
      soft: true,
      cardsRemaining: remaining,
    };
  }

  const actions = {
    stand: stand(counts, initial.hard, initial.aces),
    hit: draw(counts, initial.hard, initial.aces, false),
  };
  if (doubleAllowed) actions.double = draw(counts, initial.hard, initial.aces, true);
  if (bet !== undefined) {
    for (const choice of Object.values(actions)) {
      choice.expectedProfitTokens = choice.expectedProfitPerInitialBet * bet;
    }
  }
  const suggestedAction = ACTION_ORDER.filter((action) => actions[action]).reduce(
    (bestAction, action) =>
      actions[action].expectedProfitPerInitialBet > actions[bestAction].expectedProfitPerInitialBet
        ? action
        : bestAction,
  );
  return {
    suggestedAction,
    suggestedWinProbability: actions[suggestedAction].winProbability,
    actions,
    playerTotal: total(initial.hard, initial.aces),
    soft: initial.aces > 0 && initial.hard + 10 <= 21,
    cardsRemaining: counts.reduce((sum, count) => sum + count, 0),
  };
}
