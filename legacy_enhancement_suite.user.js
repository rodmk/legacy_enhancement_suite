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
// @version     0.0.2
// @require     http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.js
// @require     http://locachejs.org/build/locache.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/mousetrap/1.4.6/mousetrap.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore.js
// @require     http://cdnjs.cloudflare.com/ajax/libs/URI.js/1.11.2/URI.min.js
// ==/UserScript==

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
  // Load CSS resources
  $('head').append($('<link href="//maxcdn.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css" rel="stylesheet">'));

  var current_path = window.location.pathname;
  $.each(function_registry, function(rule, fns) {
    if (current_path.match(rule)) {
      $.each(fns, function(i, fn) { fn(); });
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
  heal_me_link.click(fullHeal);
  hospital_node.after(heal_me_link);
}, [ ".*" ]);

/**
 * FEATURE: Binds 'h' to full heal.
 */
registerFunction(function addQuickHealKeybinding() {
  Mousetrap.bind('h', function() { fullHeal(); return false; });
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

// =============================================================================
//                                  Gangs
// =============================================================================
/**
 * FEATURE: Adds simple functionality to copy over the top 10 list (since just
 * selecting and copying the text is a total mess), by adding an icon linking
 * to the data in the table.
 */
registerFunction(function addGangTop10ExportButton() {
  // Read the scores from the document and parse them
  var table = $('table:contains("Gang List : Last Week\'s Warfare Points")');
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
  var data = 'data:text,' + export_text;

  // Add icon-link to document with exported text
  var link = $("<a style='position: relative; right: 5px; float: right;''>");
  link.attr('href', data);
  link.append($('<i class="fa fa-file-text"></i>'));
  var title = $('font:contains("Gang List : Last Week\'s Warfare Points")');
  title.after(link);
}, [ "gangs2_4.php" ]);

// =============================================================================
//                               Wasteland
// =============================================================================
/**
 * Feature: Adds mouse tooltip showing coordinates to wl map.
 */
registerFunction(function wlMapCoOrds() {
  var tooltip_width = 35;
  var coords = $('<div><div style="text-align:center;">1,1</div></div>');
  $('#overlay2')
    .mouseover(function(){ ddrivetip(coords.html(), tooltip_width); })
    .mousemove(function(e) {
      // Firefox doesn't implement offsetX/Y, so compute it ourselves if needed.
      var offX  = (e.offsetX || e.clientX - $(e.target).offset().left + window.pageXOffset);
      var offY  = (e.offsetY || e.clientY - $(e.target).offset().top  + window.pageYOffset);
      var x = Math.ceil(offX / 33);
      var y = Math.ceil(offY / 33);
      coords.children().text(x + ',' + y);
      ddrivetip(coords.html(), tooltip_width);
    })
    .mouseout(hideddrivetip);
}, [ 'map.php' ]);

// =============================================================================
//                               Platinum Store
// =============================================================================
/**
 * Feature: Formats remaining boost time to a saner format.
 */
registerFunction(function formatReimainingBoostTime() {
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
        console.log(out);
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
//                                 Constants
// =============================================================================
var SEC_IN_HOUR = 60 * 60; // 1 hour

// =============================================================================
//                                 Utilities
// =============================================================================
/**
 * Adds caching to a function. Fetches from cache if value is there, otherwise
 * generates, stores in cache, and returns results of fetch_fn.
 */
function cachedFetch(cache_key, cache_timeout, fetch_fn) {
  var session_key = sessionKey(cache_key);
  var value = locache.get(session_key);
  if (!value) {
    value = fetch_fn();
    locache.set(session_key, value, cache_timeout);
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
      legacy_hash = document.cookie.match(/legacy_hash=(\w+);/)[1];
      break;
    case 'dev':
      legacy_hash = document.cookie.match(/legacy_hash_dev=(\w+);/)[1];
      break;
  }
  return key + ":" + legacy_hash;
}
