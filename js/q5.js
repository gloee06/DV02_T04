// Question 5: multi-series line chart of hospitalised injuries by counterparty
// (what the road user collided with), per jurisdiction, 2011-2021.
// Data: data/q5_counterparty.csv  (columns: Jurisdiction, Calendar_year, Counterparty, Value)
(() => {
  const CHART_ID = 'q5-chart';
  const CONTROLS_ID = 'q5-controls';
  const SUMMARY_ID = 'q5-summary';
  const DATA_URL = 'data/q5_hospital_bed_days.csv';

  const formatCount = d3.format(',');
  const colour = d3.scaleOrdinal().range(['#315e42', '#d39c54', '#4f6f9a', '#a8664d']);

  // Draws the chart for ONE jurisdiction's rows into the element with targetElementId.
  function renderQ5Chart(data, targetElementId) {
    const root = d3.select(`#${targetElementId}`);
    root.html('');

    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const series = d3.groups(data, (d) => d.Counterparty);
    colour.domain(series.map(([name]) => name));

    // legend (HTML, above the chart)
    const legend = root.append('div').attr('class', 'q5-legend');
    series.forEach(([name]) => {
      const item = legend.append('span').attr('class', 'q5-legend-item');
      item.append('span').attr('class', 'q5-swatch').style('background', colour(name));
      item.append('span').text(name);
    });

    const svg = root.append('svg')
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('role', 'img')
      .attr('aria-label', 'Line chart of hospitalised injuries by counterparty, 2011 to 2021');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale: calendar year (2011 to 2021)
    const x = d3.scaleLinear().domain([2011, 2021]).range([0, width]);
    // Y scale: fits the selected jurisdiction so small jurisdictions stay readable
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => +d.Value) || 1]).nice()
      .range([height, 0]);

    g.append('g').attr('class', 'q5-grid')
      .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(''));
    g.append('g').attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(d3.range(2011, 2022)).tickFormat(d3.format('d')));
    g.append('g').call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(',')));

    g.append('text').attr('class', 'q5-axis-label')
      .attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -margin.left + 16)
      .attr('text-anchor', 'middle').text('Hospitalised injuries (count)');
    g.append('text').attr('class', 'q5-axis-label')
      .attr('x', width / 2).attr('y', height + 40)
      .attr('text-anchor', 'middle').text('Calendar year');

    // Line generator (gaps where a value is unavailable)
    const valueline = d3.line()
      .defined((d) => Number.isFinite(+d.Value))
      .x((d) => x(+d.Calendar_year))
      .y((d) => y(+d.Value));

    series.forEach(([name, values]) => {
      const sorted = values.slice().sort((a, b) => a.Calendar_year - b.Calendar_year);
      g.append('path').datum(sorted)
        .attr('fill', 'none').attr('stroke', colour(name)).attr('stroke-width', 2.5)
        .attr('d', valueline);
      g.selectAll(null).data(sorted.filter((d) => Number.isFinite(+d.Value))).join('circle')
        .attr('cx', (d) => x(+d.Calendar_year)).attr('cy', (d) => y(+d.Value))
        .attr('r', 3.5).attr('fill', colour(name));
    });

    // hover: show all series for the nearest year
    const tooltip = root.append('div').attr('class', 'q5-tooltip').style('opacity', 0);
    const guide = g.append('line').attr('class', 'q5-guide')
      .attr('y1', 0).attr('y2', height).style('opacity', 0);

    g.append('rect').attr('width', width).attr('height', height).attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', (event) => {
        const [px] = d3.pointer(event);
        const year = Math.max(2011, Math.min(2021, Math.round(x.invert(px))));
        const rows = series.map(([name, values]) => [name, values.find((d) => +d.Calendar_year === year)]);
        tooltip.html(`<strong>${year}</strong>` + rows.map(([name, d]) =>
          `<br><span class="q5-swatch" style="background:${colour(name)}"></span>${name}: ${
            d && Number.isFinite(+d.Value) ? formatCount(+d.Value) : 'n.p.'}`).join(''))
          .style('opacity', 1)
          .style('left', `${Math.min(event.offsetX + 16, 560)}px`)
          .style('top', `${event.offsetY + 10}px`);
        guide.attr('x1', x(year)).attr('x2', x(year)).style('opacity', 1);
      })
      .on('mouseleave', () => { tooltip.style('opacity', 0); guide.style('opacity', 0); });
  }

  const summarise = (rows, jurisdiction) => {
    const top = (year) => d3.greatest(rows.filter((d) => +d.Calendar_year === year && Number.isFinite(+d.Value)), (d) => +d.Value);
    const a = top(2011);
    const b = top(2021);
    if (!a || !b) { return ''; }
    if (a.Counterparty === b.Counterparty) {
      return `In ${jurisdiction}, “${a.Counterparty}” was the largest counterparty in both 2011 (${formatCount(+a.Value)}) and 2021 (${formatCount(+b.Value)}).`;
    }
    return `In ${jurisdiction}, “${a.Counterparty}” was the largest counterparty in 2011 (${formatCount(+a.Value)}), and “${b.Counterparty}” in 2021 (${formatCount(+b.Value)}).`;
  };

  const init = async () => {
    const chart = document.getElementById(CHART_ID);
    const controls = document.getElementById(CONTROLS_ID);
    const summary = document.getElementById(SUMMARY_ID);
    if (!chart) { return; }
    try {
      const rows = await d3.csv(DATA_URL);
      if (!rows.length) { throw new Error('No rows found in data/q5_counterparty.csv.'); }
      rows.forEach((d) => { d.Calendar_year = +d.Calendar_year; d.Value = d.Value === '' ? NaN : +d.Value; });

      const jurisdictions = [...new Set(rows.map((d) => d.Jurisdiction))];
      const update = (name) => {
        const subset = rows.filter((d) => d.Jurisdiction === name);
        renderQ5Chart(subset, CHART_ID);
        if (summary) { summary.textContent = summarise(subset, name); }
      };

      if (controls) {
        controls.innerHTML = `<label for="q5-jurisdiction">Choose a jurisdiction</label>
          <select id="q5-jurisdiction">${jurisdictions.map((j) => `<option>${j}</option>`).join('')}</select>`;
        controls.querySelector('select').addEventListener('change', (e) => update(e.target.value));
      }
      update(jurisdictions[0]);
    } catch (error) {
      chart.innerHTML = `<p class="q5-error">Could not draw the Question 5 chart. ${error.message}</p>`;
    }
  };

  window.renderQ5Chart = renderQ5Chart;
  init();
})();
