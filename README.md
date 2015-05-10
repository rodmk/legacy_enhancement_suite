Legacy Enhancement Suite
========================
Simple userscript that provides a variety of tweaks, enhacements, and fixes for [Legacy Game](http://legacy-game.net/).

Installation Instructions
-------------------------
### Firefox / Chrome
1. **Firefox**: Install [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) / **Chrome**: Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
2. [Click here.](https://github.com/rodmk/legacy_enhancement_suite/raw/master/legacy_enhancement_suite.user.js)
3. Click on 'Install' when prompted.

### Internet Explorer / Safari / Other
1. Install [Firefox](https://www.mozilla.org/firefox/) or [Chrome](https://www.google.com/chrome/).
2. Refer to the Firefox/Chrome installation instructions above.

Features
--------
### General Layout
- Adds links to the following:
 - Character image to character design page.
 - Level box to stat point allocation page.
 - Player flag to flag editor.
 - Energy count to Job Center or Observatory depending on level.
 - Credits count to Bank.
 - Tokens count to Casino.

### Healing
- If "Hospital" is a Quick Link, a new "(Heal)" link is created beside it.
 - *This link is essentially a full heal.
 - *Sanctuary of Healing will not have the same effect; the Quick Link is too long.
- Binds the "H" key on your keyboard to a full heal.
 - As long as you are not in a text box and press "H", you will make a full heal.
 - *Makes the above kind of redundant, but it's there if you like clicking.

### Player Profile
- You can now hover over Items in Players' Profiles to view it's details as a tool-tip.
- Player EXP when hovered over now has "," for easier viewing.
- The weekly points earned in the "Honor" Tab in Players' Profiles now has "," for easier viewing.

### Market
- You can now hover over Items searched to view it's details as a tooltip.
 - Has the potential to return wrong data; check before purchasing.
- In the event you are adding an Item that is already found in your stand, the price field will be automatically filled to fit the existing price.
- Binds the "A" key on your keyboard to add the selected item to your stand.
As long as you are not in a text box and press "A", the item will be added to the stand; provided the price field is not invalid.
- When taking an Item from your stand or storage, your page will scroll back down to the same position; you no longer have to keep scrolling to find the same item.

### Messaging
- A confirmation box will appear when deleting Private Mails.

### Abilities
- Fully Trained Abilities no longer show up in the drop-down menu.

### Top 10 Lists
- Creates 10 entries for the Top 10 separated by semi-colons for easy copy-pasting.
 - Example: 1;PlayerName;Points
 - This is available for all 6 Top 10 tables & the 2 Top 10 tables for Gangs.

### Jobs
- Automatically selects the maximum amount of times you can work with your current turns.

### Platinum Market
- All timers that show how long a Boost remains unlocked is now shown in months, weeks, days and hours instead of just hours.

### Voting
- A "!" will appear next to the "Community" Tab if you are able to Vote.

### Flags
- You can now upload Flags.
 - Images are converted automatically.
 - You can choose which part of the image is to be converted to the Flag.

### Hunting
- A "!" will appear next to the "Hunting" Tab if you are able to hunt a Special NPC.
- Allows the player to Hunt the same Hunting Group on the same page as the final hit that results in victory.
- Allows the player to combine a Crystal that just dropped with another if found in your Inventory.
- Shows remaining inventory spaces left after hunting.
- Tracks drops by hunting groups and shows drops and drop rates in the hunting page.

### Wastelands
- You can now hover over specific Squares to view it's coordinates as a tooltip.
- If "Wastelands" is a Quick Link, new "(Enter)" or "(Exit)" links are created beside it, depending on whether you're outside or inside the wasteland, respectively. This link lets you quickly enter/exit the wasteland. *Note: This functionality requires your character portrait to be visible to work.*
- Hovering over a Gang Alert now shows a 3x3 grid of the area that was Alerted.

### Combat
- Attack Buttons are now rendered un-clickable when clicked once. This prevents multiple clicks which may break fights (multi-attack error).
- Show the combat search results page by default.
- Automatically fill in the first combat search result in the target box.

Acknowledgements
----------------
Many thanks to langer and rollin340 for their various contributions to this project, in the form of suggestions, code contributions, bug testing, and documentation.
