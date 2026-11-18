(() => {
  const ageGroups = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+"];
  const jurisdictions = ["ACT", "NSW", "NT", "Qld", "SA", "Tas", "Vic", "WA"];
  const yearStart = 2011;
  const yearEnd = 2021;
  const numberFormat = d3.format(",d");
  const startColor = "#286b62";
  const endColor = "#cf704b";
  const section = d3.select("#question-4");
  if (section.empty()) return;

  const selector = d3.select("#q4-jurisdiction");
  const chartHost = d3.select("#q4-dumbbell");
  const tooltip = d3.select("#q4-dumbbell-tooltip");
  const summary = d3.select("#q4-change-summary");
  const status = d3.select("#q4-status");

  function formatSigned(value) {
    if (value > 0) return `+${numberFormat(value)}`;
    if (value < 0) return `−${numberFormat(Math.abs(value))}`;
    return "0";
  }

  function showTooltip(event, text) {
    tooltip.text(text).classed("is-visible", true);
    if (event.type.startsWith("mouse")) {
      const bounds = chartHost.node().getBoundingClientRect();
      tooltip.style("left", `${event.clientX - bounds.left + 12}px`)
        .style("top", `${event.clientY - bounds.top + 12}px`);
    } else {
      tooltip.style("left", "14px").style("top", "12px");
    }
  }

  function drawChart(data, jurisdiction) {
    const width = 900;
    const height = 390;
    const margin = { top: 48, right: 145, bottom: 54, left: 112 };
    const plotRight = width - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const byAgeYear = new Map(data.map(d => [`${d.ageGroup}-${d.year}`, d]));
    const pairs = ageGroups.map(ageGroup => {
      const start = byAgeYear.get(`${ageGroup}-${yearStart}`);
      const end = byAgeYear.get(`${ageGroup}-${yearEnd}`);
      const comparable = start?.cases != null && end?.cases != null;
      return { ageGroup, start, end, comparable, change: comparable ? end.cases - start.cases : null };
    });
    const comparablePairs = pairs.filter(d => d.comparable);
    const largest = comparablePairs.reduce((best, d) => !best || Math.abs(d.change) > Math.abs(best.change) ? d : best, null);
    const maxCases = d3.max(pairs.flatMap(d => [d.start?.cases, d.end?.cases]).filter(Number.isFinite)) || 1;
    const x = d3.scaleLinear().domain([0, maxCases]).nice(5).range([margin.left, plotRight]);
    const y = d3.scaleBand().domain(ageGroups).range([margin.top, height - margin.bottom]).padding(0.42);
    const svg = chartHost.html("").append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", `Comparison of 2011 and 2021 hospitalised injury counts by age group in ${jurisdiction}.`);

    svg.append("g").attr("class", "q4-grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-plotHeight).tickFormat(""));
    svg.append("g").attr("class", "q4-axis q4-axis-x")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(10).tickFormat(d3.format(",d")));
    svg.append("g").attr("class", "q4-axis q4-axis-y")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0).tickPadding(12));
    svg.selectAll(".q4-axis .domain, .q4-grid .domain").remove();
    svg.append("text").attr("class", "q4-axis-title")
      .attr("x", (margin.left + plotRight) / 2).attr("y", height - 12)
      .attr("text-anchor", "middle").text("Hospitalised cases");

    const changeX = plotRight + 28;
    svg.append("text").attr("class", "q4-table-head")
      .attr("x", changeX).attr("y", 27).text("CHANGE");

    const rows = svg.append("g").selectAll("g")
      .data(pairs, d => d.ageGroup).join("g")
      .attr("class", d => `q4-dumbbell-row${d === largest ? " is-largest" : ""}`)
      .attr("transform", d => `translate(0,${y(d.ageGroup) + y.bandwidth() / 2})`);

    rows.filter(d => d.comparable).append("line")
      .attr("class", "q4-dumbbell-connector")
      .attr("x1", d => x(d.start.cases)).attr("x2", d => x(d.end.cases));

    for (const endpoint of ["start", "end"]) {
      const year = endpoint === "start" ? yearStart : yearEnd;
      const colorClass = endpoint === "start" ? "q4-dumbbell-dot-start" : "q4-dumbbell-dot-end";
      rows.filter(d => d[endpoint]?.cases != null).append("circle")
        .attr("class", `q4-dumbbell-dot ${colorClass}`)
        .attr("cx", d => x(d[endpoint].cases)).attr("r", 7)
        .attr("tabindex", 0).attr("role", "img")
        .attr("aria-label", d => `${jurisdiction}, ${d.ageGroup}, ${year}: ${numberFormat(d[endpoint].cases)} hospitalised cases`)
        .on("mouseenter mousemove", (event, d) => showTooltip(event, `${jurisdiction} · ${d.ageGroup} · ${year}: ${numberFormat(d[endpoint].cases)} cases`))
        .on("mouseleave blur", () => tooltip.classed("is-visible", false))
        .on("focus", (event, d) => showTooltip(event, `${jurisdiction} · ${d.ageGroup} · ${year}: ${numberFormat(d[endpoint].cases)} cases`));
    }

    rows.append("text").attr("class", d => `q4-dumbbell-change${d === largest ? " is-largest" : ""}`)
      .attr("x", changeX).attr("y", 4)
      .text(d => d.comparable ? formatSigned(d.change) : "n.p.");

    return { pairs, comparablePairs, largest };
  }

  function render(data, jurisdiction) {
    const selected = data.filter(d => d.jurisdiction === jurisdiction);
    const { pairs, comparablePairs, largest } = drawChart(selected, jurisdiction);
    if (!largest) {
      summary.text(`No age group has complete values in both ${yearStart} and ${yearEnd} for ${jurisdiction}.`);
    } else {
      const direction = largest.change > 0 ? "increase" : largest.change < 0 ? "decrease" : "no change";
      summary.html("")
        .append("span").attr("class", "q4-summary-label").text("Largest change")
        .node();
      summary.append("strong").text(`${largest.ageGroup}: ${formatSigned(largest.change)} cases`);
      summary.append("span").text(`${direction} from 2011 to 2021 · ${comparablePairs.length} of ${pairs.length} age groups comparable`);
    }
    const unavailable = pairs.filter(d => !d.comparable).length;
    status.text(unavailable
      ? `${unavailable} age group${unavailable === 1 ? " is" : "s are"} omitted from the change comparison because at least one endpoint value is not published (n.p.).`
      : "All age groups have published values in both years.");
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

      const years = d3.range(2011, 2022);
      const valid = data.length === 616 && data.every(d =>
        years.includes(d.year) && ageGroups.includes(d.ageGroup) && jurisdictions.includes(d.jurisdiction) &&
        Number.isInteger(d.missingPeriods) && d.missingPeriods >= 0 && d.missingPeriods <= 2 &&
        ((d.status === "complete" && d.missingPeriods === 0 && Number.isFinite(d.cases)) ||
          (d.status === "incomplete" && d.missingPeriods > 0 && d.cases == null))
      );
      if (!valid) throw new Error("The Q4 CSV does not match the expected schema or missing-data rules.");

      selector.selectAll("option").data(jurisdictions).join("option")
        .attr("value", d => d).text(d => d);
      selector.property("value", "NSW");
      selector.on("change", function () { render(data, this.value); });
      render(data, selector.property("value"));
    } catch (error) {
      console.error("Q4 chart error:", error);
      chartHost.text("Unable to load the Q4 age-group data. Check that data/q4_age_jurisdiction_annual.csv is available.");
      status.text(error.message || "Unable to load the Q4 data.").classed("is-error", true);
    }
  }

  init();
})();
