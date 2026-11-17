(() => {
  const ageGroups = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+"];
  const jurisdictions = ["ACT", "NSW", "NT", "Qld", "SA", "Tas", "Vic", "WA"];
  const years = d3.range(2011, 2022);
  const yearStart = 2011;
  const yearEnd = 2021;
  const numberFormat = d3.format(",d");
  const colors = { start: "#286b62", end: "#cf704b", line: "#bec9bf" };

  const section = d3.select("#question-4");
  if (section.empty()) return;

  const selector = d3.select("#q4-jurisdiction");
  const heatmapHost = d3.select("#q4-heatmap");
  const dumbbellHost = d3.select("#q4-dumbbell");
  const summary = d3.select("#q4-change-summary");
  const dataNote = d3.select("#q4-data-note");
  const status = d3.select("#q4-status");
  const heatTooltip = d3.select("#q4-heatmap-tooltip");
  const dumbbellTooltip = d3.select("#q4-dumbbell-tooltip");

  function showTooltip(tooltip, event, text, host) {
    tooltip.text(text).classed("is-visible", true);
    if (event && event.type.startsWith("mouse")) {
      const bounds = host.node().getBoundingClientRect();
      tooltip
        .style("left", `${event.clientX - bounds.left + 12}px`)
        .style("top", `${event.clientY - bounds.top + 12}px`);
    } else {
      tooltip.style("left", "14px").style("top", "12px");
    }
  }

  function hideTooltip(tooltip) {
    tooltip.classed("is-visible", false);
  }

  function caseDescription(d, jurisdiction) {
    if (d.cases == null) {
      return `${jurisdiction}, ${d.ageGroup}, ${d.year}: not published; ${d.missingPeriods} of 2 half-year values unavailable.`;
    }
    return `${jurisdiction}, ${d.ageGroup}, ${d.year}: ${numberFormat(d.cases)} hospitalised cases.`;
  }

  function formatSigned(value) {
    if (value > 0) return `+${numberFormat(value)}`;
    if (value < 0) return `−${numberFormat(Math.abs(value))}`;
    return "0";
  }

  function drawHeatmap(data, jurisdiction, maximum) {
    const width = 1020;
    const height = 424;
    const margin = { top: 43, right: 175, bottom: 62, left: 116 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const x = d3.scaleBand().domain(years).range([margin.left, width - margin.right]).paddingInner(0.06);
    const y = d3.scaleBand().domain(ageGroups).range([margin.top, height - margin.bottom]).paddingInner(0.08);
    const color = d3.scaleSequentialSqrt(d3.interpolateYlGnBu).domain([0, maximum || 1]);
    const svg = heatmapHost.html("").append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `Heatmap of annual hospitalised injury counts by age group and year in ${jurisdiction}, 2011 to 2021. Shaded cells show counts. Hatched cells indicate unpublished data.`);

    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "q4-unpublished-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 9)
      .attr("height", 9)
      .attr("patternTransform", "rotate(45)");
    pattern.append("rect").attr("width", 9).attr("height", 9).attr("fill", "#eef0ec");
    pattern.append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 9).attr("stroke", "#a3ada5").attr("stroke-width", 2);

    const gradient = defs.append("linearGradient").attr("id", "q4-heat-gradient");
    d3.range(0, 1.001, 0.1).forEach(t => {
      gradient.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", color(maximum * t));
    });

    const xAxis = d3.axisBottom(x).tickSize(0).tickPadding(10).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(y).tickSize(0).tickPadding(10);
    svg.append("g").attr("class", "q4-axis q4-axis-x")
      .attr("transform", `translate(0,${height - margin.bottom})`).call(xAxis);
    svg.append("g").attr("class", "q4-axis q4-axis-y")
      .attr("transform", `translate(${margin.left},0)`).call(yAxis);
    svg.selectAll(".q4-axis .domain").remove();
    svg.append("text").attr("class", "q4-axis-title")
      .attr("x", margin.left + plotWidth / 2).attr("y", height - 13)
      .attr("text-anchor", "middle").text("Calendar year");
    svg.append("text").attr("class", "q4-axis-title")
      .attr("transform", `translate(23,${margin.top + plotHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle").text("Age group");

    const cells = svg.append("g").attr("class", "q4-heat-cells")
      .selectAll("g")
      .data(data, d => `${d.year}-${d.ageGroup}`)
      .join("g")
      .attr("class", "q4-heat-cell")
      .attr("transform", d => `translate(${x(d.year)},${y(d.ageGroup)})`)
      .attr("tabindex", 0)
      .attr("role", "img")
      .attr("aria-label", d => caseDescription(d, jurisdiction))
      .on("mouseenter mousemove", (event, d) => showTooltip(heatTooltip, event, caseDescription(d, jurisdiction), heatmapHost))
      .on("mouseleave blur", () => hideTooltip(heatTooltip))
      .on("focus", (event, d) => showTooltip(heatTooltip, event, caseDescription(d, jurisdiction), heatmapHost));

    cells.append("rect")
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 3)
      .attr("fill", d => d.cases == null ? "url(#q4-unpublished-pattern)" : color(d.cases));

    cells.append("text")
      .attr("class", "q4-cell-label")
      .attr("x", x.bandwidth() / 2)
      .attr("y", y.bandwidth() / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("fill", d => {
        if (d.cases == null) return "#53635b";
        const c = d3.color(color(d.cases));
        const luminance = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
        return luminance < 145 ? "#fff" : "#1f332d";
      })
      .text(d => d.cases == null ? "n.p." : numberFormat(d.cases));

    svg.append("rect").attr("x", width - 150).attr("y", 70).attr("width", 112).attr("height", 12)
      .attr("rx", 6).attr("fill", "url(#q4-heat-gradient)");
    svg.append("text").attr("class", "q4-legend-label").attr("x", width - 150).attr("y", 58).text("Annual cases");
    svg.append("text").attr("class", "q4-legend-tick").attr("x", width - 150).attr("y", 101).text("0");
    svg.append("text").attr("class", "q4-legend-tick").attr("x", width - 38).attr("y", 101)
      .attr("text-anchor", "end").text(numberFormat(maximum));
    svg.append("rect").attr("x", width - 150).attr("y", 129).attr("width", 18).attr("height", 18)
      .attr("rx", 2).attr("fill", "url(#q4-unpublished-pattern)").attr("stroke", "#c9d0c9");
    svg.append("text").attr("class", "q4-legend-label").attr("x", width - 124).attr("y", 143).text("Not published");
  }

  function drawDumbbell(data, jurisdiction, maximum) {
    const width = 1020;
    const height = 416;
    const margin = { top: 54, right: 332, bottom: 60, left: 116 };
    const plotRight = width - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const x = d3.scaleLinear().domain([0, maximum || 1]).nice(5).range([margin.left, plotRight]);
    const y = d3.scaleBand().domain(ageGroups).range([margin.top, height - margin.bottom]).padding(0.35);
    const byAgeYear = new Map(data.map(d => [`${d.ageGroup}-${d.year}`, d]));
    const pairs = ageGroups.map(ageGroup => {
      const start = byAgeYear.get(`${ageGroup}-${yearStart}`);
      const end = byAgeYear.get(`${ageGroup}-${yearEnd}`);
      const comparable = start?.cases != null && end?.cases != null;
      return {
        ageGroup,
        start,
        end,
        comparable,
        change: comparable ? end.cases - start.cases : null
      };
    });
    const comparablePairs = pairs.filter(d => d.comparable);
    const largest = comparablePairs.length
      ? comparablePairs.reduce((best, d) => Math.abs(d.change) > Math.abs(best.change) ? d : best)
      : null;
    const svg = dumbbellHost.html("").append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `Dumbbell chart comparing 2011 and 2021 annual counts by age group in ${jurisdiction}. Unpublished endpoint values are labelled n.p.`);

    svg.append("g").attr("class", "q4-grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-plotHeight).tickFormat(""));
    svg.append("g").attr("class", "q4-axis q4-axis-x")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(10).tickFormat(d3.format(",d")));
    svg.append("g").attr("class", "q4-axis q4-axis-y")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10));
    svg.selectAll(".q4-axis .domain").remove();
    svg.selectAll(".q4-grid .domain").remove();
    svg.append("text").attr("class", "q4-axis-title")
      .attr("x", (margin.left + plotRight) / 2).attr("y", height - 13)
      .attr("text-anchor", "middle").text("Hospitalised cases");

    const startX = plotRight + 24;
    const endX = plotRight + 105;
    const changeX = plotRight + 194;
    svg.append("text").attr("class", "q4-table-head").attr("x", startX).attr("y", 28).text("2011");
    svg.append("text").attr("class", "q4-table-head").attr("x", endX).attr("y", 28).text("2021");
    svg.append("text").attr("class", "q4-table-head").attr("x", changeX).attr("y", 28).text("CHANGE");

    const rows = svg.append("g").selectAll("g")
      .data(pairs, d => d.ageGroup)
      .join("g")
      .attr("class", d => `q4-dumbbell-row${d === largest ? " is-largest" : ""}`)
      .attr("transform", d => `translate(0,${y(d.ageGroup) + y.bandwidth() / 2})`);

    rows.filter(d => d.comparable).append("line")
      .attr("class", "q4-dumbbell-connector")
      .attr("x1", d => x(d.start.cases)).attr("x2", d => x(d.end.cases))
      .attr("y1", 0).attr("y2", 0);

    rows.filter(d => d.start?.cases != null).append("circle")
      .attr("class", "q4-dumbbell-dot q4-dumbbell-dot-start")
      .attr("cx", d => x(d.start.cases)).attr("r", 7)
      .attr("tabindex", 0).attr("role", "img")
      .attr("aria-label", d => `${jurisdiction}, ${d.ageGroup}, 2011: ${numberFormat(d.start.cases)} cases`)
      .on("mouseenter mousemove", (event, d) => showTooltip(dumbbellTooltip, event, `${jurisdiction} · ${d.ageGroup} · 2011: ${numberFormat(d.start.cases)} cases`, dumbbellHost))
      .on("mouseleave blur", () => hideTooltip(dumbbellTooltip))
      .on("focus", (event, d) => showTooltip(dumbbellTooltip, event, `${jurisdiction} · ${d.ageGroup} · 2011: ${numberFormat(d.start.cases)} cases`, dumbbellHost));

    rows.filter(d => d.end?.cases != null).append("circle")
      .attr("class", "q4-dumbbell-dot q4-dumbbell-dot-end")
      .attr("cx", d => x(d.end.cases)).attr("r", 7)
      .attr("tabindex", 0).attr("role", "img")
      .attr("aria-label", d => `${jurisdiction}, ${d.ageGroup}, 2021: ${numberFormat(d.end.cases)} cases`)
      .on("mouseenter mousemove", (event, d) => showTooltip(dumbbellTooltip, event, `${jurisdiction} · ${d.ageGroup} · 2021: ${numberFormat(d.end.cases)} cases`, dumbbellHost))
      .on("mouseleave blur", () => hideTooltip(dumbbellTooltip))
      .on("focus", (event, d) => showTooltip(dumbbellTooltip, event, `${jurisdiction} · ${d.ageGroup} · 2021: ${numberFormat(d.end.cases)} cases`, dumbbellHost));

    rows.append("text").attr("class", "q4-dumbbell-value")
      .attr("x", startX).attr("y", 4).text(d => d.start?.cases == null ? "n.p." : numberFormat(d.start.cases));
    rows.append("text").attr("class", "q4-dumbbell-value")
      .attr("x", endX).attr("y", 4).text(d => d.end?.cases == null ? "n.p." : numberFormat(d.end.cases));
    rows.append("text")
      .attr("class", d => `q4-dumbbell-change${d === largest ? " is-largest" : ""}`)
      .attr("x", changeX).attr("y", 4)
      .text(d => d.comparable ? formatSigned(d.change) : "n.p.");

    return { largest, comparableCount: comparablePairs.length };
  }

  function render(data, jurisdiction, globalMaximum) {
    const selected = data.filter(d => d.jurisdiction === jurisdiction);
    const observed = selected.filter(d => d.cases != null);
    const incomplete = selected.filter(d => d.cases == null);
    const selectedMaximum = d3.max(observed, d => d.cases) || 1;

    dataNote.text(`${observed.length} of ${selected.length} annual age-group records are complete for ${jurisdiction}. Hatched cells are not published and are left out of the 2011–2021 change comparison.`);
    drawHeatmap(selected, jurisdiction, globalMaximum);
    const result = drawDumbbell(selected, jurisdiction, selectedMaximum);

    if (!result.largest) {
      summary.text(`No age group has complete values in both ${yearStart} and ${yearEnd} for ${jurisdiction}.`);
    } else {
      const direction = result.largest.change > 0 ? "increase" : result.largest.change < 0 ? "decrease" : "no change";
      summary.html("")
        .append("span").attr("class", "q4-summary-label").text("Largest absolute change")
        .node();
      summary.append("strong").text(`${result.largest.ageGroup}: ${formatSigned(result.largest.change)} cases`);
      summary.append("span").text(`${direction} from 2011 to 2021 among ${result.comparableCount} comparable age groups.`);
    }
    status.text(`${incomplete.length} of ${selected.length} annual values are unavailable for ${jurisdiction}. The chart marks them as n.p., not zero.`);
  }

  async function init() {
    try {
      const data = await d3.csv("data/q4_age_jurisdiction_annual.csv", d => {
        const caseText = (d.annual_cases ?? "").trim();
        const cases = caseText === "" ? null : Number(caseText);
        return {
          year: Number(d.year),
          ageGroup: (d.age_group ?? "").trim(),
          jurisdiction: (d.jurisdiction ?? "").trim(),
          cases,
          missingPeriods: Number(d.missing_periods),
          status: (d.data_status ?? "").trim()
        };
      });

      const valid = data.length === 616 && data.every(d =>
        years.includes(d.year) && ageGroups.includes(d.ageGroup) &&
        jurisdictions.includes(d.jurisdiction) &&
        Number.isInteger(d.missingPeriods) && d.missingPeriods >= 0 && d.missingPeriods <= 2 &&
        ((d.status === "complete" && d.missingPeriods === 0 && Number.isFinite(d.cases)) ||
          (d.status === "incomplete" && d.missingPeriods > 0 && d.cases == null))
      );
      if (!valid) throw new Error("The Q4 CSV does not match the expected schema or missing-data rules.");

      const globalMaximum = d3.max(data, d => d.cases ?? 0) || 1;
      selector.selectAll("option")
        .data(jurisdictions)
        .join("option")
        .attr("value", d => d)
        .text(d => d);
      selector.property("value", "NSW");
      selector.on("change", function () { render(data, this.value, globalMaximum); });
      render(data, selector.property("value"), globalMaximum);
    } catch (error) {
      console.error("Q4 chart error:", error);
      heatmapHost.text("Unable to load the Q4 age-group data. Check that data/q4_age_jurisdiction_annual.csv is available.");
      dumbbellHost.text("The 2011–2021 comparison could not be drawn.");
      status.text(error.message || "Unable to load the Q4 data.");
      status.classed("is-error", true);
    }
  }

  init();
})();
