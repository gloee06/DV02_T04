// q3.js - paste into the JavaScript box of KNIME's Generic JavaScript View
// Input table columns: Group, Count, Year   (Group = jurisdiction)
// Optional extra column: RoadUser (shown in the tooltip if present)
(function () {

  var LEAFLET_JS  = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
  var LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';

  // Approximate centre of each jurisdiction: [latitude, longitude]
  var COORDS = {
    "New South Wales":              [-32.2, 147.0],
    "Victoria":                     [-36.9, 144.3],
    "Queensland":                   [-22.5, 144.5],
    "South Australia":              [-30.0, 135.8],
    "Western Australia":            [-26.0, 121.5],
    "Tasmania":                     [-42.0, 146.6],
    "Northern Territory":           [-19.5, 133.4],
    "Australian Capital Territory": [-35.5, 149.0]
  };

  // viridis-like colour ramp
  var RAMP = ['#440154', '#3b528b', '#21908d', '#5dc863', '#fde725'];
  function colour(t) {
    var p = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
    return RAMP[Math.round(p)];
  }

  // Create the page structure from the script, so the Body box can stay empty
  function buildPage() {
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = LEAFLET_CSS;
    document.head.appendChild(css);

    document.body.innerHTML =
      '<div id="q3-header">' +
        '<h1>Hospitalised road injuries &ndash; largest road-user group</h1>' +
        '<span>Year:</span><span id="q3-year"></span>' +
        '<input id="q3-slider" type="range" min="0" max="0" value="0">' +
        '<button id="q3-play" type="button">Play</button>' +
      '</div>' +
      '<div id="q3-map"></div>';
  }

  function start() {
    // 1) read the KNIME table
    var cols = knimeDataTable.getColumnNames();
    var rows = knimeDataTable.getRows();
    var iG = cols.indexOf('Group');
    var iC = cols.indexOf('Count');
    var iY = cols.indexOf('Year');
    var iR = cols.indexOf('RoadUser');          // -1 if not in the table

    var data = [];
    for (var r = 0; r < rows.length; r++) {
      var d = rows[r].data;
      data.push({
        g: String(d[iG]).trim(),
        c: Number(d[iC]),
        y: Number(d[iY]),
        u: iR >= 0 ? String(d[iR]) : null
      });
    }
    var years = Array.from(new Set(data.map(function (d) { return d.y; })))
                     .sort(function (a, b) { return a - b; });
    var counts = data.map(function (d) { return d.c; });
    var minC = Math.min.apply(null, counts), maxC = Math.max.apply(null, counts);

    // 2) base map (fitted so Tasmania is visible)
    var map = L.map('q3-map');
    map.fitBounds([[-44.5, 113], [-10, 154]]);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 8
    }).addTo(map);
    var layer = L.layerGroup().addTo(map);

    // 3) legend
    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
      var div = L.DomUtil.create('div', 'q3-legend');
      div.innerHTML = '<b>Hospitalised count</b><div class="bar"></div>' +
        '<div class="ends"><span>' + minC.toLocaleString() + '</span><span>' +
        maxC.toLocaleString() + '</span></div>';
      return div;
    };
    legend.addTo(map);

    // 4) draw one year
    function draw(year) {
      layer.clearLayers();
      data.filter(function (d) { return d.y === year; }).forEach(function (d) {
        var ll = COORDS[d.g];
        if (!ll) { return; }                       // name mismatch -> skipped
        var t = maxC > minC ? (d.c - minC) / (maxC - minC) : 0.5;
        var radius = 8 + 38 * Math.sqrt(d.c / maxC);
        var tip = '<div class="q3-tip"><b>' + d.g + '</b><br>' + year + ': ' +
                  d.c.toLocaleString() + ' hospitalised' +
                  (d.u ? '<br>Largest group: ' + d.u : '') + '</div>';
        L.circleMarker(ll, {
          radius: radius, color: '#222', weight: 1,
          fillColor: colour(t), fillOpacity: 0.8
        }).bindTooltip(tip).addTo(layer);
      });
      document.getElementById('q3-year').textContent = year;
    }

    // 5) slider + play button
    var slider = document.getElementById('q3-slider');
    var play = document.getElementById('q3-play');
    slider.max = years.length - 1;
    slider.value = 0;
    slider.oninput = function () { draw(years[+slider.value]); };

    var timer = null;
    play.onclick = function () {
      if (timer) { clearInterval(timer); timer = null; play.textContent = 'Play'; return; }
      play.textContent = 'Pause';
      timer = setInterval(function () {
        slider.value = (+slider.value + 1) % years.length;
        draw(years[+slider.value]);
      }, 900);
    };

    draw(years[0]);
  }

  buildPage();
  if (window.L) { start(); return; }
  var sc = document.createElement('script');
  sc.src = LEAFLET_JS;
  sc.onload = start;
  document.head.appendChild(sc);
})();
