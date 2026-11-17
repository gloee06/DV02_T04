// Renders Question 3: Shaded Matrix / Grouped Bar View for Road-User Groups (Q3)
function renderQ3Chart(data, targetElementId) {
    const margin = {top: 40, right: 30, bottom: 60, left: 190},
          width = 850 - margin.left - margin.right,
          height = 520 - margin.top - margin.bottom;

    // 1. Clear previous chart and tooltip if any
    d3.select(`#${targetElementId}`).html("");
    d3.select("#q3-tooltip").remove();

    // Create Tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("id", "q3-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000");

    // 2. Extract unique years and road-user groups from your unpivoted CSV schema
    const years = Array.from(new Set(data.map(d => d["Calendar year"]))).sort();
    const roadUsers = Array.from(new Set(data.map(d => d["ColumnNames"])));

    const svg = d3.select(`#${targetElementId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 3. Add Filter Controls Header (Buttons to filter by year or view all)
    const controlDiv = d3.select(`#${targetElementId}`)
        .insert("div", "svg")
        .style("margin-bottom", "15px")
        .style("text-align", "center");

    controlDiv.append("label")
        .text("Filter Year: ")
        .style("font-weight", "bold")
        .style("margin-right", "10px");

    const filterYears = ["All", "2011", "2016", "2021"];
    const buttons = controlDiv.selectAll("button")
        .data(filterYears)
        .enter()
        .append("button")
        .text(d => d)
        .style("margin", "0 4px")
        .style("padding", "5px 10px")
        .style("cursor", "pointer")
        .style("background", d => d === "All" ? "#007bff" : "#f8f9fa")
        .style("color", d => d === "All" ? "#fff" : "#333")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px");

    // 4. Scales Setup for Unpivoted Data
    const y0 = d3.scaleBand()
        .domain(roadUsers)
        .range([0, height])
        .paddingInner(0.2);

    const y1 = d3.scaleBand()
        .domain(years)
        .range([0, y0.bandwidth()])
        .padding(0.05);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d["ColumnValues"] || 0)])
        .nice()
        .range([0, width]);

    const color = d3.scaleOrdinal()
        .domain(years)
        .range(d3.schemeCategory10);

    // 5. Append Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6));

    svg.append("g")
        .call(d3.axisLeft(y0))
        .selectAll("text")
        .style("font-size", "11px");

    // Add X-Axis Label
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + 40})`)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("Hospitalised Injuries");

    // 6. Draw Bars Group (Nesting data by Road-User / ColumnNames)
    const nestedData = d3.groups(data, d => d["ColumnNames"]);

    let group = svg.selectAll(".road-user-group")
        .data(nestedData)
        .enter().append("g")
        .attr("class", "road-user-group")
        .attr("transform", d => `translate(0, ${y0(d[0])})`);

    let bars = group.selectAll("rect")
        .data(d => d[1]) // Array of year objects for this road user
        .enter().append("rect")
        .attr("y", d => y1(d["Calendar year"]))
        .attr("x", 0)
        .attr("height", y1.bandwidth())
        .attr("width", d => x(+d["ColumnValues"] || 0))
        .attr("fill", d => color(d["Calendar year"]))
        .style("transition", "opacity 0.2s");

    // 7. Interactive Tooltip Events
    bars.on("mouseover", function(event, d) {
            d3.select(this).style("opacity", 0.7);
            tooltip.style("visibility", "visible")
                .html(`<strong>Jurisdiction:</strong> ${d["Jurisdiction"]}<br/><strong>Road User:</strong> ${d["ColumnNames"]}<br/><strong>Year:</strong> ${d["Calendar year"]}<br/><strong>Injuries:</strong> ${(+d["ColumnValues"]).toLocaleString()}`);
        })
        .mousemove(function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                   .style("left", (event.pageX + 10) + "px");
        })
        .mouseout(function() {
            d3.select(this).style("opacity", 1);
            tooltip.style("visibility", "hidden");
        });

    // 8. Button Click Filtering Interactivity
    buttons.on("click", function(event, selectedYear) {
        buttons.style("background", "#f8f9fa").style("color", "#333");
        d3.select(this).style("background", "#007bff").style("color", "#fff");

        if (selectedYear === "All") {
            y1.domain(years);
            bars.attr("y", d => y1(d["Calendar year"]))
                .attr("height", y1.bandwidth())
                .style("display", "block");
        } else {
            y1.domain([selectedYear]);
            bars.attr("y", 0)
                .attr("height", y0.bandwidth())
                .style("display", d => d["Calendar year"] === selectedYear ? "block" : "none");
        }
    });
}