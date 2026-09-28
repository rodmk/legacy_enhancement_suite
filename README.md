Legacy Enhancement Suite
========================
A userscript that adds shortcuts, previews, tracking, and other quality-of-life enhancements to [Legacy](https://www.legacy-game.net/).

Installation Instructions
-------------------------
### Chrome / Firefox
1. Install Tampermonkey for [Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/).
2. [Click here.](https://github.com/rodmk/legacy_enhancement_suite/raw/main/legacy_enhancement_suite.user.js)
3. Click on 'Install' when prompted.

### Internet Explorer / Safari / Other
1. Install [Chrome](https://www.google.com/chrome/) or [Firefox](https://www.mozilla.org/firefox/).
2. Refer to the Chrome/Firefox installation instructions above.

Features
--------
### Healing
- Adds `H` as a shortcut to perform a full heal outside text fields.
  - The shortcut is disabled while you are in the Wasteland.

### Item Previews
- Shows item details when hovering over items on player profiles, market stands, market setup, market storage, and market search results.
- Shows recent sales when hovering over a market History link.

### Market
- Selects the option to add or store all copies of an item by default.
- Selects the first item with a saved price when adding items to your stand, or the first item if none have a saved price.
- Reuses an item's price and currency when adding another copy to your stand.
- Adds `A` as a shortcut to add or store the selected item outside text fields.
- Restores your position on the page after withdrawing an item from your stand or storage.

### Top 10 Lists
- Adds a button to copy overall, weekly, and gang rankings as CSV.

### Flags
- Creates flags from uploaded or pasted images.
- Lets you choose and resize the part of the image to use, with an option to preserve its aspect ratio.
- Shows a preview before applying the flag.
- Applies grayscale or inverted-color effects.

### Hunting
- Shows your remaining inventory space after a hunt.
- Tracks drops and drop rates for normal and special hunts.
- Adds a button to copy your recorded hunt history as CSV.

### Wasteland
- Shows the surrounding map area when hovering over a gang attack alert in the combat log or gang chat.

### Combat
- Automatically fills the target box with the first player combat-search result.

### Casino
- Shows the recommended move on Black Jack hand pages, with win and push chances and expected token results for each available move.

Development
-----------
1. Run `npm ci` to install the development tools.
2. Run `npm run hooks:install` to enable the repository's pre-commit hook.

The pre-commit hook runs `npm run check`, which validates JavaScript syntax, runs ESLint, checks formatting with Prettier, and runs the blackjack solver tests. Run `npm run format` to apply the expected formatting.

The blackjack calculation lives in `scripts/blackjack-solver.mjs`. Run `npm run build:userscript` after changing it to update the embedded copy. The check command verifies that the copies agree. To inspect a hand directly:

```sh
node scripts/blackjack-cli.mjs '{"player":["Q","4"],"dealer":"A","bet":5}'
```

The solver uses one deck, dealer hits on soft 17, no splitting or dealer peek, and the casino's rule that any player 21 pushes a dealer blackjack. It chooses the move with the best expected token result. The optional `seen` field lists other exposed cards from the same deck.

Acknowledgements
----------------
Many thanks to langer and rollin340 for their various contributions to this project, in the form of suggestions, code contributions, bug testing, and documentation.
