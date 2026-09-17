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
// @match       https://www.legacy-game.net/*
// @match       https://dev.legacy-game.net/*
// @version     0.0.59
// @grant       none
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.js
// ==/UserScript==
/* global $, jQuery, ddrivetip, hideddrivetip, bar1,
positionToElement, select, pic */


var loaderAnim = "data:image/gif;base64,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";
// =============================================================================
//                              Script Set-Up
// =============================================================================
// Avoid conflicting with page's jQuery
this.$ = this.jQuery = jQuery.noConflict(true);

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
          console.error(e.stack);
        }
      });
    }
  });
}
$(document).ready(executeFunctions);

// =============================================================================
//                              Player Class Helper
// =============================================================================
var Player = {
  getHP: function() {
    var hp = 0;
    if (bar1 !== undefined) {
      hp = bar1; // from template.php
    }
    return hp;
  },

  getEnergy: function() {
    var energy = 0;
    if ($("#turnbox").length) {
      energy = parseInt($("#turnbox").text().replace(/\,/g, ''));
    }
    return energy;
  },

  isInWL: function() {
    // Check character bg to see if we're in the WL or not.
    var char_bg = $('div.char-bg');
    var in_wl = false;
    if (char_bg.length > 0) {
      in_wl = char_bg.css('background-image').indexOf('char_bg_waste') > -1;
    }
    return in_wl;
  }
};

// =============================================================================
//                               General Layout
// =============================================================================
/**
 * FEATURE: Binds 'h' to full heal.
 */
registerFunction(function addQuickHealKeybinding() {
  bindShortcut('h', fullHeal);
}, [".*"]);

function fullHeal() {
  if (Player.isInWL()) {
    return;
  }

  var heal_link = document.querySelector('a[onclick*="doFullHeal"]');
  if (heal_link) {
    heal_link.click();
  }
}

/**
 * FEATURE: Adds tooltip hovercards to player items.
 */
registerFunction(function addItemHovercards() {
  $('a[href*="javascript:modelesswin"]').each(function() {
    var equipData;
    $(this)
      .mouseover(function() {
        var context = $(this)
        if (!equipData) {
            equipData = "<img src=\""+loaderAnim+"\" />";
            ddrivetip(equipData, 30);
          $.ajax({
            url: $(this).attr('href').match(/'(.*)'/).pop(),
            async: true,
            success: function(data) {
              //equipData = $('center', data).html();
              equipData = $(data).filter('center').html();
              if(context.is(":hover"))
                ddrivetip(equipData,450);
            }
          });
        }
        else{
            ddrivetip(equipData, 450);
        }
      })
      .mouseout(hideddrivetip);
  });
}, ["profile.php", "market2.php", "market3.php", "market6.php"]);

// =============================================================================
//                                  Market
// =============================================================================
registerFunction(function setUpStandAndStorage() {
  // FEATURE: Auto-check add all items with the same price by default.
  $('input[name="multi"]').prop('checked', true);

  // FEATURE: Bind 'a' to 'add item' button.
  var item_added = false;
  bindShortcut('a', function() {
    if (item_added) {
      return;
    }
    item_added = true;
    var add_btn = $('input[value="Add Item"], input[value="Store Item"]');
    add_btn.click();
  });

  // FEATURE: Maintain scroll position after taking item from stand.
  var take_buttons = $('input[value="Take"], button').filter(function() {
    return $.trim($(this).val() || $(this).text()) === 'Take';
  });
  preserveScrollPosOnClick(take_buttons);
}, ["market3.php", "market6.php"]);

registerFunction(function autoUpdateStandPricing() {
  // FEATURE: When selecting items from your inventory, if you already have that
  // item in your stand, copy over the price/currency for it.
  var item_selector = $('select[name="item"]');
  item_selector.change(function() {
    var selected_item = $.trim($(this).find("option:selected").text());
    if (!selected_item) {
      return;
    }

    var price_text = $("font.darktext > font:contains('" + selected_item + "')")
      .filter(function() { return $(this).text() === selected_item; })
      .closest('tbody')
      .find("td:contains('each')");
    var num, currency;
    if (price_text.size()) {
      price_text = $.trim(price_text.first().text());
      var match = price_text.match(/([\d,]+)([cp]) each/);
      num = match[1].replace(/,/g, '');
      currency = match[2];
    } else {
      num = null;
      currency = 'c';
    }
    $('input[name="price"]').val(num);
    $('select[name="currency"]').val(currency === 'c' ? 1 : 2);
  });
  item_selector.change();
}, ["market3.php"]);

/**
 * Function to preserve scroll position on refresh after clicking on a link on
 * the page. On call this function restores scroll position (if any) and sets
 * up onclick handlers on elements to preserve scroll position.
 */
function preserveScrollPosOnClick(elements) {
  var scroll_pos_cache_key = "scrollpos:" + location.pathname;

  // Restore scroll position
  var scroll_pos = sessionStorage.getItem(scroll_pos_cache_key);
  if (scroll_pos !== null) {
    $(window).scrollTop(parseInt(scroll_pos, 10));
    sessionStorage.removeItem(scroll_pos_cache_key);
  }

  // Register onclick handlers for elements
  $.each(elements, function() {
    $(this).click(function() {
      sessionStorage.setItem(scroll_pos_cache_key, $(window).scrollTop());
    });
  });
}

/**
 * FEATURE: Adds tooltips (where possible) to items in search screen.
 * Credit goes to langer for the implementation.
 */
registerFunction(function addMarketSearchTooltips() {
  var markets = {};

  //Select all item rows from search
  $('table.maintable:contains(Name)').each(function() {
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
            .filter(function() {
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
            item_tooltip = $(item_data).filter('center').html();
          } else {
            item_tooltip = 'Error - Item Cannot Be Found';
          }
        }

        ddrivetip(item_tooltip, 450);
      })
      .mouseout(hideddrivetip);
  });
}, ["marketsearch2.php"]);

// =============================================================================
//                               Top 10 Lists
// =============================================================================
/**
 * FEATURE: Adds buttons to copy overall top 10 data.
 */
registerFunction(function addOverallTop10ExportButtons() {
  addTop10CopyButton("Highest Levels");
  addTop10CopyButton("Highest Wins");
  addTop10CopyButton("Highest Losses");
  addTop10CopyButton("Achievements Score");
}, ["highrecords.php"]);

/**
 * FEATURE: Adds buttons to copy weekly top 10 data.
 */
registerFunction(function addWeeklyTop10ExportButtons() {
  addTop10CopyButton("Most Exp Earned");
  addTop10CopyButton("Most Wins");
  addTop10CopyButton("Most Losses");
  addTop10CopyButton("Most Hunting Points");
  addTop10CopyButton("Most Warfare Points");
  addTop10CopyButton("Most Tokens Earned");
}, ["weekrecords.php"]);

/**
 * FEATURE: Adds buttons to copy gang top 10 data.
 */
registerFunction(function addGangTop10ExportButtons() {
  addTop10CopyButton("Gang List : Highest Levels");
  addTop10CopyButton("Gang List : Last Week\'s Warfare Points");
}, ["gangs2_4.php"]);

function addTop10CopyButton(table_title) {
  var table = Array.from(document.querySelectorAll('table')).find(function(candidate) {
    return candidate.rows.length &&
      candidate.rows[0].textContent.indexOf(table_title) !== -1;
  });
  if (!table) {
    return;
  }

  var players = Array.from(table.querySelectorAll('a[href*="profile.php"]')).map(function(link) {
    return link.textContent.trim();
  });
  var score_column = table.querySelector('font.colortext');
  if (!score_column) {
    return;
  }

  var scores = score_column.innerText.split('\n').map(function(score) {
    return score.trim();
  }).filter(Boolean);
  var row_count = Math.min(players.length, scores.length);
  var export_text = Array.from({ length: row_count }, function(_, index) {
    var score = scores[index].replace(/,/g, '');
    return [index + 1, players[index], score].map(function(value) {
      value = String(value);
      return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
    }).join(',');
  }).join('\n') + '\n';

  var copy_control = createCopyControl(export_text, 'Copy ranking data as CSV');
  copy_control.style.cssFloat = 'right';
  copy_control.style.marginRight = '5px';
  table.rows[0].cells[0].appendChild(copy_control);
}

function createCopyControl(text, title) {
  var control = document.createElement('span');
  control.style.position = 'relative';

  var button = document.createElement('button');
  button.type = 'button';
  button.textContent = '📋';
  button.title = title;
  button.setAttribute('aria-label', title);
  button.style.padding = '0 3px';
  button.style.border = '0';
  button.style.background = 'none';
  button.style.cursor = 'pointer';
  button.style.lineHeight = '1';

  var status = document.createElement('span');
  status.setAttribute('role', 'status');
  status.style.position = 'absolute';
  status.style.top = '100%';
  status.style.right = '0';
  status.style.zIndex = '1';
  status.style.whiteSpace = 'nowrap';
  status.style.padding = '2px 4px';
  status.style.background = '#111';
  status.style.color = '#fff';
  var statusTimeout;
  button.addEventListener('click', function() {
    var copyOperation = navigator.clipboard ?
      navigator.clipboard.writeText(text) :
      Promise.reject();
    copyOperation.then(function() {
      status.textContent = 'Copied to clipboard';
    }).catch(function() {
      status.textContent = 'Copy failed';
    }).finally(function() {
      window.clearTimeout(statusTimeout);
      statusTimeout = window.setTimeout(function() {
        status.textContent = '';
      }, 1500);
    });
  });

  control.appendChild(button);
  control.appendChild(status);
  return control;
}


// =============================================================================
//                                 Combat
// =============================================================================
registerFunction(function prefillPlayerCombatTarget() {
  // FEATURE: Pre-fill attack box with first name from list.
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        // Set first player row as target
        if (mutation.target.className === "search_row player_row") {
          if (!$('#target').val()) {
            var player_name = $(mutation.addedNodes[0]).text().trim();
            $('#target').val(player_name);
            $('#begin').removeAttr('disabled');
          }
        }

        // Add click handler to 'back to search link' to clear target box
        if (mutation.target.className === "search_row") {
          var back_link = $(mutation.addedNodes).find('a:contains("Back to Search Setup")');
          if (back_link.length) {
            back_link.click(function() {
              $('#target').val('');
            });
          }
        }
      }
    });
  });
  observer.observe(
    $('#searchbox')[0], {
      subtree: true,
      childList: true,
      characterData: true
    }
  );
}, ['fight.php']);

// =============================================================================
//                                Hunting
// =============================================================================
registerFunction(function huntingImprovements() {
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
  function getInventoryFreeSpace(html) {
    // Dev uses slot grids; production still uses legacy inventory tables.
    var emptySlotSelector = location.hostname === 'dev.legacy-game.net'
      ? '.item-grid:not(.equipped) .item_slot:not(:has(img))'
      : '.itemgrid:not(.equipped) td:not(:has(img))';
    return $(html).find(emptySlotSelector).length;
  }
  /*****************************************************
                      Hunt Recording Methods
  /****************************************************/
  function hunts(storageKey, initialValue) {
    function Record(data) {
      this.drops = data.drops || {};
      this.total = data.total || 0;
      this.add = function(drop) {
        this.drops[drop] = this.drops.hasOwnProperty(drop) ? this.drops[drop] + 1 : 1;
        this.total++;
      };
    }
    this.hunts = initialValue;
    this.add = function(huntNumb, drop) {
      this.hunts[huntNumb] = new Record(this.hunts[huntNumb] || {});
      this.hunts[huntNumb].add(drop);
    };
    this.save = function() {
      localStorage.setItem(storageKey, JSON.stringify(this.hunts));
    };
    this.load = function() {
      var toLoad = localStorage.getItem(storageKey);
      if (!toLoad) return;
      this.hunts = JSON.parse(toLoad);
    };
  }

  function getHuntOutcome() {
    var result = $('font:contains("Item Found")');
    var itemMatch = result.text().match(/Item Found\s*:\s*(.*?)\.\s*$/);
    if (itemMatch) {
      return itemMatch[1];
    }
    if ($('font:contains("An item was dropped but your inventory was full, so it was sent to the void.")').length) {
      return 'Void';
    }
    if (document.body.textContent.indexOf('You gained a total of') !== -1) {
      return 'NA';
    }
    return null;
  }

  function recordHuntResult(storageKey, initialValue, huntKey) {
    var outcome = getHuntOutcome();
    if (outcome === null || huntKey === null || huntKey === undefined || huntKey === '') {
      return;
    }
    var history = new hunts(storageKey, initialValue);
    history.load();
    history.add(huntKey, outcome);
    history.save();
  }

  /*****************************************************
                      Hunting Page Methods
  /****************************************************/
  function enhanceHuntResult() {
    var cookies = getCookies();
    recordHuntResult('hunts', [], cookies.hunting_group);

    var huntAgain = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]')).find(function(control) {
      return (control.textContent || control.value || '').trim() === 'Hunt Again';
    });
    if (!huntAgain) return;

    var controlsRow = huntAgain.closest('tr');
    if (controlsRow) {
      var inventoryRow = create("tr", {}, false, false);
      create("td", {
        class: "standardrow",
        colspan: "2",
        align: "center"
      }, "You have <span id='invSpace'>##</span> inventory spaces remaining.", inventoryRow);
      controlsRow.parentNode.insertBefore(inventoryRow, controlsRow.nextSibling);
    }

    $.ajax({
      url: 'inventory.php',
      async: true,
      success: function(data) {
        $('#invSpace').text(getInventoryFreeSpace(data));
      }
    });
  }
  /*****************************************************
                      Hunting Overview Page
  /****************************************************/
  //Method to display drop records for NPCs
  function showDrops() {
    var t = new hunts('hunts', []);
    t.load();
    var special = new hunts('specialHunts', {});
    special.load();
    var style = create('style', {}, false, document.head);
    style.textContent =
      '#les-hunt-history{margin-top:8px;font-size:10px;line-height:1.35;text-align:left}' +
      '.les-hunt-history{font-size:10px;line-height:1.35;text-align:left}' +
      '.les-hunt-history-header{display:flex;align-items:flex-start;justify-content:space-between;gap:6px}' +
      '.les-hunt-history-summary{font-weight:bold}' +
      '.les-hunt-history-copy{flex:none}' +
      '.les-hunt-history table{width:100%;margin-top:4px;border-collapse:collapse}' +
      '.les-hunt-history th,.les-hunt-history td{padding:2px 3px;border-top:1px solid #333}' +
      '.les-hunt-history th{text-align:left;color:#bbb;font-weight:normal}' +
      '.les-hunt-history th:nth-child(n+2),.les-hunt-history td:nth-child(n+2){text-align:right;white-space:nowrap}' +
      '.les-hunt-history-items>summary{margin-top:4px;cursor:pointer;font-weight:bold}' +
      '.les-hunt-history-item{position:relative;overflow:hidden}' +
      '.les-hunt-history-bar{position:absolute;top:1px;bottom:1px;left:0;background:rgba(70,191,189,.25)}' +
      '.les-hunt-history-label{position:relative}' +
      '#les-special-hunt-history{box-sizing:border-box;margin-top:8px;border:1px solid #333;text-align:left}' +
      '#les-special-hunt-history>summary{padding:4px 6px;color:#d6a928;cursor:pointer;font-weight:bold}' +
      '#les-special-hunt-history>details{margin:0 6px;border-top:1px solid #333;padding:3px 0}' +
      '#les-special-hunt-history>details>summary{cursor:pointer;font-weight:bold}' +
      '#les-special-hunt-history .les-hunt-history{margin:4px 6px}';

    function percent(count, total) {
      return total ? count / total * 100 : 0;
    }

    function csvCell(value) {
      value = String(value);
      return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
    }

    function createDropHistory(record, huntName, collapseItems) {
      var history = create('div', { class: 'les-hunt-history' });
      if (!record || !record.drops) {
        history.textContent = 'No hunt history recorded.';
        return history;
      }

      var outcomes = Object.keys(record.drops).map(function(name) {
        return { name: name, count: record.drops[name] };
      }).filter(function(outcome) {
        return outcome.count > 0;
      }).sort(function(a, b) {
        return b.count - a.count || a.name.localeCompare(b.name);
      });
      var total = outcomes.reduce(function(sum, outcome) {
        return sum + outcome.count;
      }, 0);
      var noDrop = record.drops.NA || 0;
      var voided = record.drops.Void || 0;
      var dropCount = total - noDrop;
      var itemOutcomes = outcomes.filter(function(outcome) {
        return outcome.name !== 'NA' && outcome.name !== 'Void';
      });
      var maxItemCount = itemOutcomes.reduce(function(maximum, outcome) {
        return Math.max(maximum, outcome.count);
      }, 0);

      var header = create('div', { class: 'les-hunt-history-header' }, false, history);
      var summary = create('div', { class: 'les-hunt-history-summary' }, false, header);
      summary.textContent = total + ' hunts · ' + dropCount + ' drops (' + percent(dropCount, total).toFixed(1) + '%) · ' + noDrop + ' no drop';
      if (voided) {
        summary.textContent += ' · ' + voided + ' voided';
      }

      var rows = [['hunt', 'outcome', 'count', 'percent_of_hunts']].concat(outcomes.map(function(outcome) {
        var name = outcome.name === 'NA' ? 'No drop' : outcome.name;
        return [huntName, name, outcome.count, percent(outcome.count, total).toFixed(2)];
      }));
      var csv = rows.map(function(row) {
        return row.map(csvCell).join(',');
      }).join('\n') + '\n';
      var copyControl = createCopyControl(csv, 'Copy hunt history as CSV');
      copyControl.classList.add('les-hunt-history-copy');
      header.appendChild(copyControl);

      if (itemOutcomes.length) {
        var tableParent = history;
        if (collapseItems) {
          tableParent = create('details', { class: 'les-hunt-history-items' }, false, history);
          create('summary', {}, 'Drops · ' + itemOutcomes.length + (itemOutcomes.length === 1 ? ' item type' : ' item types'), tableParent);
        }
        var table = create('table', {}, false, tableParent);
        var head = create('thead', {}, false, table);
        var headRow = create('tr', {}, false, head);
        ['Item', 'Count', 'Per hunt'].forEach(function(label) {
          var heading = create('th', { scope: 'col' }, false, headRow);
          heading.textContent = label;
        });
        var body = create('tbody', {}, false, table);
        itemOutcomes.forEach(function(outcome) {
          var row = create('tr', {}, false, body);
          var item = create('td', { class: 'les-hunt-history-item' }, false, row);
          var bar = create('span', { class: 'les-hunt-history-bar' }, false, item);
          bar.style.width = outcome.count / maxItemCount * 100 + '%';
          var label = create('span', { class: 'les-hunt-history-label' }, false, item);
          label.textContent = outcome.name;
          var count = create('td', {}, false, row);
          count.textContent = outcome.count;
          var rate = create('td', {}, false, row);
          rate.textContent = percent(outcome.count, total).toFixed(1) + '%';
        });
      } else {
        var empty = create('div', {}, false, history);
        empty.textContent = 'No identified item drops yet.';
      }

      return history;
    }

    function renderDropHistory(group) {
      var existing = document.getElementById('les-hunt-history');
      if (existing) {
        existing.remove();
      }

      var story = document.getElementById('group-desc-story');
      if (!story) {
        return;
      }

      var history = createDropHistory(t.hunts[group], group, true);
      history.id = 'les-hunt-history';
      story.insertAdjacentElement('afterend', history);
    }

    function renderSpecialDropHistories() {
      var links = Array.from(document.querySelectorAll('a[href*="p=2"][href*="h="]'));
      if (!links.length) {
        return;
      }

      var targets = links.map(function(link) {
        return new URL(link.href, location.href).searchParams.get('h');
      }).filter(function(target, index, allTargets) {
        return target && allTargets.indexOf(target) === index;
      });
      var section = create('details', { id: 'les-special-hunt-history' });
      create('summary', {}, 'Special hunt history', section);
      targets.forEach(function(target) {
        var details = create('details', {}, false, section);
        var summary = create('summary', {}, false, details);
        var record = special.hunts[target];
        var total = record && record.drops ? Object.keys(record.drops).reduce(function(sum, outcome) {
          return sum + record.drops[outcome];
        }, 0) : 0;
        summary.textContent = target + (total ? ' · ' + total + (total === 1 ? ' hunt' : ' hunts') : '');
        details.appendChild(createDropHistory(record, target, false));
      });
      var specialHuntList = links[0].parentElement;
      while (specialHuntList && !links.every(function(link) {
        return specialHuntList.contains(link);
      })) {
        specialHuntList = specialHuntList.parentElement;
      }
      if (specialHuntList && /^(TBODY|THEAD|TFOOT|TR|TD)$/.test(specialHuntList.tagName)) {
        specialHuntList = specialHuntList.closest('table');
      }
      if (specialHuntList) {
        var specialHuntBounds = specialHuntList.getBoundingClientRect();
        section.style.width = specialHuntBounds.width + 'px';
      }
      (specialHuntList || links[links.length - 1].parentElement).insertAdjacentElement('afterend', section);
      if (specialHuntList) {
        section.style.marginLeft = specialHuntBounds.left - section.getBoundingClientRect().left + 'px';
      }
    }

    var OldpositionToElement = window.positionToElement;
    window.positionToElement = function() {
      OldpositionToElement.apply(this, arguments);
      var selectedGroup = arguments[0] && arguments[0][0];
      if (selectedGroup && selectedGroup.dataset) {
        renderDropHistory(selectedGroup.dataset.row);
      }
    };
    renderSpecialDropHistories();
    positionToElement(select, false);
  }
  /*****************************************************
                      Misc
  /****************************************************/
  //call methods where relevant
  switch (location.pathname) {
    case '/hunting3.php':
      enhanceHuntResult();
      break;
    case '/hunting5.php':
      recordHuntResult('specialHunts', {}, new URLSearchParams(location.search).get('h'));
      break;
    case '/hunting.php':
      showDrops();
      break;
  }
}, ['hunting.php', 'hunting3.php', 'hunting5.php']);


// =============================================================================
//                               Wasteland
// =============================================================================
/**
 * FEATURE: Adds a 3x3 hovercard preview to gang alerts.
 */
registerFunction(function addAlertPreview() {
  var CELL_PITCH = 33;
  var MAP_SIZE = 15 * CELL_PITCH + 1;
  var PREVIEW_SIZE = 3 * CELL_PITCH + 1;

  // Returns 3x3 map preview centered around x,y coords
  function mapPreview(x, y) {
    var cacheKey = Date.now();
    var mapUri = '/maps/map1_gang.png?c=' + cacheKey;
    var overlayUri = '/maps/map1_overlay.png?c=' + cacheKey;
    var mapImage = document.createElement('img');
    mapImage.src = overlayUri;
    mapImage.style.backgroundImage = 'url("' + mapUri + '")';
    mapImage.style.backgroundRepeat = 'no-repeat';
    mapImage.style.display = 'block';

    var mapLayer = document.createElement('div');
    mapLayer.style.width = MAP_SIZE + 'px';
    mapLayer.style.height = MAP_SIZE + 'px';
    mapLayer.style.overflow = 'hidden';
    mapLayer.style.position = 'absolute';
    mapLayer.style.top = -CELL_PITCH * (y - 2) + 'px';
    mapLayer.style.left = -CELL_PITCH * (x - 2) + 'px';
    mapLayer.appendChild(mapImage);

    var preview = document.createElement('div');
    preview.style.width = PREVIEW_SIZE + 'px';
    preview.style.height = PREVIEW_SIZE + 'px';
    preview.style.overflow = 'hidden';
    preview.style.position = 'relative';
    preview.appendChild(mapLayer);

    return preview.outerHTML;
  }

  function getAlertCoords(text) {
    var coords = text.match(/reported at\s+(\d+),(\d+)/i);
    if (!coords) {
      return null;
    }
    return {
      x: parseInt(coords[1], 10),
      y: parseInt(coords[2], 10)
    };
  }

  function bindPreview(element) {
    if (element.hasAttribute('data-les-alert-preview')) {
      return;
    }
    element.setAttribute('data-les-alert-preview', '');
    element.addEventListener('mouseenter', function() {
      var coords = getAlertCoords(element.textContent);
      if (coords) {
        ddrivetip(mapPreview(coords.x, coords.y), PREVIEW_SIZE);
      }
    });
    element.addEventListener('mouseleave', hideddrivetip);
  }

  function bindAlertPreviews() {
    Array.prototype.forEach.call(
      document.querySelectorAll('#combatlog-content > font'),
      function(element) {
        if (getAlertCoords(element.textContent)) {
          bindPreview(element);
        }
      }
    );

    var gangChat = document.querySelector('#gangchat-content');
    if (!gangChat) {
      return;
    }
    var walker = document.createTreeWalker(
      gangChat,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    var alertNodes = [];
    while (walker.nextNode()) {
      if (getAlertCoords(walker.currentNode.nodeValue)) {
        alertNodes.push(walker.currentNode);
      }
    }
    alertNodes.forEach(function(textNode) {
      if (textNode.parentElement.hasAttribute('data-les-alert-preview')) {
        return;
      }
      var wrapper = document.createElement('span');
      textNode.parentNode.insertBefore(wrapper, textNode);
      wrapper.appendChild(textNode);
      bindPreview(wrapper);
    });
  }

  bindAlertPreviews();

  var alertObserver = new MutationObserver(bindAlertPreviews);
  ['#combatlog-content', '#gangchat-content'].forEach(function(selector) {
    var element = document.querySelector(selector);
    if (element) {
      alertObserver.observe(element, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }
  });
}, [".*"]);

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

  //Method to convert RGB values into hex for flag variables
  function toHex(r, g, b) {
    var hex = "0123456789ABCDEF",
      ans;
    r = hex.charAt((r - (r % 16)) / 16) + hex.charAt(r % 16);
    g = hex.charAt((g - (g % 16)) / 16) + hex.charAt(g % 16);
    b = hex.charAt((b - (b % 16)) / 16) + hex.charAt(b % 16);
    ans = "#" + r + g + b;
    return ans;
  }
  /*****************************************************
                      CSS Injection
  /****************************************************/
  var custom = "" +
    "#uploadPanel{height:auto;width:auto;min-width:190px;background:#171717;color:#ddd;border:1px solid #5b4b2a;padding:8px;position:absolute;top:20px;left:20px;max-height:90%;max-width:90%;overflow:auto;box-shadow:0 3px 12px rgba(0,0,0,.7);z-index:1000;}\n" +
    "#uploadPanel input[type=button]{padding:3px 7px;border:1px solid #666;background:#333;color:#eee;cursor:pointer;}\n" +
    "#uploadPanel input[type=button]:hover{background:#444;}\n" +
    ".les-flag-title{margin:-8px -8px 8px;padding:5px 8px;background:#252525;color:#d6a928;text-align:center;font-weight:bold;}\n" +
    ".les-flag-preview{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}\n" +
    "#flagOut{width:80px;height:60px;border:1px solid #666;background:#000;image-rendering:pixelated;}\n" +
    ".les-flag-options{display:grid;grid-template-columns:1fr auto;align-items:center;gap:5px 10px;margin-bottom:8px;}\n" +
    ".les-flag-options label{display:contents;}\n" +
    ".les-flag-actions{display:flex;gap:5px;margin-bottom:8px;}\n" +
    ".les-flag-actions input{flex:1;}\n" +
    "#edit{width:100%;margin-bottom:6px;}\n" +
    "#editPanel{display:none;margin-bottom:6px;text-align:center;}\n" +
    "#editPanel input+input{margin-left:5px;}\n" +
    "#container{position:relative;display:block;height:30px;width:40px;padding:1px;border:1px solid #444;background:#0b0b0b;}\n" +
    "#rawImage{position: absolute; display:block; z-index:1;}\n" +
    "#getArea{position:absolute; height:30px; width:40px; top:1px; left:1px; border:1px solid red;z-index:2;cursor:move;touch-action:none;}\n" +
    "#getAreaResize{display:none;position:absolute;right:-5px;bottom:-5px;width:9px;height:9px;background:#fff;border:1px solid #900;cursor:nwse-resize;}\n" +
    ".les-flag-source{display:block;margin-top:8px;color:#aaa;}\n" +
    "#imageUpload{display:block;max-width:240px;margin-top:3px;color:#ddd;}";

  create('style', {
    type: 'text/css'
  }, custom, document.head);

  /*****************************************************
                      Interface Creation & Injection
  /****************************************************/

  var panel = create('div', {
    id: 'uploadPanel'
  }, false, document.body);
  create('div', {
    class: 'les-flag-title'
  }, 'Flag Import', panel);
  var preview = create('div', {
    class: 'les-flag-preview'
  }, false, panel);
  create('canvas', {
    id: 'flagOut',
    width: '40',
    height: '30'
  }, false, preview);
  create('input', {
    id: 'toFlag',
    type: 'button',
    value: 'Send to Flag'
  }, false, preview);
  var options = create('div', {
    class: 'les-flag-options'
  }, false, panel);
  var resizeLabel = create('label', {}, 'Resize selection', options);
  create('input', {
    id: 'resizeToggle',
    type: 'checkbox'
  }, false, resizeLabel);
  var ratioLabel = create('label', {}, 'Keep aspect ratio', options);
  create('input', {
    id: 'Aratio',
    type: 'checkbox',
    checked: 'checked',
    disabled: 'disabled'
  }, false, ratioLabel);
  var actions = create('div', {
    class: 'les-flag-actions'
  }, false, panel);
  create('input', {
    id: 'reset',
    type: 'button',
    value: 'Reset selection'
  }, false, actions);
  create('input', {
    id: 'rawImgHide',
    type: 'button',
    value: 'Show/hide image'
  }, false, actions);
  create('input', {
    id: 'edit',
    type: 'button',
    value: 'Editing tools'
  }, false, panel);
  var edit = create('div', {
    id: 'editPanel'
  }, false, panel);
  create('input', {
    id: 'greyscale',
    type: 'button',
    value: 'Greyscale'
  }, false, edit);
  create('input', {
    id: 'invert',
    type: 'button',
    value: 'Invert'
  }, false, edit);
  var container = create('div', {
    id: 'container'
  }, false, panel);
  create('canvas', {
    id: 'rawImage',
    width: '40',
    height: '30'
  }, false, container);
  var area = create('div', {
    id: 'getArea'
  }, false, container);
  create('span', {
    id: 'getAreaResize'
  }, false, area);
  create('label', {
    class: 'les-flag-source',
    for: 'imageUpload'
  }, 'Source image', panel);
  create('input', {
    id: 'imageUpload',
    type: 'file'
  }, false, panel);

  /*****************************************************
                      Canvas Methods
  /****************************************************/

  //Sends image data to 'large' canvas, from which we can select the desired area
  function toRawCanvas(imgData) {
    var img = new Image(),
      rawcanvas = document.getElementById('rawImage'),
      context = rawcanvas.getContext('2d'),
      area;
    img.src = imgData;
    img.onload = function() {
      var container = document.getElementById('container');
      var maxWidth = Math.max(40, Math.min(640, window.innerWidth - 80));
      var maxHeight = Math.max(30, Math.min(640, window.innerHeight - 260));
      var scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
      var width = Math.max(1, Math.round(img.width * scale));
      var height = Math.max(1, Math.round(img.height * scale));
      container.style.height = height + 2 + 'px';
      container.style.width = width + 2 + 'px';
      rawcanvas.height = height + 2;
      rawcanvas.width = width + 2;
      context.drawImage(img, 1, 1, width, height);
      area = document.getElementById('getArea');
      area.style.top = '1px';
      area.style.left = '1px';
    };
  }

  //Ctrl + V to paste an image to the canvas
  //Currently only available with Chrome
  function onPasteHandler(e) {
    if (e.clipboardData) {
      var items = e.clipboardData.items,
        blob,
        source;
      if (!items) {
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
  function selectionBounds() {
    var horizontalBorder = area.offsetWidth - area.clientWidth;
    var verticalBorder = area.offsetHeight - area.clientHeight;
    return {
      maxLeft: container.clientWidth - area.offsetWidth,
      maxTop: container.clientHeight - area.offsetHeight,
      maxWidth: container.clientWidth - area.offsetLeft - horizontalBorder,
      maxHeight: container.clientHeight - area.offsetTop - verticalBorder
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  var resizeHandle = document.getElementById('getAreaResize');
  var pointerAction = null;
  area.addEventListener('pointerdown', function(event) {
    if (event.button !== 0) {
      return;
    }
    var resizing = event.target === resizeHandle;
    pointerAction = {
      mode: resizing ? 'resize' : 'drag',
      x: event.clientX,
      y: event.clientY,
      left: area.offsetLeft,
      top: area.offsetTop,
      width: area.clientWidth,
      height: area.clientHeight
    };
    area.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  area.addEventListener('pointermove', function(event) {
    if (!pointerAction || !area.hasPointerCapture(event.pointerId)) {
      return;
    }
    var dx = event.clientX - pointerAction.x;
    var dy = event.clientY - pointerAction.y;
    var bounds = selectionBounds();
    if (pointerAction.mode === 'drag') {
      area.style.left = clamp(pointerAction.left + dx, 0, bounds.maxLeft) + 'px';
      area.style.top = clamp(pointerAction.top + dy, 0, bounds.maxTop) + 'px';
      return;
    }

    var width = clamp(pointerAction.width + dx, 5, bounds.maxWidth);
    var height = clamp(pointerAction.height + dy, 5, bounds.maxHeight);
    if (document.getElementById('Aratio').checked) {
      var ratio = pointerAction.width / pointerAction.height;
      if (Math.abs(dx) >= Math.abs(dy * ratio)) {
        height = width / ratio;
      } else {
        width = height * ratio;
      }
      var scale = Math.min(1, bounds.maxWidth / width, bounds.maxHeight / height);
      width *= scale;
      height *= scale;
    }
    area.style.width = Math.max(5, width) + 'px';
    area.style.height = Math.max(5, height) + 'px';
  });

  area.addEventListener('pointerup', function(event) {
    if (!pointerAction) {
      return;
    }
    pointerAction = null;
    area.releasePointerCapture(event.pointerId);
    renderSelection();
  });

  area.addEventListener('pointercancel', function() {
    pointerAction = null;
  });
  window.addEventListener("paste", onPasteHandler);
  //Show/Hide the Raw Canvas from view
  //Mainly for when the image is larger than the window, or file upload is difficult to see
  $('#rawImgHide').click(function() {
    $('#container').slideToggle('slow');
  });
  //Reset the capture div back to default size
  $('#reset').click(function() {
    var area = document.getElementById('getArea');
    area.style.height = "30px";
    area.style.width = "40px";
  });
  //Aspect ratio can only be enabled/disabled when the capture div is resizable
  $('#resizeToggle').click(function() {
    resizeHandle.style.display = this.checked ? 'block' : 'none';
    document.getElementById('Aratio').disabled = !this.checked;
  });
  //Image upload from local machine to raw canvas
  $('#imageUpload').change(function() {
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
  function renderSelection() {
    var rawcanvas = document.getElementById('rawImage'),
      out = document.getElementById('flagOut'),
      outctx = out.getContext('2d'),
      x = parseInt(area.style.left, 10),
      y = parseInt(area.style.top, 10);
    outctx.clearRect(0, 0, out.width, out.height);
    outctx.drawImage(rawcanvas, x, y, area.clientWidth, area.clientHeight, 0, 0, out.width, out.height);
  }
  //Sent image from preview canvas to legacy page, adjusting page variables and 'pixel' block backgrounds
  $('#toFlag').click(function() {
    var canvas = document.getElementById('flagOut'),
      context = canvas.getContext('2d'),
      w = canvas.width,
      h = canvas.height,
      imgd = context.getImageData(0, 0, w, h),
      pix = imgd.data;

    for (var i = 0; i < h; i++) {
      for (var j = 0; j < w; j++) {
        document.getElementsByName("X" + j + "Y" + i)[0].bgColor = pic[j + i * w] = toHex(pix[(j + i * w) * 4], pix[(j + i * w) * 4 + 1], pix[(j + i * w) * 4 + 2]);
      }
    }
  });
  /*****************************************************
                      Effect Addons
  /****************************************************/
  //Hide/Show effect options
  $('#edit').click(function() {
    $('#editPanel').slideToggle();
  });
  //Perform greyscale effect on output flag
  $('#greyscale').click(function() {
    document.getElementById('flagOut').greyscale();
  });
  //Invert output flag colours
  $('#invert').click(function() {
    document.getElementById('flagOut').invert();
  });

  HTMLCanvasElement.prototype.greyscale = function() {
    var ctx = this.getContext('2d'),
      data = ctx.getImageData(0, 0, this.width, this.height),
      d = data.data;
    for (var i = 0; i < d.length; i += 4) {
      d[i] = d[i + 1] = d[i + 2] = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    }
    ctx.putImageData(data, 0, 0);
  };

  HTMLCanvasElement.prototype.invert = function() {
    var ctx = this.getContext('2d'),
      data = ctx.getImageData(0, 0, this.width, this.height),
      d = data.data;
    for (var i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(data, 0, 0);
  };
}, ['flag.php']);

// =============================================================================
//                                 Utilities
// =============================================================================
function bindShortcut(key, handler) {
  document.addEventListener('keydown', function(event) {
    var target = event.target;
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      target.isContentEditable ||
      /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)
    ) {
      return;
    }
    if (event.key.toLowerCase() === key) {
      handler();
    }
  });
}

/**
 * Does a synchronous (blocking) get and returns the result.
 */
function syncGet(url) {
  var fetched_data;
  $.ajax({
    url: url,
    async: false,
    success: function(data) {
      fetched_data = data;
    },
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
