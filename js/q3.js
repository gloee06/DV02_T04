// Question 3: Which road-user group accounts for the largest hospitalised injury
// count in each jurisdiction, and how did counts and shares change 2011 -> 2021?
// Renders a Leaflet map plus a 2011 vs 2021 summary table into #q3-heatmap-chart.
// Data: data/q3_map.csv  (columns: Group, RoadUser, Count, SharePct, Year)
(() => {
  const TARGET_ID = 'q3-heatmap-chart';
  const DATA_URL = 'q3_jurisdiction_roadusers';
  const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
  const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';

  // Approximate centre of each jurisdiction: [latitude, longitude]
  const COORDS = {
    'New South Wales': [-32.2, 147.0],
    'Victoria': [-36.9, 144.3],
    'Queensland': [-22.5, 144.5],
    'South Australia': [-30.0, 135.8],
    'Western Australia': [-26.0, 121.5],
    'Tasmania': [-42.0, 146.6],
    'Northern Territory': [-19.5, 133.4],
    'Australian Capital Territory': [-35.5, 149.0]
  };

  const ROAD_USER_LABELS = {
    Car: 'Car occupants',
    Motorcyclist: 'Motorcyclists',
    PedalCyclist: 'Pedal cyclists',
    Pedestrian: 'Pedestrians',
    HeavyTransport: 'Heavy transport',
    PickupVan: 'Pick-up truck or van',
    Bus: 'Bus occupants'
  };

  const formatCount = d3.format(',');
  const formatSignedCount = d3.format('+,');
  const formatSignedPp = d3.format('+.1f');
  const label = (user) => ROAD_USER_LABELS[user] || user;
  const pct = (value) => (Number.isFinite(value) ? `${value.toFixed(1)}%` : 'n/a');

  const loadLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) { resolve(); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS;
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Leaflet could not be loaded (check the internet connection).'));
    document.head.append(css, script);
  });

  const parseRows = (rows) => rows
    .map((row) => ({
      group: String(row.Group || '').trim(),
      user: String(row.RoadUser || '').trim(),
      count: +row.Count,
      share: +(row.SharePct ?? row.Share),
      year: +row.Year
    }))
    .filter((row) => row.group && Number.isFinite(row.count) && Number.isFinite(row.year));

  const buildTable = (data, firstYear, lastYear) => {
    const byKey = new Map(data.map((row) => [`${row.group}|${row.year}`, row]));
    const groups = [...new Set(data.map((row) => row.group))].sort(d3.ascending);

    const body = groups.map((group) => {
      const a = byKey.get(`${group}|${firstYear}`);
      const b = byKey.get(`${group}|${lastYear}`);
      if (!a || !b) { return ''; }
      return `<tr>
        <th scope="row">${group}</th>
        <td>${label(a.user)}</td>
        <td class="q3-num">${formatCount(a.count)}</td>
        <td class="q3-num">${pct(a.share)}</td>
        <td>${label(b.user)}</td>
        <td class="q3-num">${formatCount(b.count)}</td>
        <td class="q3-num">${pct(b.share)}</td>
        <td class="q3-num">${formatSignedCount(b.count - a.count)}</td>
        <td class="q3-num">${formatSignedPp(b.share - a.share)} pp</td>
      </tr>`;
    }).join('');

    return `<table class="q3-table">
      <caption class="q3-summary">Largest road-user group in ${firstYear} and ${lastYear}, with the change in its count and share of the jurisdiction total.</caption>
      <thead><tr>
        <th scope="col">Jurisdiction</th>
        <th scope="col">${firstYear} group</th><th scope="col">Count</th><th scope="col">Share</th>
        <th scope="col">${lastYear} group</th><th scope="col">Count</th><th scope="col">Share</th>
        <th scope="col">Count change</th><th scope="col">Share change</th>
      </tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  };

  const render = (root, data) => {
    const years = [...new Set(data.map((row) => row.year))].sort(d3.ascending);
    const firstYear = years[0];
    const lastYear = years[years.length - 1];
    const [minCount, maxCount] = d3.extent(data, (row) => row.count);
    const colour = d3.scaleSequential(d3.interpolateYlGn).domain([minCount, maxCount]);

    root.innerHTML = `
      <div class="q3-controls">
        <label for="q3-year-slider">Year</label>
        <span class="q3-year-label" id="q3-year-label" aria-live="polite"></span>
        <input class="q3-slider" id="q3-year-slider" type="range" min="0" max="${years.length - 1}" value="${years.length - 1}">
        <button class="q3-play" id="q3-play" type="button">Play</button>
      </div>
      <div class="q3-map" id="q3-map" role="img" aria-label="Map of Australia showing the largest road-user group hospitalisation count in each jurisdiction"></div>
      <div class="q3-table-wrap">${buildTable(data, firstYear, lastYear)}</div>`;

    const map = L.map('q3-map', { scrollWheelZoom: false });
    map.fitBounds([[-44.5, 113], [-10, 154]]);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 8
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);

    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'q3-legend');
      const stops = d3.range(0, 1.01, 0.25).map((t) => colour(minCount + t * (maxCount - minCount))).join(', ');
      div.innerHTML = `<strong>Largest group's count</strong>
        <div class="q3-legend-bar" style="background: linear-gradient(to right, ${stops})"></div>
        <div class="q3-legend-ends"><span>${formatCount(minCount)}</span><span>${formatCount(maxCount)}</span></div>`;
      return div;
    };
    legend.addTo(map);

    const yearLabel = root.querySelector('#q3-year-label');
    const slider = root.querySelector('#q3-year-slider');
    const playButton = root.querySelector('#q3-play');

    const draw = (year) => {
      layer.clearLayers();
      data.filter((row) => row.year === year).forEach((row) => {
        const position = COORDS[row.group];
        if (!position) { return; }              // unknown jurisdiction name
        const tip = `<strong>${row.group}</strong><br>${year}: ${formatCount(row.count)} hospitalised
          <br>Largest group: ${label(row.user)}${Number.isFinite(row.share) ? ` (${pct(row.share)} of total)` : ''}`;
        L.circleMarker(position, {
          radius: 8 + 38 * Math.sqrt(row.count / maxCount),
          color: '#222',
          weight: 1,
          fillColor: colour(row.count),
          fillOpacity: 0.85
        }).bindTooltip(tip).addTo(layer);
      });
      yearLabel.textContent = year;
    };

    slider.addEventListener('input', () => draw(years[+slider.value]));

    let timer = null;
    const stop = () => { clearInterval(timer); timer = null; playButton.textContent = 'Play'; };
    playButton.addEventListener('click', () => {
      if (timer) { stop(); return; }
      playButton.textContent = 'Pause';
      timer = setInterval(() => {
        slider.value = (+slider.value + 1) % years.length;
        draw(years[+slider.value]);
      }, 900);
    });

    draw(years[+slider.value]);
  };

  const init = async () => {
    const root = document.getElementById(TARGET_ID);
    if (!root) { return; }
    try {
      const [rows] = await Promise.all([d3.csv(DATA_URL), loadLeaflet()]);
      const data = parseRows(rows);
      if (!data.length) { throw new Error('No usable rows found in data/q3_map.csv.'); }
      render(root, data);
    } catch (error) {
      root.innerHTML = `<p class="q3-error">Could not draw the Question 3 map. ${error.message}</p>`;
    }
  };

  init();
})();
