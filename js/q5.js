// Question 5: How did total bed-days and average bed-days per hospitalised case
// change across jurisdictions from 2011 to 2021?
// Multi-series line chart (one line per jurisdiction) with a measure switch, plus a 2011 vs 2021 table.
// Data: data/q5_bed_days.csv  (columns: Jurisdiction, Calendar_year, Cases, BedDays, AvgBedDays)
(() => {
  const CHART_ID = 'q5-chart';
  const CONTROLS_ID = 'q5-controls';
  const SUMMARY_ID = 'q5-summary';
  const TABLE_ID = 'q5-table';
  const DATA_URL = 'data/q5_bed_days.csv';

  // Built-in copy of data/q5_bed_days.csv (used if the CSV file cannot be loaded).
  // Each row: [Jurisdiction, Calendar_year, Cases, BedDays, AvgBedDays]
  const EMBEDDED = [["New South Wales",2011,10618,50344,4.74],["New South Wales",2012,11121,49958,4.49],["New South Wales",2013,11421,47039,4.12],["New South Wales",2014,11313,46040,4.07],["New South Wales",2015,11084,54331,4.9],["New South Wales",2016,11474,60349,5.26],["New South Wales",2017,11016,59514,5.4],["New South Wales",2018,9794,59524,6.08],["New South Wales",2019,9942,62998,6.34],["New South Wales",2020,9274,58371,6.29],["New South Wales",2021,9003,55098,6.12],["Victoria",2011,9326,33924,3.64],["Victoria",2012,8098,30245,3.73],["Victoria",2013,7784,29066,3.73],["Victoria",2014,8523,29025,3.41],["Victoria",2015,9198,50072,5.44],["Victoria",2016,10360,67778,6.54],["Victoria",2017,10794,64054,5.93],["Victoria",2018,11453,63844,5.57],["Victoria",2019,11392,61009,5.36],["Victoria",2020,9884,47937,4.85],["Victoria",2021,11130,54699,4.91],["Queensland",2011,6322,28533,4.51],["Queensland",2012,6813,30414,4.46],["Queensland",2013,7821,29019,3.71],["Queensland",2014,7725,29016,3.76],["Queensland",2015,8306,34270,4.13],["Queensland",2016,8702,39817,4.58],["Queensland",2017,9134,39864,4.36],["Queensland",2018,9381,38839,4.14],["Queensland",2019,9515,40189,4.22],["Queensland",2020,9801,37850,3.86],["Queensland",2021,10447,40889,3.91],["Western Australia",2011,3442,18485,5.37],["Western Australia",2012,3493,17899,5.12],["Western Australia",2013,3475,17226,4.96],["Western Australia",2014,3154,16589,5.26],["Western Australia",2015,3183,18445,5.79],["Western Australia",2016,3031,21902,7.23],["Western Australia",2017,3195,19160,6.0],["Western Australia",2018,3274,15080,4.61],["Western Australia",2019,3534,17822,5.04],["Western Australia",2020,3636,18788,5.17],["Western Australia",2021,3568,22288,6.25],["South Australia",2011,2359,12032,5.1],["South Australia",2012,2311,12433,5.38],["South Australia",2013,2221,11571,5.21],["South Australia",2014,2381,11196,4.7],["South Australia",2015,2467,11167,4.53],["South Australia",2016,2654,13195,4.97],["South Australia",2017,2394,13779,5.76],["South Australia",2018,2489,12658,5.09],["South Australia",2019,2457,10803,4.4],["South Australia",2020,2503,12180,4.87],["South Australia",2021,2632,11852,4.5],["Tasmania",2011,493,3106,6.3],["Tasmania",2012,536,2848,5.31],["Tasmania",2013,570,2891,5.07],["Tasmania",2014,646,2869,4.44],["Tasmania",2015,677,3443,5.09],["Tasmania",2016,657,3964,6.03],["Tasmania",2017,659,4310,6.54],["Tasmania",2018,781,4676,5.99],["Tasmania",2019,708,4080,5.76],["Tasmania",2020,778,3482,4.48],["Tasmania",2021,805,4860,6.04],["Australian Capital Territory",2011,537,2576,4.8],["Australian Capital Territory",2012,601,2266,3.77],["Australian Capital Territory",2013,573,2517,4.39],["Australian Capital Territory",2014,542,2026,3.74],["Australian Capital Territory",2015,700,2896,4.14],["Australian Capital Territory",2016,654,2672,4.09],["Australian Capital Territory",2017,632,2609,4.13],["Australian Capital Territory",2018,712,2984,4.19],["Australian Capital Territory",2019,665,2804,4.22],["Australian Capital Territory",2020,629,2537,4.03],["Australian Capital Territory",2021,740,2739,3.7],["Northern Territory",2011,456,3010,6.6],["Northern Territory",2012,496,2955,5.96],["Northern Territory",2013,561,3661,6.53],["Northern Territory",2014,575,2967,5.16],["Northern Territory",2015,691,3461,5.01],["Northern Territory",2016,709,3793,5.35],["Northern Territory",2017,703,3997,5.69],["Northern Territory",2018,832,5278,6.34],["Northern Territory",2019,656,3809,5.81],["Northern Territory",2020,787,3467,4.41],["Northern Territory",2021,710,4073,5.74]];

  const embeddedRows = () => EMBEDDED.map(([Jurisdiction, Calendar_year, Cases, BedDays, AvgBedDays]) =>
    ({ Jurisdiction, Calendar_year, Cases, BedDays, AvgBedDays }));

  const METRICS = {
    total: { key: 'BedDays', label: 'Total bed-days', axis: 'Total bed-days', format: d3.format(',') },
    average: { key: 'AvgBedDays', label: 'Average bed-days per case', axis: 'Average bed-days per hospitalised case', format: d3.format('.2f') }
  };

  const formatPct = d3.format('+.1%');
  const formatDiff = d3.format('+.2f');
  const PALETTE = ['#315e42', '#d39c54', '#4f6f9a', '#a8664d', '#7a5c8f', '#2f8f9d', '#8a8f3a', '#c25b7a'];

  // Draws the multi-series line chart for the chosen measure into #targetElementId.
  function renderQ5Chart(data, targetElementId, metricKey, visible, colour) {
    const metric = METRICS[metricKey];
    const root = d3.select(`#${targetElementId}`);
    root.html('');

    const margin = { top: 20, right: 30, bottom: 50, left: 75 };
    const width = 800 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const shown = data.filter((d) => visible.has(d.Jurisdiction));
    const series = d3.groups(shown, (d) => d.Jurisdiction);

    const svg = root.append('svg')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('role', 'img')
      .attr('aria-label', `Line chart of ${metric.label.toLowerCase()} by jurisdiction, 2011 to 2021`);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale: calendar year (2011 to 2021)
    const x = d3.scaleLinear().domain([2011, 2021]).range([0, width]);
    // Y scale: starts at zero and fits the lines that are switched on
    const y = d3.scaleLinear()
      .domain([0, d3.max(shown, (d) => +d[metric.key]) || 1]).nice()
      .range([height, 0]);

    g.append('g').attr('class', 'q5-grid').call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(''));
    g.append('g').attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(d3.range(2011, 2022)).tickFormat(d3.format('d')));
    g.append('g').call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(',')));

    g.append('text').attr('class', 'q5-axis-label')
      .attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -margin.left + 18)
      .attr('text-anchor', 'middle').text(metric.axis);
    g.append('text').attr('class', 'q5-axis-label')
      .attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle').text('Calendar year');

    // Line generator
    const valueline = d3.line()
      .x((d) => x(+d.Calendar_year))
      .y((d) => y(+d[metric.key]));

    series.forEach(([name, values]) => {
      const sorted = values.slice().sort((a, b) => a.Calendar_year - b.Calendar_year);
      g.append('path').datum(sorted)
        .attr('fill', 'none').attr('stroke', colour(name)).attr('stroke-width', 2.5).attr('d', valueline);
      g.selectAll(null).data(sorted).join('circle')
        .attr('cx', (d) => x(+d.Calendar_year)).attr('cy', (d) => y(+d[metric.key]))
        .attr('r', 3).attr('fill', colour(name));
    });

    // hover: list every visible jurisdiction for the nearest year
    const tooltip = root.append('div').attr('class', 'q5-tooltip').style('opacity', 0);
    const guide = g.append('line').attr('class', 'q5-guide').attr('y1', 0).attr('y2', height).style('opacity', 0);

    g.append('rect').attr('width', width).attr('height', height).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', (event) => {
        const [px] = d3.pointer(event);
        const year = Math.max(2011, Math.min(2021, Math.round(x.invert(px))));
        const rows = series
          .map(([name, values]) => [name, values.find((d) => +d.Calendar_year === year)])
          .filter(([, d]) => d)
          .sort((a, b) => +b[1][metric.key] - +a[1][metric.key]);
        tooltip.html(`<strong>${year}</strong> · ${metric.label}` + rows.map(([name, d]) =>
          `<br><span class="q5-swatch" style="background:${colour(name)}"></span>${name}: ${metric.format(+d[metric.key])}`).join(''))
          .style('opacity', 1)
          .style('left', `${Math.min(event.offsetX + 16, 520)}px`)
          .style('top', `${event.offsetY + 10}px`);
        guide.attr('x1', x(year)).attr('x2', x(year)).style('opacity', 1);
      })
      .on('mouseleave', () => { tooltip.style('opacity', 0); guide.style('opacity', 0); });
  }

  // Change between 2011 and 2021 for every jurisdiction
  const changes = (rows) => {
    const names = [...new Set(rows.map((d) => d.Jurisdiction))];
    return names.map((name) => {
      const a = rows.find((d) => d.Jurisdiction === name && +d.Calendar_year === 2011);
      const b = rows.find((d) => d.Jurisdiction === name && +d.Calendar_year === 2021);
      return { name, a, b };
    }).filter((c) => c.a && c.b);
  };

  const summarise = (rows, metricKey) => {
    const metric = METRICS[metricKey];
    const list = changes(rows).map((c) => ({ ...c, pct: c.b[metric.key] / c.a[metric.key] - 1 }));
    if (!list.length) { return ''; }
    const top = d3.greatest(list, (c) => c.pct);
    const bottom = d3.least(list, (c) => c.pct);
    const rose = list.filter((c) => c.pct > 0).length;
    const lead = `${metric.label}: between 2011 and 2021 it rose in ${rose} of ${list.length} jurisdictions. The largest increase was in ${top.name} (${formatPct(top.pct)}); `;
    return bottom.pct < 0
      ? `${lead}the largest fall was in ${bottom.name} (${formatPct(bottom.pct)}).`
      : `${lead}the smallest increase was in ${bottom.name} (${formatPct(bottom.pct)}).`;
  };

  const buildTable = (rows) => {
    const body = changes(rows).map(({ name, a, b }) => `<tr>
        <th scope="row">${name}</th>
        <td class="q5-num">${d3.format(',')(a.BedDays)}</td>
        <td class="q5-num">${d3.format(',')(b.BedDays)}</td>
        <td class="q5-num">${formatPct(b.BedDays / a.BedDays - 1)}</td>
        <td class="q5-num">${a.AvgBedDays.toFixed(2)}</td>
        <td class="q5-num">${b.AvgBedDays.toFixed(2)}</td>
        <td class="q5-num">${formatDiff(b.AvgBedDays - a.AvgBedDays)}</td>
      </tr>`).join('');
    return `<table class="q5-table">
      <caption>Bed-days in 2011 and 2021 by jurisdiction.</caption>
      <thead><tr>
        <th scope="col">Jurisdiction</th>
        <th scope="col">Total 2011</th><th scope="col">Total 2021</th><th scope="col">Total change</th>
        <th scope="col">Avg per case 2011</th><th scope="col">Avg per case 2021</th><th scope="col">Avg change (days)</th>
      </tr></thead><tbody>${body}</tbody></table>`;
  };

  const init = async () => {
    const chart = document.getElementById(CHART_ID);
    const controls = document.getElementById(CONTROLS_ID);
    const summary = document.getElementById(SUMMARY_ID);
    if (!chart) { return; }

    let tableHost = document.getElementById(TABLE_ID);
    if (!tableHost) {
      tableHost = document.createElement('div');
      tableHost.id = TABLE_ID;
      chart.insertAdjacentElement('afterend', tableHost);
    }

    try {
      let rows;
      try { rows = await d3.csv(DATA_URL); } catch (loadError) { rows = embeddedRows(); }
      rows = rows.map((d) => ({
        Jurisdiction: String(d.Jurisdiction).trim(),
        Calendar_year: +d.Calendar_year,
        Cases: +d.Cases,
        BedDays: +d.BedDays,
        AvgBedDays: +d.AvgBedDays
      })).filter((d) => d.Jurisdiction && Number.isFinite(d.BedDays));
      if (!rows.length) { throw new Error('No usable rows found in data/q5_bed_days.csv.'); }

      const jurisdictions = [...new Set(rows.map((d) => d.Jurisdiction))];
      const colour = d3.scaleOrdinal().domain(jurisdictions).range(PALETTE);
      const visible = new Set(jurisdictions);
      let metricKey = 'total';

      const update = () => {
        renderQ5Chart(rows, CHART_ID, metricKey, visible, colour);
        if (summary) { summary.textContent = summarise(rows, metricKey); }
      };

      if (controls) {
        controls.innerHTML = `
          <fieldset class="q5-metric" aria-label="Choose a measure">
            <label><input type="radio" name="q5-metric" value="total" checked> ${METRICS.total.label}</label>
            <label><input type="radio" name="q5-metric" value="average"> ${METRICS.average.label}</label>
          </fieldset>
          <div class="q5-filters" role="group" aria-label="Select jurisdictions to show">
            ${jurisdictions.map((j) => `<label class="q5-filter"><input type="checkbox" value="${j}" checked>
              <span class="q5-swatch" style="background:${colour(j)}"></span>${j}</label>`).join('')}
          </div>`;
        controls.querySelectorAll('input[name="q5-metric"]').forEach((input) =>
          input.addEventListener('change', () => { metricKey = input.value; update(); }));
        controls.querySelectorAll('.q5-filter input').forEach((input) =>
          input.addEventListener('change', () => {
            if (input.checked) { visible.add(input.value); } else { visible.delete(input.value); }
            update();
          }));
      }

      tableHost.innerHTML = `<div class="q5-table-wrap">${buildTable(rows)}</div>`;
      update();
    } catch (error) {
      chart.innerHTML = `<p class="q5-error">Could not draw the Question 5 chart. ${error.message}</p>`;
    }
  };

  window.renderQ5Chart = renderQ5Chart;
  init();
})();