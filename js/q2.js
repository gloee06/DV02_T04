const q2States = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "NT", "ACT"];
const q2Sexes = ["Male", "Female"];

async function drawQ2Chart() {
  const container = d3.select("#q2-chart");
  const controls = d3.select("#q2-controls");

  if (container.empty() || controls.empty()) return;

  try {
    const data = await d3.csv("data/q2_gender_comparison.csv", d => ({
      year: +d.year,
      sex: d.sex.trim(),
      jurisdiction: d.jurisdiction.trim(),
      cases: +d.nonfatal_cases
    }));

    if (!data.length || data.some(d => !Number.isFinite(d.year) || !Number.isFinite(d.cases))) {
      throw new Error("Invalid Q2 dataset.");
    }

    const width = 950;
    const height = 540;
    const margin = { top: 30, right: 40, bottom: 70, left: 90 };

    const colours = {
      Male: "#3978A8",
      Female: "#CC7546"
    };

    const maxCases = d3.max(data, d => d.cases);

    const x = d3.scaleLinear()
      .domain([-maxCases, maxCases])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(q2States)
      .range([margin.top, height - margin.bottom])
      .padding(0.25);

    const barHeight = y.bandwidth() * 0.65;

    const svg = container.html("")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Butterfly chart comparing male and female hospitalisation counts by jurisdiction");

    const tooltip = container.append("div")
      .attr("class", "q2-tooltip")
      .style("display", "none");

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3.axisBottom(x)
          .ticks(9)
          .tickFormat(d => d3.format(",")(Math.abs(d)))
      );

    svg.append("g")
      .attr("transform", `translate(${margin.left - 10},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .call(g => g.select(".domain").remove());

    svg.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#777")
      .attr("stroke-width", 1.2);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .text("Non-fatal hospitalised injury cases");

    svg.append("text")
      .attr("x", x(-maxCases / 2))
      .attr("y", margin.top - 8)
      .attr("text-anchor", "middle")
      .attr("font-weight", "600")
      .attr("fill", colours.Male)
      .text("Male");

    svg.append("text")
      .attr("x", x(maxCases / 2))
      .attr("y", margin.top - 8)
      .attr("text-anchor", "middle")
      .attr("font-weight", "600")
      .attr("fill", colours.Female)
      .text("Female");

    controls.html("");

    controls.append("label")
      .attr("for", "q2-year")
      .text("Select year: ");

    const yearSelect = controls.append("select")
      .attr("id", "q2-year");

    yearSelect.selectAll("option")
      .data(d3.range(2011, 2022))
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    yearSelect.property("value", "2021");

    const legend = controls.append("div")
      .attr("class", "q2-legend");

    q2Sexes.forEach(sex => {
      legend.append("span")
        .style("color", colours[sex])
        .text("● " + sex);
    });

    function updateChart(selectedYear) {
      const filtered = data
        .filter(d => d.year === selectedYear)
        .map(d => ({
          ...d,
          value: d.sex === "Male" ? -d.cases : d.cases
        }));

      svg.selectAll(".q2-bar")
        .data(filtered, d => `${d.jurisdiction}-${d.sex}`)
        .join("rect")
        .attr("class", "q2-bar")
        .attr("x", d => Math.min(x(0), x(d.value)))
        .attr("y", d => y(d.jurisdiction) + (y.bandwidth() - barHeight) / 2)
        .attr("height", barHeight)
        .attr("width", d => Math.abs(x(d.value) - x(0)))
        .attr("fill", d => colours[d.sex])
        .attr("tabindex", 0)
        .attr("aria-label", d =>
          `${d.jurisdiction}, ${d.sex}, ${d.year}: ${d.cases} cases`
        )
        .on("mouseover", (event, d) => {
          tooltip
            .style("display", "block")
            .text(`${d.jurisdiction} | ${d.sex} | ${d.year}: ${d.cases.toLocaleString()} cases`);
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
        .on("focus", (event, d) => {
          tooltip
            .style("display", "block")
            .style("left", "15px")
            .style("top", "10px")
            .text(`${d.jurisdiction} | ${d.sex} | ${d.year}: ${d.cases.toLocaleString()} cases`);
        })
        .on("blur", () => {
          tooltip.style("display", "none");
        });
    }

    updateChart(2021);

    yearSelect.on("change", function () {
      updateChart(+this.value);
    });

  } catch (error) {
    console.error("Q2 chart error:", error);
    container.text("Unable to load Q2 data. Check your CSV file.");
  }
}

drawQ2Chart();