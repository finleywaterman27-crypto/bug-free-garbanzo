/* ---------------------------------------------------------------------------
 * The hour of the day, as a colour.
 *
 * Everything on the island is painted in daylight. Rather than paint it all
 * again for every hour — which would mean a second island in memory for each
 * one, and a second set of every prop — the whole picture is MULTIPLIED by a
 * single colour once it is drawn. Multiply is the right operation for this
 * and not a trick: it is what sunlight does. Light of a colour falls on a
 * surface of a colour, and what comes back is the two multiplied. A white
 * noon changes nothing; an amber evening warms every surface by the same
 * amount its own colour allows; a blue night darkens the lot without
 * flattening it, because a bright thing stays brighter than a dark one.
 *
 * The one rule this has to obey: it must never make the island unreadable.
 * A game you play in the evening is not improved by a screen you have to
 * squint at, so the darkest hour of the night still comes back at about
 * four tenths of daylight and keeps its hue — a cool island you can see,
 * not a black one.
 * ------------------------------------------------------------------------ */
(function (root) {
  "use strict";

  var DAY = 24 * 60;

  /* The colour the daylight is multiplied by, through the day. Between two
   * stops the colour is mixed, so the light slides rather than steps: no
   * moment of the day is a jump from the one before it.
   *
   * Written as the hours anyone would name. The night is long and holds one
   * colour; the two ends of the day are short and move quickly, which is
   * what makes dawn and dusk feel like events rather than settings. */
  var STOPS = [
    { at: 0 * 60,        name: "Night",     c: "#6d7cb8" },
    { at: 4 * 60 + 30,   name: "Night",     c: "#6d7cb8" },
    { at: 5 * 60 + 30,   name: "Dawn",      c: "#b09ac0" },
    { at: 6 * 60 + 30,   name: "Sunrise",   c: "#ffc39a" },
    { at: 8 * 60,        name: "Morning",   c: "#fff2e0" },
    { at: 11 * 60,       name: "Midday",    c: "#ffffff" },
    { at: 12 * 60 + 30,  name: "Afternoon", c: "#ffffff" },
    { at: 15 * 60,       name: "Afternoon", c: "#ffffff" },
    { at: 17 * 60,       name: "Afternoon", c: "#fff0d6" },
    { at: 18 * 60 + 30,  name: "Golden",    c: "#ffc189" },
    { at: 19 * 60 + 30,  name: "Sunset",    c: "#e79b86" },
    { at: 20 * 60 + 30,  name: "Dusk",      c: "#9d8cba" },
    { at: 21 * 60 + 30,  name: "Night",     c: "#6d7cb8" },
    { at: DAY,           name: "Night",     c: "#6d7cb8" }
  ];

  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hex(a) {
    return "#" + (((1 << 24) + (Math.round(a[0]) << 16) +
      (Math.round(a[1]) << 8) + Math.round(a[2])).toString(16).slice(1));
  }

  /** Minutes since midnight, wrapped, so 25:00 and 1:00 are the same hour. */
  function wrap(minutes) {
    var m = Number(minutes) || 0;
    return ((m % DAY) + DAY) % DAY;
  }

  /** The colour daylight is multiplied by at this minute of the day. */
  function lightAt(minutes) {
    var m = wrap(minutes);
    for (var i = 1; i < STOPS.length; i++) {
      if (m > STOPS[i].at) continue;
      var a = STOPS[i - 1], b = STOPS[i];
      var span = b.at - a.at;
      /* Eased, not linear: the light lingers at each hour and moves through
       * the middle of the change, which is how the sky actually goes. */
      var t = span <= 0 ? 0 : (m - a.at) / span;
      t = t * t * (3 - 2 * t);
      var ca = rgb(a.c), cb = rgb(b.c);
      return hex([ca[0] + (cb[0] - ca[0]) * t,
                  ca[1] + (cb[1] - ca[1]) * t,
                  ca[2] + (cb[2] - ca[2]) * t]);
    }
    return STOPS[STOPS.length - 1].c;
  }

  /** What to call this hour, for a clock face. */
  function momentAt(minutes) {
    var m = wrap(minutes);
    var best = STOPS[0];
    for (var i = 0; i < STOPS.length; i++) if (STOPS[i].at <= m) best = STOPS[i];
    return best.name;
  }

  /** Is it dark enough for a window to be worth lighting? Set by eye at the
   *  hour a lamp starts to read as a lamp: at golden hour a lit window is
   *  just a pale square, and putting one on then made it look like the sun
   *  was shining out of the house. */
  function isDark(minutes) {
    var c = rgb(lightAt(minutes));
    return (c[0] + c[1] + c[2]) / 3 < 176;
  }

  /** The time as a clock reads it. */
  function clock(minutes) {
    var m = wrap(minutes);
    var h = (m / 60) | 0, mm = (m % 60) | 0;
    return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
  }

  /** Minutes since midnight, right now, wherever whoever is playing is. */
  function now() {
    var d = new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }

  root.CozySky = {
    DAY: DAY, STOPS: STOPS,
    lightAt: lightAt, momentAt: momentAt, isDark: isDark,
    clock: clock, now: now, wrap: wrap
  };
})(typeof window !== "undefined" ? window : this);
