// Renders Question 3: Interactive Shaded Matrix / Heatmap View
function renderQ3Heatmap(data, targetElementId) {
    const margin = {top: 50, right: 30, bottom: 80, left: 220},
          width = 850 - margin.left - margin.right,
          height = 450 - margin.top - margin.bottom;

    // 1. Clear previous chart and tooltip
    d3.select(`#${targetElementId}`).html("");
    d3.select("#q3-heatmap-tooltip").remove();

    const tooltip = d3.select("body").append("div")
        .attr("id", "q3-heatmap-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.85)")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000");

    // 2. Extract unique years and road-user groups from your unpivoted CSV data
    const years = Array.from(new Set(data.map(d => String(d["Calendar year"])))).sort();
    const roadUsers = Array.from(new Set(data.map(d => d["ColumnNames"])));

    // 3. Create UI Controls Header (Filter by Jurisdiction or Year)
    const controlDiv = d3.select(`#${targetElementId}`)
        .insert("div", ":first-child")
        .style("margin-bottom", "15px")
        .style("display", "flex")
        .style("gap", "20px")
        .style("align-items", "center")
        .style("font-family", "sans-serif");

    // Jurisdiction selector (since your KNIME output includes jurisdictions like NSW, VIC, etc.)
    const jurisdictions = Array.from(new Set(data.map(d => d["Jurisdiction"]))).sort();
    let selectedJurisdiction = jurisdictions[0] || "NSW";

    const jurControl = controlDiv.append("div");
    jurControl.append("label").text("Jurisdiction: ").style("font-weight", "bold").style("margin-right", "8px");
    const jurSelect = jurControl.append("select")
        .style("padding", "4px 8px")
        .style("border-radius", "4px");

    jurSelect.selectAll("option")
        .data(jurisdictions)
        .enter().append("option")
        .text(d => d)
        .attr("value", d => d);

    const svg = d3.select(`#${targetElementId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 4. Scales Setup for Matrix
    const x = d3.scaleBand()
        .range([0, width])
        .domain(years)
        .padding(0.05);

    const y = d3.scaleBand()
        .range([height, 0])
        .domain(roadUsers)
        .padding(0.05);

    // Color scale for shading intensity (Shaded map effect)
    const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateBlues);

    // Append Axes
    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "11px");

    // X-axis label
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + 40})`)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", "12px")
        .text("Calendar Year");

    // Chart Title
    const chartTitle = svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", "14px");

    // 5. Update Function for Jurisdiction Switching
    function updateHeatmap(jur) {
        const filteredData = data.filter(d => String(d["Jurisdiction"]) === String(jur));

        // Update color scale domain based on current jurisdiction's min/max values
        colorScale.domain([0, d3.max(filteredData, d => +d["ColumnValues"] || 0)]);
        chartTitle.text(`Hospitalised Injuries by Road-User Group & Year (${jur})`);

        // Bind data to rects (Matrix Cells)
        const cells = svg.selectAll(".heatmap-cell")
            .data(filteredData, d => `${d["ColumnNames"]}-${d["Calendar year"]}`);

        // Enter + Update
        cells.enter()
            .append("rect")
            .attr("class", "heatmap-cell")
            .merge(cells)
            .attr("x", d => x(String(d["Calendar year"])))
            .attr("y", d => y(d["ColumnNames"]))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("rx", 4)
            .attr("ry", 4)
            .style("fill", "#eee")
            .transition().duration(500)
            .style("fill", d => colorScale(+d["ColumnValues"] || 0));

        cells.exit().remove();

        // 6. Interactive Tooltip Events
        svg.selectAll(".heatmap-cell")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .style("stroke", "#000")
                    .style("stroke-width", "2px");

                tooltip.style("visibility", "visible")
                    .html(`<strong>Jurisdiction:</strong> ${d["Jurisdiction"]}<br/>
                           <strong>Group:</strong> ${d["ColumnNames"]}<br/>
                           <strong>Year:</strong> ${d["Calendar year"]}<br/>
                           <strong>Injuries:</strong> ${(+d["ColumnValues"]).toLocaleString()} cases`);
            })
            .mousemove(function(event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .mouseout(function() {
                d3.select(this)
                    .style("stroke", "none");
                tooltip.style("visibility", "hidden");
            });
    }

    // Initial render
    updateHeatmap(selectedJurisdiction);

    // Dropdown change listener
    jurSelect.on("change", function() {
        selectedJurisdiction = this.value;
        updateHeatmap(selectedJurisdiction);
    });
}