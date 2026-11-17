const q1States = ["NSW", "Vic", "Qld", "SA", "WA", "Tas", "NT", "ACT"];

async function drawQ1Chart() {
  const container = d3.select("#q1-chart");
  const controls = d3.select("#q1-controls");

  try {
    // loading csv using knime
    const data = await d3.csv(
      "data/q1_hospitalisation_trends.csv",
      d => ({
        year: +d.year,
        jurisdiction: d.jurisdiction.trim(),
        cases: +d.nonfatal_cases
      })
    );

    if (!data.length || data.some(d =>
      !Number.isFinite(d.year) ||
      !Number.isFinite(d.cases)
    )) {
      throw new Error("The CSV contains missing or invalid values.");
    }

    // to prepare the chart
    const margin = { top: 35, right: 25, bottom: 55, left: 75 };
    const width = 900;
    const height = 450;

    const svg = container
      .html("")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Annual non-fatal road traffic hospitalisations from 2011 to 2021");

    const x = d3.scaleLinear()
      .domain([2011, 2021])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.cases)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const colour = d3.scaleOrdinal()
      .domain(q1States)
      .range(d3.schemeTableau10);

    // to draw the axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues(d3.range(2011, 2022)).tickFormat(d3.format("d")));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("Year");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .text("Non-fatal hospitalised injury cases");

    // group records
    const grouped = d3.group(data, d => d.jurisdiction);

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.cases));

    const tooltip = container.append("div")
      .attr("class", "q1-tooltip")
      .style("display", "none");

    const selected = new Set(q1States);

    // to draw one line
    q1States.forEach(state => {
      const values = (grouped.get(state) || [])
        .sort((a, b) => a.year - b.year);

      const group = svg.append("g")
        .attr("class", "q1-series")
        .attr("data-state", state);

      group.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", colour(state))
        .attr("stroke-width", 2.5)
        .attr("d", line);

      group.selectAll("circle")
        .data(values)
        .join("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.cases))
        .attr("r", 4)
        .attr("fill", colour(state))
        .on("mouseover", (event, d) => {
          tooltip
            .style("display", "block")
            .text(`${state} | ${d.year}: ${d.cases.toLocaleString()} cases`);
        })
        .on("mousemove", event => {
          const bounds = container.node().getBoundingClientRect();
          tooltip
            .style("left", `${event.clientX - bounds.left + 12}px`)
            .style("top", `${event.clientY - bounds.top - 35}px`);
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
        })
        .append("title")
        .text(d => `${state}, ${d.year}: ${d.cases.toLocaleString()} cases`);
    });

    // checkboxes
    controls.html("");

    q1States.forEach(state => {
      const label = controls.append("label")
        .attr("class", "q1-filter");

      label.append("input")
        .attr("type", "checkbox")
        .property("checked", true)
        .on("change", function () {
          if (this.checked) {
            selected.add(state);
          } else {
            selected.delete(state);
          }

          svg.selectAll(".q1-series")
            .style("display", function () {
              return selected.has(this.getAttribute("data-state"))
                ? null
                : "none";
            });
        });

      label.append("span")
        .style("color", colour(state))
        .text(state);
    });

  } catch (error) {
    console.error("Q1 chart error:", error);
    container.text("Unable to load the Q1 data. Check the CSV file and run the website using a local server.");
  }
}

drawQ1Chart();
