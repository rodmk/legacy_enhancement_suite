/**
 * Copyright (C) 2014 Rodrigo Muñoz <rod@rmk.pw>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// ==UserScript==
// @name        Legacy Enhancement Suite
// @namespace   LES
// @description Improvements to Legacy Game
// @include     http://www.legacy-game.net/*
// @include     http://dev.legacy-game.net/*
// @version     0.0.22
// @grant       none
// @require     http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.10.4/jquery-ui.js
// @require     https://raw.githubusercontent.com/rodmk/locache/master/locache.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/mousetrap/1.4.6/mousetrap.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/sprintf/0.0.7/sprintf.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/URI.js/1.11.2/URI.min.js
// ==/UserScript==

// =============================================================================
//                              Script Set-Up
// =============================================================================
// Avoid conflicting with page's jQuery
this.$ = this.jQuery = jQuery.noConflict(true);
// Clear out expired cache values
locache.cleanup();

// =============================================================================
//                            Primary Entry Point
// =============================================================================
/**
 * Registers a function to be executed on pages where the path matches path
 * rules, where path_rules is an array of regexes. For example,
 * registerFunction(foo, ['bar.php', 'baz.php']) will register foo to be run
 * on bar.php and baz.php.
 */
var function_registry = {};
function registerFunction(fn, path_rules) {
  assert(
    path_rules !== undefined && path_rules.length > 0,
    'path_rules cannot be empty'
  );

  $.each(path_rules, function(i, rule) {
    if (rule in function_registry) {
      function_registry[rule].push(fn);
    } else {
      function_registry[rule] = [fn];
    }
  });
}

/**
 * Executes registered functions based on current path.
 */
function executeFunctions() {
  var current_path = window.location.pathname;
  $.each(function_registry, function(rule, fns) {
    if (current_path.match(rule)) {
      $.each(fns, function() {
        // Log error messages if an individual function fails, but don't stop
        // execution on exception.
        try {
          this();
        } catch (e) {
          console.error(e.message);
        }
      });
    }
  });
}
$(document).ready(executeFunctions);

// =============================================================================
//                               General Layout
// =============================================================================
/**
 * FEATURE: If there's a quick link to hospital/sanctuary of healing, adds a
 * 'heal' link (actually an ajax call) right next to it.
 */
registerFunction(function addQuickHealLink() {
  var hospital_node = $('a[href="hospital.php"]');
  var heal_me_link = $('<a>', { text: ' (Heal)', href: '#' });
  heal_me_link.click(function() { fullHeal(); return false; });
  hospital_node.after(heal_me_link);
}, [ ".*" ]);

/**
 * FEATURE: Binds 'h' to full heal.
 */
registerFunction(function addQuickHealKeybinding() {
  Mousetrap.bind('h', fullHeal);
}, [ ".*" ]);

/**
 * @return {string} Secret key use for Hospital operations
 */
function getHospitalKey() {
  return cachedFetch("hospital:key", SEC_IN_HOUR, function() {
    var hospital_key;
    $.ajax({
      url: "/hospital.php",
      async: false,
      success: function(data) {
        // Fetch the key from any uri containing the key param in the page
        var uri = URI($(data).find("a[href*=key]:first")[0].href);
        hospital_key = uri.query(true).key;
      },
    });
    return hospital_key;
  });
}

/**
 * Heals the player fully via hospital/sanctuary
 */
function fullHeal() {
  var uri = URI("/hospital.php")
    .query({ m: 1, key: getHospitalKey() });
  $.get(uri.href());
}

/**
 * FEATURE: Adds tooltip hovercards to player items.
 */
registerFunction(function addItemHovercards() {
  $('a[href*="javascript:modelesswin"]').each(function() {
    var equipData;
    $(this)
      .mouseover(function() {
        if (!equipData) {
          $.ajax({
            url: $(this).attr('href').match(/'(.*)'/).pop(),
            async: false,
            success: function(data) {
              equipData = $('center', data).html();
            }
          });
        }
        ddrivetip(equipData, 450);
      })
      .mouseout(hideddrivetip);
  });
}, [ "profile.php", "market2.php", "market3.php", "market6.php" ]);

/**
 * FEATURE: Adds an exclamation icon next to the fighting tab if the special
 * NPC hunt timer is up.
 */
registerFunction(function addSpecialHuntNotification() {
  var next_hunt_time = getNextSpecialHuntTime();
  if (Date.now() >= next_hunt_time) {
    var fighting_tab = $('img[alt="Fighting"]');
    var exclamation;
    exclamation = fontAwesomeIcon('fa-exclamation-circle').css({
      'float': 'left',
      'left': '8px',
      'position': 'relative',
      'top': '5px',
    });
    fighting_tab.after(exclamation);

    var hunting_link = $(':contains("NPC Hunting"):last');
    exclamation = fontAwesomeIcon('fa-exclamation-circle').css({
      'float': 'right',
      'position': 'relative',
      'right': '3px',
    });
    hunting_link.append(exclamation);
  }
}, [ ".*" ]);

/**
 * Fetches the earliest time (unixtime, in ms) one can hunt a special NPC.
 * Note that this is only going to be accurate to about the smallest time unit
 * present on the hunting page.
 */
function getNextSpecialHuntTime() {
  function computeNextSpecialHuntTime(data) {
    // Check to see if player is capable of hunting special characters in
    // the first place. If not, return a time far in the future.
    if (!$('font:contains("Special Character Hunting")', data).length) {
      return Number.MAX_VALUE;
    }

    var next_hunt_str = $('font:contains("can hunt again")', data).text();
    var days = next_hunt_str.match(/(\d+) day/);
    if (days) { days = parseInt(days[1]); }
    var hours = next_hunt_str.match(/(\d+) hour/);
    if (hours) { hours = parseInt(hours[1]); }
    var minutes = next_hunt_str.match(/(\d+) minute/);
    if (minutes) { minutes = parseInt(minutes[1]); }
    var seconds = next_hunt_str.match(/(\d+) second/);
    if (seconds) { seconds = parseInt(seconds[1]); }

    var sec_until_hunt =
      (days * SEC_IN_DAY) +
      (hours * SEC_IN_HOUR) +
      (minutes * SEC_IN_MINUTE) +
      seconds;
    var next_hunt_time = sec_until_hunt * MS_IN_SEC + Date.now();
    return next_hunt_time;
  }

  var next_hunt_time = cachedFetchWithRefresh(
    "hunting:specialhunttime",
    6 * SEC_IN_HOUR,
    "/hunting.php",
    computeNextSpecialHuntTime
  );

  return next_hunt_time;
}

// =============================================================================
//                                Profiles
// =============================================================================
/**
 * Various profile page tweaks.
 */
registerFunction(function setUpProfile() {
  // FEATURE: Format exp counts to include commas.
  $('img[title*="Exp :"]').each(function(){
    $(this)
      .attr('title',$(this).attr('title').replace(/\B(?=(\d{3})+(?!\d))/g, ","))
      .attr('alt',$(this).attr('title'));
  });
}, [ "profile.php" ]);

// =============================================================================
//                                Messages
// =============================================================================
/**
 * FEATURE: Adds confirmation dialog when deleting messages.
 */
registerFunction(function addDeleteMessageConfirm() {
  $('a[href*="messages4.php"]').each(function() {
    $(this).click(function() {
      return confirm("Delete Mail?");
    });
  });

  // For the checkbox delete link, override the onclick event handler with the
  // confirm dialog.
  $('a[onclick*="submitchecks(\'delete\');"]').each(function() {
    var clickhandler = $(this)[0].onclick;
    $(this).attr("onclick", "return false;");

    $(this).click(function() {
      if (confirm("Delete Mail?")) {
        return clickhandler();
      }
    });
  });
}, [ "messages.php" ]);


// =============================================================================
//                                  Market
// =============================================================================
registerFunction(function setUpStand() {
  // FEATURE: When selecting items from your inventory, if you already have that
  // item in your stand, copy over the price/currency for it.
  var item_selector = $('select[name="item"]');
  item_selector.change(function () {
    var selected_item = $.trim($(this).find("option:selected").text());
    var price_text = $("font.darktext > font:contains('"+selected_item+"')")
      .closest('tbody')
      .find("font:contains('each')");
    var num, currency;
    if (price_text.size()) {
      price_text = $.trim(price_text.first().text());
      var match = price_text.match(/(\d+)([cp]) each/);
      num = match[1];
      currency = match[2];
    } else {
      num = null;
      currency = 'c';
    }
    $('input[name="price"]').val(num);
    $('input[select="currency"]').val(currency === 'c' ? 1 : 2);
  });

  // FEATURE: Automatically select by default the first non-null item.
  var map = selectToMap(item_selector);
  $.each(map, function(key, value){
    if ($.trim(value) !== "None") {
      item_selector.val(key).change();
      return false;
    }
  });

  // FEATURE: Auto-check add all items with the same price by default.
  $('input[name="multi"]').prop('checked', true);

  // FEATURE: Bind 'a' to 'add item' button.
  Mousetrap.bind('a', _.once(function() {
    var add_btn = $('input[value="Add Item"]');
    add_btn.click();
  }));

  // FEATURE: Maintain scroll position after taking item from stand.
  // Makes taking consecutive items of the same type a little easier.
  // When we take an item, we store the scroll position. When we arrive back at
  // the page, we restore the scroll position and clear the storage.
  var MARKET_SCROLL_KEY = "market:scrollpos";
  var scroll_pos = locache.session.get(MARKET_SCROLL_KEY);
  if (scroll_pos) {
    $(window).scrollTop(scroll_pos);
    locache.session.set(MARKET_SCROLL_KEY, 0);
  }
  $('a:contains("Take One")').each(function() {
    $(this).click(function() {
      locache.session.set(MARKET_SCROLL_KEY, $(window).scrollTop());
    });
  });
}, [ "market3.php" ]);

/**
 * Transforms a select tag object to a [value => text] map
 */
function selectToMap(select) {
  var map = {};
  select.children().each(function() {
    map[this.value] = this.innerHTML;
  });
  return map;
}

/**
 * FEATURE: Adds tooltips (where possible) to items in search screen.
 * Credit goes to langer for the implementation.
 */
registerFunction(function addMarketSearchTooltips() {
  var markets = {};

  //Select all item rows from search
  $('table.maintable:contains(Name)').each(function(){
    //Scrape item name, price & trades from row
    var name = $(this).find('td:contains("Name")').next().text().trim();
    var price = $(this).find('td:contains("Price")').next().text().trim();
    var trades = $(this).find('td:contains("Trades")').next().text().trim();
    var link = $(this).find('a:has(img)').attr('href');
    var owner = link.split('=').pop();

    //Determine key & count amount of similar items on a given market
    var key = [owner, name, price, trades].join(':');
    markets[key] = markets.hasOwnProperty(key) ? markets[key] + 1 : 0;
    var numb = markets[key];

    //Image hover to show item details
    var item_tooltip;
    $(this).find('img[src*="items"]')
      .mouseover(function() {
        if (!item_tooltip) {
          var market_page = syncGet(link);
          //Find matching item as hovered over
          var match = $('table[cellpadding="1"]', market_page)
            .filter(function(){
              return (
                $(this).find('td:contains("Name")').next().text().trim() === name &&
                $(this).find('td:contains("Price")').next().text().trim() === price + ' each' &&
                $(this).find('td:contains("Trades")').next().text().trim() === trades
              );
            })
            .find('a:has(img)');
          //Make sure the item is still on the market since searching
          if (match.length) {
            //Select the nth similar item on the market under the above attributes
            var item_url = match.eq(numb).attr('href').match(/'(.*)'/).pop();
            var item_data = syncGet(item_url);
            item_tooltip = $('center', item_data).html();
          } else {
            item_tooltip = 'Error - Item Cannot Be Found';
          }
        }

        ddrivetip(item_tooltip, 450);
      })
      .mouseout(hideddrivetip);
  });
}, [ "marketsearch2.php" ]);

// =============================================================================
//                                Abilities
// =============================================================================
/**
 * FEATURE: Removes completed abilities from the training selection options.
 */
registerFunction(function trimAbilityList() {
  $('option').each(function() {
    // Check trained level out of total. If they're equal, remove the option.
    var match = $(this).text().match(/\d/g);
    if (match && match.length === 2) {
      if (match[0] === match[1]) {
        $(this).remove();
      }
    }
  });
}, [ "information2.php" ]);


// =============================================================================
//                               Top 10 Lists
// =============================================================================
/**
 * FEATURE: Adds links to easily-copyable weekly top 10 data.
 */
registerFunction(function addOverallTop10ExportButtons() {
  addTop10ExportButton("Highest Levels");
  addTop10ExportButton("Highest Wins");
  addTop10ExportButton("Highest Losses");
  addTop10ExportButton("Achievements Score");
}, [ "highrecords.php" ]);

/**
 * FEATURE: Adds links to easily-copyable weekly top 10 data.
 */
registerFunction(function addWeeklyTop10ExportButtons() {
  addTop10ExportButton("Most Exp Earned");
  addTop10ExportButton("Most Wins");
  addTop10ExportButton("Most Losses");
  addTop10ExportButton("Most Hunting Points");
  addTop10ExportButton("Most Warfare Points");
  addTop10ExportButton("Most Tokens Earned");
}, [ "weekrecords.php" ]);

/**
 * FEATURE: Adds links to easily-copyable gang top 10 data.
 */
registerFunction(function addGangTop10ExportButtons() {
  addTop10ExportButton("Gang List : Highest Levels");
  addTop10ExportButton("Gang List : Last Week\'s Warfare Points");
}, [ "gangs2_4.php" ]);

/**
 * Given a table title, adds a button/link to copyable top 10 data.
 */
function addTop10ExportButton(table_title) {
  // Read the scores from the document and parse them
  var table = $('table:contains("' + table_title + '")');
  var players = table
    .find('a[href*="profile.php"]')
    .map(function (k, v) { return $(v).text(); });
  var scores = table
    .find('font.colortext')[0]
    .innerHTML.split('<br>');

  // Generate the text to be exported
  var export_text = "";
  for (var i = 0; i < 10; i++) {
    export_text = export_text + (i+1) + ';' + players[i] + ';' + scores[i] + '\n';
  }
  export_text = encodeURIComponent(export_text);
  var data = 'data:text/plain,' + export_text;

  // Add icon-link to document with exported text
  var link = $("<a>")
    .attr('href', data)
    .append(fontAwesomeIcon('fa-file-text'))
    .css({
      'float': 'right',
      'position': 'relative',
      'right': '5px',
    });

  var title = $('font:contains("' + table_title + '")');
  title.after(link);
}


// =============================================================================
//                                 Combat
// =============================================================================
/**
 * FEATURE: Make attack buttons clickable once (prevents multi-attack errors).
 * For those of us who like frantically mashing 'attack' and think it's absurd
 * to hit the 'multi-attack' error page as a result.
 */
registerFunction(function preventMultiAttack() {
  // We simply disable the button after clicking on it once. I don't know which
  // buttons can cause multi-attack errors, so to be safe I fixed all attack
  // buttons I could find.
  /* jshint multistr:true */
  var atk_btn = $('input[value="Attack"],\
                   input[value="Attack Target"],\
                   input[value="Attack Again"],\
                   input[value="Hunt Again"]');
  atk_btn.each(function() {
    var btn = $(this);
    var disable_btn = function() { btn.prop('disabled', 'disabled'); };

    // Handle form submission vs button onclick differently, since for forms we
    // want to disable button on submit (post-submission), whereas for buttons
    // we want to disable it on click (after the native onclick handler fires)
    switch ($(this).prop('type')) {
      case 'submit':
        $('form').submit(disable_btn);
        break;
      case 'button':
        btn.click(disable_btn);
        break;
    }
  });
}, [ "fight\\d*.php", "hunting\\d*.php", "map2.php" ]);

// =============================================================================
//                                Hunting
// =============================================================================
/**
 * FEATURE: Allow the player to combine their newly dropped crystal while
 * hunting.
 * FEATURE: Also adds a "Hunt Again" button to let the player continue to hunt
 * without going back to the hunt page.
 * FEATURE: Adds merging option on inventory page.
 *
 * Credit goes to langer for implementation.
 * Source: https://greasyfork.org/scripts/4375-crystal-check
 */
registerFunction(function huntingCrystalImprovements() {
  /*****************************************************
                      General Methods
  /****************************************************/
  //Method to create elements on the fly without injecting html
  function create(type, attr, text, parent) {
      var ele = document.createElement(type);
      for (var x in attr) {
          if (x.hasOwnProperty) {
              ele.setAttribute(x, attr[x]);
          }
      }
      if (text) {
          ele.innerHTML = text;
      }
      if (parent) {
          parent.appendChild(ele);
      }
      return ele;
  }
  //Return user cookies as object
  function getCookies() {
      return document.cookie
          .split(/[;\s]+/g)
          .reduce(function(a, b) {
              a[b.split('=')[0]] = b.split('=')[1];
              return a;
          }, {});
  }
  /*****************************************************
                      Inventory
  /****************************************************/

  //Inventory API to manipulate inventory items
  function Inventory(html) {
      this.items = getItems();
      this.key = $(html).find('form').attr('action').match(/[a-zA-Z]+$/g).pop();
      var key = this.key;
      //Inventory items encapsulated to organise data
      function Item(name, slot, trades, id) {
          this.name = name;
          this.slot = slot;
          this.trades = trades;
          this.id = id;

          //Crystal merging method
          this.merge = function(that, callback) {
              var slot1 = this.slot;
              var slot2 = that.slot;
              $.ajax({
                  type: "POST",
                  url: "inventory10.php?i=" + slot1 + "&key=" + key,
                  async: false,
                  data: {
                      item: slot2
                  },
                  success: function(data) {
                      //If method available, use on response data to check for further crystal merging
                      //Response from merging should be the redirected inventory page, which can be used to
                      //refresh inventory data
                      if (callback)
                          callback.call(this, data);
                  }
              });
          };
      }
      //captures all item data for the inventory & encapsulates as an object
      function getItems() {
          //Match javascript lines on inventory.php for item id & trades
          //Each resulting index corresponds to the slot in inventory
          var itemPreviews = html.match(/(itemPreviews\[)((.|\n)*?)(Default|table>');/g);
          var tempItems = [];
          $(html).find('img.item').each(function() {
              var slot = parseInt($(this).attr('name'));
              var dat = itemPreviews[slot].replace("Un-tradable", "0 Trade").match(/(\d+)(?=(&c=|\sTrade))/g);
              tempItems.push(new Item($(this).attr('title'), slot, dat[0], dat[1]));
          });
          return tempItems;
      }

      //Returns all crystals in the inventory, sorted by item id (newest first)
      this.getCrystals = function() {
          return this.items
              //check if item is a crystal (must be have some word before crystal Crystal to avoid Crstal Rings)
              .filter(function(a) {
                  return a.name.match(/.+Crystal/) !== null;
              })
              //order from newest to oldest (item id descending)
              .sort(function(a, b) {
                  return b.id - a.id;
              });
      };
      //Returns an array of matching size/colour crystals
      //Ordered by trades on given crystal ascending, then everything else descending
      this.matchCrystal = function(crystal) {
          return this.getCrystals().filter(function(a) {
              return a.id !== crystal.id && a.name == crystal.name && crystal.name.search('Perfect')==-1;
          }).sort(function(a, b) {
              return (a.trades >= crystal.trades && b.trades >= crystal.trades) ? a.trades - b.trades : b.trades - a.trades;
          });
      };
  }

  /*****************************************************
                      Hunting Page Methods
  /****************************************************/

  function huntMerge() {
      //Once a crystal drop has been detected
      function checkDrop() {
          //Display 'found match' message on single line row
          function singleRow(crystal) {
              var r = create('tr', {}, false, $('tbody:contains("Item Found")')[0]);
              create('td', {
                      width: "100%",
                      class: "standardrow",
                      align: "center",
                      colspan: "2"
                  },
                  'You have a matching ' + crystal.name + ' (' + crystal.trades + 't) in your inventory. <span class="merge" style="cursor:pointer;">[Merge]</span>',
                  r);
          }

          //create 'item drop' row displaying merged crystal image + result message
          function doubleRow(crystal) {
              var r = create('tr', {}, false, $('tbody:contains("Item Found")')[0]);
              create('td', {
                  width: "10%",
                  class: "standardrow",
                  align: "center"
              }, "<img src='img-bin/items/" + crystal.name.toLowerCase() + ".png'/>", r);
              create('td', {
                  width: "90%",
                  class: "standardrow",
                  align: "center"
              }, crystal.name + " added to inventory.", r);
          }
          $.ajax({
              url: 'inventory.php',
              async: true,
              success: function(data) {
                  var inv = new Inventory(data);
                  var drop = inv.getCrystals()[0];
                  option(drop, inv.matchCrystal(drop));
                  //recursive method - if crystal match, display option to merge - if merged, display result
                  //if crystal match with previous result, offer to match again, etc
                  function option(crystal, matches) {
                      if (matches.length > 0) {
                          singleRow(matches[0]);
                          $('span.merge').click(function() {
                              $(this).remove();
                              //merge newest crystal [0] with best matching crystal [1]
                              crystal.merge(matches[0],
                                  //anonymous function as input for merge callback to display merge option on previously merged crystal
                                  function(data) {
                                      var nextInv = new Inventory(data);
                                      var newCrystal = nextInv.getCrystals()[0];
                                      doubleRow(newCrystal);
                                      option(newCrystal, nextInv.matchCrystal(newCrystal));
                                  }
                              );
                          });
                      }
                  }
              }
          });
      }

      //Build a clickable button which allows the user to attack
      //the same hunt group again without visiting the hunt page again
      //If there are buttons present, the fight is ongoing
      //If there is a page title, user is on error or multiattack screen
      if (!($('.button').length || $('.pagetitle').length)) {
          //Create Start Another Hunt button & position next to Back to Hunting page url, change row to fit
          //Button defaulted to disabled while waiting for attack string
          var td = $('td:has("#back-to-hunting")');
          td.prop("width", "50%");
          var newCell = create("td", {
                  class: "standardrow",
                  width: "50%",
                  align: "center"
              }, false, td.parent()[0]),
              newButt = create("input", {
                  type: "button",
                  class: "button",
                  value: "Start Another Hunt",
                  disabled: "disabled"
              }, false, newCell);
          td.before(newCell);

          //Gather attack string from hunting.php && cookie info for next hunt form
          var form = create("form", {
                  action: "hunting3.php",
                  method: 'post',
                  style: "display:none;"
              }, false, document.body),
              attackString,
              cookies = getCookies();
          create("input", {
              type: "hidden",
              name: "group",
              value: cookies.hunting_group
          }, false, form);
          create("input", {
              type: "hidden",
              name: "level",
              value: cookies.hunting_level
          }, false, form);
          create("input", {
              type: "submit",
              value: "Attack Target",
              class: "button",
              id: "hunt-" + cookies.hunting_group + "-" + cookies.hunting_level
          }, false, form);

          $.ajax({
              url: 'hunting.php',
              async: true,
              success: function(data) {
                  attackString = data.match(/([a-zA-Z]{20})(?=">')/g).pop();
                  create("input", {
                      type: "hidden",
                      name: "attackstring",
                      value: attackString
                  }, false, form);
                  newButt.disabled = false;
              }
          });
          //Button method - disable to prevent multi-attack & submit to proceed
          $(newButt).click(function() {
              $(this).prop("disabled", true);
              form.submit();
          });
          //Hunt Group 18 - Crystal Entities and crystal drop
          if (cookies.hunting_group == "18" && $('tbody:contains("Item Found")').length) {
              checkDrop();
          }
      }
  }
  /*****************************************************
                      Inventory Page Methods
  /****************************************************/

  function invMerge() {
      //Call current inventory as instance of inventory object defined above for managing crystals
      var inv = new Inventory(document.body.innerHTML);

      $('img[title*=" Crystal"]').each(function() {
          //Build selectbox containing matching crystal options & merge button
          var slot = $(this).attr('name');
          var row = create('tr', {}, false, false);
          var col1 = create('td', {
              colspan: '2'
          }, false, row);
          var select = create('select', {
              name: 'item',
              id: 'crystalSelect',
              class: 'selectbox',
              style: 'width:100%;'
          }, false, col1);
          var col2 = create('td', {}, false, row);
          var merge = create('input', {
              id: 'merge',
              type: 'button',
              class: 'button',
              style: 'width:100%',
              value: 'Merge'
          }, false, col2);
          var crystal = inv.getCrystals().reduce(function(a, b) {
              return b.slot == slot ? b : a;
          }, null);
          var matches = inv.matchCrystal(crystal);
          if (matches.length > 0) {
              matches.forEach(function(a) {
                  create('option', {
                      value: a.slot
                  }, a.trades + ' Trades | ID:' + a.id, select);
              });
          } else {
              create('option', {}, 'No Matching Crystals', select);
              select.disabled = true;
              merge.disabled = true;
          }
          select.selectedIndex = 0;
          //Add selectbox & button after crystal is selected in inventory
          $(this).click(function() {
              $('#ItemPreview tbody tbody:contains("Use")').append(row);
          });
          //Merging!
          $(merge).click(function() {
              //Re-create 'crystal to be merged' input as child of form
              create("input", {
                  type: "hidden",
                  name: "item",
                  value: select.selectedOptions[0].value
              }, false, document.getElementsByTagName('form')[0]);
              //remove unneeded Save Changes input
              $('[name=itemarray]').remove();
              //Override Save Changes form for with merging url
              $('form').attr('action', 'inventory10.php?i=' + crystal.slot + '&key=' + inv.key).submit();
          });
      });
  }
  /*****************************************************
                      Misc
  /****************************************************/
  //call methods where relevant
  switch (location.pathname) {
      case '/inventory.php':
          invMerge();
          break;
      case '/hunting3.php':
          huntMerge();
          break;
  }
}, [ 'hunting3.php', 'inventory.php' ]);


// =============================================================================
//                               Wasteland
// =============================================================================
/**
 * FEATURE: Adds mouse tooltip showing coordinates to wl map.
 */
registerFunction(function wlMapCoOrds() {
  var coords = $('<div><div style="text-align:center;">1,1</div></div>');
  $('#overlay2')
    .mousemove(function(e) {
      // Firefox doesn't implement offsetX/Y, so compute it ourselves if needed.
      var offX  = (e.offsetX || e.clientX - $(e.target).offset().left + window.pageXOffset);
      var offY  = (e.offsetY || e.clientY - $(e.target).offset().top  + window.pageYOffset);
      var x = Math.ceil(offX / 33);
      var y = Math.ceil((offY - 5) / 33); // top is 5px off

      if (x >= 1 && x <= 15 && y >= 1 && y <= 15) {
        coords.children().text(x + ',' + y);
        ddrivetip(coords.html(), 35);
      } else {
        // Hide tooltip when out of bounds
        hideddrivetip();
      }
    })
    .mouseout(hideddrivetip);
}, [ 'map.php' ]);

/**
 * FEATURE: Adds wl 'exit' link to wasteland quicklink.
 */
registerFunction(function addWLExitQuickLink() {
  $('div.sidebox a[href="map.php"]').each(function() {
    // Check character bg to see if we're in the WL or not.
    var char_bg = $('div.char-bg');
    var in_wl;
    if (char_bg.length > 0) {
      in_wl = char_bg.css('background-image').indexOf('char_bg_waste') > -1;
    } else {
      // If we don't have character bg available to us, always show the link.
      in_wl = true;
    }

    if (in_wl) {
      var link = $('<a>', {
        text: ' (Exit)',
        href: URI("/map.php").query({ 'move': 1 }),
      });
      $(this).after(link);
    }
  });
}, [ ".*" ]);

/**
 * FEATURE: Adds a 3x3 hovercard preview to gang alerts.
 */
registerFunction(function addAlertPreview() {
  var SQW = 33; // square width = 33px
  var PW = 3 * SQW - 3; // preview width (adjusted for borders)

  // Returns 3x3 map preview centered around x,y coords
  function mapPreview(x, y) {
    // Add 'c' parameter to avoid caching
    var map_uri = URI('/maps/map1_gang.png').query({ 'c': Date.now() });
    var overlay_uri = URI('/maps/map1_overlay.gif').query({ 'c': Date.now() });
    var map_preview = $('<img>')
      .attr({ 'src': overlay_uri.href() })
      .css({
        'background': sprintf('url(%s)', map_uri.href()),
        // Use CSS to crop/adjust image location
        'position': 'absolute',
        'clip': sprintf(
          'rect(%dpx, %dpx, %dpx, %dpx)',
          SQW * (y - 2), SQW * (x + 1), SQW * (y + 1), SQW * (x - 2)
        ),
        'top': sprintf('%dpx', -SQW * (y - 2)),
        'left': sprintf('%dpx', -SQW * (x - 2)),
      });

    var preview = $('<div>')
      .css({
        'width': sprintf('%dpx', PW),
        'height': sprintf('%dpx', PW),
      })
      .append(map_preview);
    var container = $('<div>').append(preview);

    return container;
  }

  $('div.sidebox:contains("Gang Alert")').each(function() {
    var attack_txt = $(this).find('div.gang-alert').text();
    var coords = attack_txt.match(/(\d+),(\d+)/);
    var x = parseInt(coords[1]), y = parseInt(coords[2]);
    var map_preview = mapPreview(x, y).html();

    $(this)
      .mouseover(function() { ddrivetip(map_preview, PW); })
      .mouseout(hideddrivetip);
  });
}, [ ".*" ]);

// =============================================================================
//                                   Jobs
// =============================================================================
/**
 * FEATURE: Select to do as many jobs as your current energy allows by default.
 */
registerFunction(function autoSelectMaxJobs() {
  var energy = parseInt($("#turnbox").text().replace(/\,/g,''));
  var energy_cost = parseInt($("tr:contains('Energy Cost') font.text").text());
  var max_jobs = Math.floor(energy/energy_cost);

  var job_selector = $(".selectbox");
  $.each(selectToMap(job_selector), function (key, value) {
    if (key <= max_jobs) {
      job_selector.val(key).change();
    }
  });
}, [ "jobcenter2.php", "avatarjob2.php" ]);


// =============================================================================
//                               Platinum Store
// =============================================================================
/**
 * FEATURE: Formats remaining boost time to a saner format.
 */
registerFunction(function formatRemainingBoostTime() {
  function formatTime(hours) {
    hours = parseInt(hours, 10);
    var out = [];
    switch (true) {
      case (hours >= 8736):
        var years = Math.floor(hours / (8736));
        out.push(years + " year" + (years > 1 ? "s" : ""));
        hours = hours % (8736);
        /* falls through */
      case (hours >= 168):
        var weeks = Math.floor(hours / (168));
        out.push(weeks + " week" + (weeks > 1 ? "s" : ""));
        hours = hours % (168);
        /* falls through */
      case (hours >= 24):
        var days = Math.floor(hours / (24));
        out.push(days + " day" + (days > 1 ? "s" : ""));
        hours = hours % 24;
        /* falls through */
      case (hours > 0):
        out.push(hours + " hour" + (hours > 1 ? "s" : ""));
        /* falls through */
      default:
        var str = out.join(", ");
        return str;
    }
  }

  $('img[alt*=Boost][onmouseover]').each(function() {
    var regex = /\d{1,} hour\(s\)/;
    var time = $(this).attr('onmouseover').match(regex);
    if (time) {
      $(this).attr(
        'onmouseover',
        $(this).attr('onmouseover').replace(regex, formatTime(time))
      );
    }
  });
}, [ "platinum_store.php" ]);

// =============================================================================
//                                 Vote Page
// =============================================================================
/**
 * FEATURE: Adds an exclamation icon next to the community tab if the top list
 * vote timers are up.
 */
registerFunction(function addVoteNotification() {
  function getCanVote() {
    // Server time is EST (UTC -5). Vote timer resets at 0500 and 1700 UTC.
    // Thus, we set our cache timer to expire at around server reset.
    var date = new Date();
    var hrs_until_reset = 12 - mod(date.getUTCHours() + SERVER_UTC_OFFSET_HRS, 12);
    var sec_until_reset =
      (hrs_until_reset * SEC_IN_HOUR) -
      (date.getUTCMinutes() * SEC_IN_MINUTE) -
      (date.getUTCSeconds()) +
      5 * SEC_IN_MINUTE; // add a bit of a buffer just in case

    return cachedFetchWithRefresh(
      "voting:canvote",
      sec_until_reset,
      "/voting.php",
      function(data) { return $('b:contains("Not Voted")', data).length > 0; }
    );
  }

  if (getCanVote()) {
    var community_tab = $('img[alt="Community"]');
    var exclamation;
    exclamation = fontAwesomeIcon('fa-exclamation-circle').css({
      'float': 'left',
      'left': '5px',
      'position': 'relative',
      'top': '5px',
    });
    community_tab.after(exclamation);

    var vote_link = $(':contains("Vote for Legacy"):last');
    exclamation = fontAwesomeIcon('fa-exclamation-circle').css({
      'float': 'right',
      'position': 'relative',
      'right': '3px',
    });
    vote_link.append(exclamation);
  }
}, [ '.*' ]);

// =============================================================================
//                                   Flags
// =============================================================================
/**
 * FEATURE: Provides functionality to upload flags.
 * Credit goes to langer for implementation.
 * Source: https://greasyfork.org/scripts/4374-flag-upload
 */
registerFunction(function addFlagUpload() {
  /*****************************************************
                      General Methods
  /****************************************************/
  //
  function create(type,attr,text,parent){
      var ele = document.createElement(type);
      for(var x in attr){
          if(x.hasOwnProperty){
              ele.setAttribute(x,attr[x]);
          }
      }
      if(text){ele.innerHTML = text;}
      if(parent){parent.appendChild(ele);}
      return ele;
  }

  //Method to convert RGB values into hex for flag variables
  function toHex(r, g, b) {
      var hex ="0123456789ABCDEF", ans;
      r = hex.charAt((r - (r % 16)) / 16) + hex.charAt(r % 16);
      g = hex.charAt((g - (g % 16)) / 16) + hex.charAt(g % 16);
      b = hex.charAt((b - (b % 16)) / 16) + hex.charAt(b % 16);
      ans = "#" + r + g + b;
      return ans;
  }
  /*****************************************************
                      CSS Injection
  /****************************************************/
  var custom = ""+
          "#uploadPanel{height:auto; width:auto; background: red none; border: 5px solid darkred; padding: 5px; position:absolute; top:20px; left:20px; max-height:90%; max-width:90%; padding-right:20px; overflow:auto;}\n"+
          "#flagOut{border:1px solid #c3c3c3; display:inline-block;}\n"+
          "#container{position:relative; display:block; height:30px; width:40px; padding:1px;}\n"+
          "#rawImage{position: absolute; display:block; z-index:1;}\n"+
          "#getArea{position:absolute; height:30px; width:40px; top:1px; left:1px; border:1px solid red;z-index:2;}\n"+
          "#imageUpload{display:block;}\n"+
          "#editPanel{display:none;}";

  create('link',{rel:'stylesheet',href:'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css'},false,document.head);
  create('style',{type:'text/css'},custom,document.head);

  /*****************************************************
                      Interface Creation & Injection
  /****************************************************/

  var panel = create('div',{id:'uploadPanel'},false,document.body);
  create('canvas',{id:'flagOut',width:'40',height:'30'},false,panel);
  create('input',{id:'toFlag',type:'button',value:'Send to Flag'},false,panel);
  create('span',{},'<br/>Resize Select Box:',panel);
  create('input',{id:'resizeToggle',type:'checkbox'},false,panel);
  create('span',{},'<br/>Keep Aspect Ratio:',panel);
  create('input',{id:'Aratio',type:'checkbox',checked:'checked',disabled:'disabled'},false,panel);
  create('span',{},'<br/>',panel);
  create('input',{id:'reset',type:'button',value:'Reset to 40X30'},false,panel);
  create('input',{id:'rawImgHide',type:'button',value:'Show/Hide Canvas'},false,panel);
  create('span',{},'<br/>',panel);
  create('span',{id:'edit'},'Editing Tools',panel);
  var edit = create('div',{id:'editPanel'},false,panel);
  create('input',{id:'greyscale',type:'button',value:'Greyscale'},false,edit);
  create('input',{id:'invert',type:'button',value:'Invert'},false,edit);
  var container = create('div',{id:'container'},false,panel);
  create('canvas',{id:'rawImage',width:'40',height:'30'},false,container);
  create('div',{id:'getArea'},false,container);
  create('input',{id:'imageUpload',type:'file'},false,panel);

  /*****************************************************
                      Canvas Methods
  /****************************************************/

  //Sends image data to 'large' canvas, from which we can select the desired area
  function toRawCanvas(imgData){
      var img = new Image() ,
          rawcanvas = document.getElementById('rawImage'),
          context = rawcanvas.getContext('2d'),
          area;
      img.src = imgData;
      img.onload = function() {
          var container = document.getElementById('container');
          container.style.height=img.height+2+'px';
          container.style.width=img.width+2+'px';
          rawcanvas.height=img.height+2;
          rawcanvas.width=img.width+2;
          context.drawImage(img, 1, 1);
          area = document.getElementById('getArea');
          area.style.top='1px';
          area.style.left='1px';
      };
  }

  //Ctrl + V to paste an image to the canvas
  //Currently only available with Chrome
  function onPasteHandler(e){
      if(e.clipboardData) {
          var items = e.clipboardData.items,
              blob,
              source;
          if(!items){
              alert("Image Not found");
          }
          for (var i = 0; i < items.length; ++i) {
              if (items[i].type.match('image.*')) {
                  blob = items[i].getAsFile();
                  source = window.webkitURL.createObjectURL(blob);
                  toRawCanvas(source);
              }
          }
      }
  }
  //Use jQuery UI to allow the capture div inside the raw canvas to move freely when dragging
  $(function(){
      $('#getArea').draggable({containment:'parent'});
      window.addEventListener("paste", onPasteHandler);
  });
  //Show/Hide the Raw Canvas from view
  //Mainly for when the image is larger than the window, or file upload is difficult to see
  $('#rawImgHide').click(function(){
      $('#container').slideToggle('slow');
  });
  //Reset the capture div back to default size
  $('#reset').click(function(){
      var area = document.getElementById('getArea');
      area.style.height="30px";
      area.style.width="40px";
  });
  //Allow the capture div to be resizable (jQuery UI)
  //Aspect ratio can only be enabled/disabled when the capture div is resizable
  $('#resizeToggle').click(function(){
      if(this.checked){
          if ($('#Aratio').is(':checked')){
              $('#getArea').resizable({aspectRatio: true, containment:'parent'});
          }
          else{
              $('#getArea').resizable({containment:'parent'});
          }
          $('#Aratio').prop('disabled','');
      }
      else{
          $('#getArea').resizable('destroy');
          $('#Aratio').prop('disabled','disabled');
      }
  });
  //Enable/Disable aspect ratio on capture div
  //Disabling may cause stretching/skewing of output flag
  $('#Aratio').click(function(){
      if (this.checked){
          $('#getArea').resizable('destroy');
          $('#getArea').resizable({aspectRatio: true, containment:'parent'});
      }
      else{
          $('#getArea').resizable('destroy');
          $('#getArea').resizable({aspectRatio: false, containment:'parent'});
      }
  });
  //Image upload from local machine to raw canvas
  $('#imageUpload').change(function(){
      if (document.getElementById("imageUpload").files.length === 0) {
          return;
      }
      var flag = document.getElementById("imageUpload").files[0],
          reader;
      if (!flag.type.match('image.*')) {
          alert("Not an image");
          return;
      }
      reader = new FileReader();
      reader.onload = (function() {
          return function(e) {
              toRawCanvas(e.target.result);
          };
      }(flag));
      reader.readAsDataURL(flag);
  });
  //After moving capture div to desired area, send containing image to secondry canvas to preview before sending to legacy page
  //Resize to fit 40X30 pixels where needed using native methods
  $('#getArea').mouseup(function(){
      var rawcanvas = document.getElementById('rawImage'),
          out = document.getElementById('flagOut'),
          area = document.getElementById('getArea'),
          outctx = out.getContext('2d'),
          x=parseInt(area.style.left,10),
          y=parseInt(area.style.top,10);
      outctx.clearRect (0,0,out.width,out.height);
      outctx.drawImage(rawcanvas, x, y,area.clientWidth,area.clientHeight,0,0,out.width,out.height);
  });
  //Sent image from preview canvas to legacy page, adjusting page variables and 'pixel' block backgrounds
  $('#toFlag').click(function(){
      var canvas=document.getElementById('flagOut'),
          context = canvas.getContext('2d'),
          w = canvas.width,
          h = canvas.height,
          imgd = context.getImageData(0, 0, w, h),
          pix = imgd.data;

      for (var i = 0; i < h; i++) {
          for (var j = 0; j < w; j++) {
              document.getElementsByName("X"+j+"Y"+i)[0].bgColor = pic[j+i*w] = toHex(pix[(j+i*w)*4], pix[(j+i*w)*4 + 1], pix[(j+i*w)*4 + 2]);
          }
      }
  });
  /*****************************************************
                      Effect Addons
  /****************************************************/
  //Hide/Show effect options
  $('#edit').click(function(){
      $('#editPanel').slideToggle();
  });
  //Perform greyscale effect on output flag
  $('#greyscale').click(function(){
      document.getElementById('flagOut').greyscale();
  });
  //Invert output flag colours
  $('#invert').click(function(){
      document.getElementById('flagOut').invert();
  });

  HTMLCanvasElement.prototype.greyscale = function(){
      var ctx = this.getContext('2d'),
          data = ctx.getImageData(0,0,this.width,this.height),
          d = data.data;
      for(var i=0;i<d.length;i+=4){
           d[i]= d[i+1] = d[i+2] = 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2];
      }
      ctx.putImageData(data,0,0);
  };

  HTMLCanvasElement.prototype.invert = function(){
      var ctx = this.getContext('2d'),
          data = ctx.getImageData(0,0,this.width,this.height),
          d = data.data;
      for(var i=0;i<d.length;i+=4){
          d[i]=255-d[i];
          d[i+1]=255-d[i+1];
          d[i+2]=255-d[i+2];
      }
      ctx.putImageData(data,0,0);
  };
}, [ 'flag.php' ]);

// =============================================================================
//                                 Constants
// =============================================================================
var MS_IN_SEC = 1000;
var SEC_IN_MINUTE = 60;
var SEC_IN_HOUR = 60 * SEC_IN_MINUTE;
var SEC_IN_DAY = 24 * SEC_IN_HOUR;

// Legacy server runs on EST (UTC-5)
var SERVER_UTC_OFFSET_HRS = -5;

// =============================================================================
//                                 Utilities
// =============================================================================
/**
 * Adds caching to a function. Fetches from cache if value is there, otherwise
 * generates, stores in cache, and returns results of fetch_fn.
 */
function cachedFetch(key, timeout, fetch_fn) {
  var value = cacheGet(key);
  if (value === null) {
    value = fetch_fn();
    cacheSet(key, value, timeout);
  }
  return value;
}

function cacheSet(key, value, timeout) {
  locache.set(sessionKey(key), value, timeout);
}

function cacheGet(key) {
  return locache.get(sessionKey(key));
}

/**
 * Fetching/caching function. Fetches key from cache if available, otherwise
 * does an ajax get to url and applies fn to compute return value. If already
 * at url, applies fn, and stores result in cache.
 */
function cachedFetchWithRefresh(key, timeout, path, fn) {
  var value;
  if (window.location.pathname === path) {
    value = fn(document);
    cacheSet(key, value, timeout);
  } else {
    value = cachedFetch(key, timeout, function() {
      var ret;
      $.ajax({
        url: path,
        async: false,
        success: function(data) { ret = fn(data); },
      });
      return ret;
    });
  }
  return value;
}

/**
 * Transforms a key such that it is only valid for the current session. Should
 * be used for all cache keys.
 */
function sessionKey(key) {
  var legacy_hash;
  switch (URI(window.location.href).subdomain()) {
    case 'www':
      legacy_hash = document.cookie.match(/legacy_hash=(\w+)/)[1];
      break;
    case 'dev':
      legacy_hash = document.cookie.match(/legacy_hash_dev=(\w+)/)[1];
      break;
  }
  return key + ":" + legacy_hash;
}

/**
 * Returns a font awesome icon. Loads required CSS to page if necessary.
 */
function fontAwesomeIcon(klass) {
  // Load CSS stylesheet if not loaded yet.
  if (!$('link[href*="font-awesome.min.css"]').length) {
    $('head').append(
      $('<link href="//maxcdn.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css" rel="stylesheet">')
    );
  }
  return $('<i class="fa ' + klass + '"></i>');
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

/**
 * Does a synchronous (blocking) get and returns the result.
 */
function syncGet(url) {
  var fetched_data;
  $.ajax({
      url: url,
      async: false,
      success: function(data) { fetched_data = data; },
  });
  return fetched_data;
}

/**
 * Simple utility assert function.
 */
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}

// ====================================== END ==================================
