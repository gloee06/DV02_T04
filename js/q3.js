// ==========================================
// Question 3: Shaded Matrix / Heatmap View
// ==========================================

document.addEventListener("DOMContentLoaded", function() {
    // Load the unpivoted CSV data exported from KNIME
    d3.csv("data/q3_jurisdiction_roadusers.csv").then(data => {
        renderQ3Heatmap(data, "q3-heatmap-chart");
    }).catch(error => {
        console.error("Error loading Q3 CSV data:", error);
        d3.select("#q3-heatmap-chart")
            .html("<p style='color: red; text-align: center;'>Error loading Q3_jurisdiction_roadusers.csv. Please check file path.</p>");
    });
});

function renderQ3Heatmap(data, targetElementId) {
    const margin = {top: 50, right: 30, bottom: 80, left: 220},
          width = 850 - margin.left - margin.right,
          height = 450 - margin.top - margin.bottom;

    // 1. Clear previous chart and tooltip if any
    d3.select(`#${targetElementId}`).html("");
    d3.select("#q3-heatmap-tooltip").remove();

    // Create Tooltip element
    const tooltip = d3.select("body").append("div")
        .attr("id", "q3-heatmap-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(30, 41, 59, 0.95)")
        .style("color", "#ffffff")
        .style("padding", "10px 14px")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("line-height", "1.4")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.15)");

    // 2. Extract unique years and road-user groups from CSV schema
    const years = Array.from(new Set(data.map(d => String(d["Calendar year"])))).sort();
    const roadUsers = Array.from(new Set(data.map(d => d["ColumnNames"])));
    const jurisdictions = Array.from(new Set(data.map(d => d["Jurisdiction"]))).sort();
    
    let selectedJurisdiction = jurisdictions[0] || "NSW";

    // 3. Create Controls Header (Jurisdiction Dropdown Filter)
    const controlDiv = d3.select(`#${targetElementId}`)
        .append("div")
        .attr("class", "q3-controls")
        .style("margin-bottom", "20px")
        .style("display", "flex")
        .style("gap", "15px")
        .style("align-items", "center");

    const jurControl = controlDiv.append("div");
    jurControl.append("label")
        .text("Select Jurisdiction: ")
        .style("font-weight", "600")
        .style("margin-right", "8px")
        .style("color", "#2c3e2d");

    const jurSelect = jurControl.append("select")
        .style("padding", "6px 12px")
        .style("border-radius", "6px")
        .style("border", "1px solid #cbd5e1")
        .style("background-color", "#ffffff")
        .style("cursor", "pointer");

    jurSelect.selectAll("option")
        .data(jurisdictions)
        .enter().append("option")
        .text(d => d)
        .attr("value", d => d)
        .property("selected", d => d === selectedJurisdiction);

    // 4. Create SVG Canvas
    const svg = d3.select(`#${targetElementId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 5. Scales Setup for Matrix Grid
    const x = d3.scaleBand()
        .range([0, width])
        .domain(years)
        .padding(0.05);

    const y = d3.scaleBand()
        .range([height, 0])
        .domain(roadUsers)
        .padding(0.05);

    // Sequential color scale (shading density) matching sage/blue tone
    const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateBlues);

    // Append Axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "11px");

    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "11px");

    // X-Axis Label
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + 45})`)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", "12px")
        .style("fill", "#1e293b")
        .text("Calendar Year");

    // Dynamic Chart Title
    const chartTitle = svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", "14px")
        .style("fill", "#1e293b");

    // 6. Update Function to redraw cells based on selected jurisdiction
    function updateHeatmap(jur) {
        const filteredData = data.filter(d => String(d["Jurisdiction"]) === String(jur));

        // Update color domain based on active jurisdiction's max count
        colorScale.domain([0, d3.max(filteredData, d => +d["ColumnValues"] || 0)]);
        chartTitle.text(`Hospitalised Injuries by Road-User Group & Year (${jur})`);

        // Bind data
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
            .style("cursor", "pointer")
            .transition().duration(500)
            .style("fill", d => colorScale(+d["ColumnValues"] || 0));

        cells.exit().remove();

        // 7. Interactive Hover Tooltip Events
        svg.selectAll(".heatmap-cell")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .style("stroke", "#1e293b")
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
                d3.select(this).style("stroke", "none");
                tooltip.style("visibility", "hidden");
            });
    }

    // Initial render call
    updateHeatmap(selectedJurisdiction);

    // Dropdown change listener
    jurSelect.on("change", function() {
        selectedJurisdiction = this.value;
        updateHeatmap(selectedJurisdiction);
    });
}