const q2States = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "NT", "ACT"];
const q2Sexes = ["Male", "Female"];

async function drawQ2Chart() {
  const container = d3.select("#q2-chart");
  const controls = d3.select("#q2-controls");

  if (container.empty() || controls.empty()) return;

  try {
    // Load the dataset in KNIME
    const data = await d3.csv("data/q2_gender_comparison.csv", d => ({
      year: +d.year,
      sex: d.sex.trim(),
      jurisdiction: d.jurisdiction.trim(),
      cases: +d.nonfatal_cases
    }));

    if (!data.length || data.some(d =>
      !Number.isFinite(d.year) ||
      !Number.isFinite(d.cases)
    )) {
      throw new Error("Invalid Q2 dataset.");
    }

    const width = 900;
    const height = 520;
    const margin = { top: 25, right: 35, bottom: 65, left: 85 };

    const colours = {
      Male: "#3978A8",
      Female: "#CC7546"
    };

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.cases)])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(q2States)
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    const ySex = d3.scaleBand()
      .domain(q2Sexes)
      .range([0, y.bandwidth()])
      .padding(0.1);

    // Creating the chart
    const svg = container.html("")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Male and female road traffic hospitalisation counts by jurisdiction");

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(7).tickFormat(d3.format(",")));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 15)
      .attr("text-anchor", "middle")
      .text("Non-fatal hospitalised injury cases");

    const tooltip = container.append("div")
      .attr("class", "q2-tooltip")
      .style("display", "none");

    // year selector
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

    // draw bars
    function updateChart(selectedYear) {
      const filtered = data.filter(d => d.year === selectedYear);

      svg.selectAll(".q2-bar")
        .data(filtered, d => `${d.jurisdiction}-${d.sex}`)
        .join("rect")
        .attr("class", "q2-bar")
        .attr("x", x(0))
        .attr("y", d => y(d.jurisdiction) + ySex(d.sex))
        .attr("width", d => x(d.cases) - x(0))
        .attr("height", ySex.bandwidth())
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
