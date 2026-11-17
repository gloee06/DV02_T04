// Q3 Road-User Hospitalisation Heatmap (2011–2021)
document.addEventListener("DOMContentLoaded", () => {
    const csvPath = "data/q3_jurisdiction_roadusers.csv";
    const container = d3.select("#q3-heatmap");

    // Create tooltip element
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "q3-tooltip");

    // Set dimensions and margins
    const margin = { top: 30, right: 40, bottom: 75, left: 190 };
    const width = 920 - margin.left - margin.right;
    const height = 430 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Helper to map raw KNIME column codes to clean labels if not already renamed
    function mapCategoryName(name) {
        const mapping = {
            "Col1": "Car driver, passenger",
            "Col2": "Motorcyclist",
            "Col3": "Pedal cyclist",
            "Col4": "Pedestrian",
            "Col5": "Heavy vehicle occupant",
            "Col6": "Bus occupant",
            "Col7": "Other/Unspecified occupant",
            "Col8": "Total"
        };
        const trimmed = (name || "").trim();
        return mapping[trimmed] || trimmed;
    }

    // Load CSV exported from KNIME
    d3.csv(csvPath).then(rawData => {
        // Parse and clean fields
        const data = rawData
            .map(d => {
                const yearVal = (d["Col0"] || d["Calendar year"] || "").trim();
                const rawCategory = (d["ColumnNames"] || "").trim();
                const categoryVal = mapCategoryName(rawCategory);
                const jurisdictionVal = (d["Jurisdiction"] || "").trim();
                
                const rawCount = String(d["ColumnValues"] || "0").replace(/,/g, "");
                const countVal = +rawCount;

                return {
                    jurisdiction: jurisdictionVal || "National / Unassigned",
                    year: yearVal,
                    category: categoryVal,
                    value: isNaN(countVal) ? 0 : countVal
                };
            })
            .filter(d => d.year && d.category && d.category.toLowerCase() !== "total" && d.category !== "Col8");

        // Extract unique sorted domains
        const years = Array.from(new Set(data.map(d => d.year))).sort();
        const categories = Array.from(new Set(data.map(d => d.category)));
        const jurisdictions = Array.from(new Set(data.map(d => d.jurisdiction))).filter(Boolean).sort();

        // Populate jurisdiction dropdown if present in HTML
        const select = d3.select("#jurisdiction-select");
        if (!select.empty()) {
            select.selectAll("option").remove();
            select.append("option")
                .attr("value", "ALL")
                .text("All Jurisdictions (National Total)");

            jurisdictions.forEach(j => {
                select.append("option")
                    .attr("value", j)
                    .text(j);
            });

            select.on("change", function () {
                updateHeatmap(this.value);
            });
        }

        // Scales
        const xScale = d3.scaleBand()
            .domain(years)
            .range([0, width])
            .padding(0.06);

        const yScale = d3.scaleBand()
            .domain(categories)
            .range([0, height])
            .padding(0.08);

        const colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateYlOrRd);

        // Axes groups
        const xAxisGroup = svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        const yAxisGroup = svg.append("g")
            .attr("class", "axis y-axis")
            .call(d3.axisLeft(yScale));

        // Color Legend setup
        const legendWidth = 220;
        const legendHeight = 10;
        const legendGroup = svg.append("g")
            .attr("transform", `translate(${width - legendWidth}, ${height + 42})`);

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "q3-legend-gradient");

        linearGradient.selectAll("stop")
            .data([
                { offset: "0%", color: d3.interpolateYlOrRd(0) },
                { offset: "50%", color: d3.interpolateYlOrRd(0.5) },
                { offset: "100%", color: d3.interpolateYlOrRd(1) }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .attr("rx", 3)
            .style("fill", "url(#q3-legend-gradient)");

        legendGroup.append("text")
            .attr("class", "legend-title")
            .attr("x", 0)
            .attr("y", -6)
            .text("Hospitalised Cases");

        const legendMinText = legendGroup.append("text")
            .attr("class", "legend-title")
            .attr("x", 0)
            .attr("y", legendHeight + 13)
            .text("0");

        const legendMaxText = legendGroup.append("text")
            .attr("class", "legend-title")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 13)
            .attr("text-anchor", "end");

        // Render / Update function
        function updateHeatmap(selectedJurisdiction) {
            const filtered = selectedJurisdiction === "ALL"
                ? data
                : data.filter(d => d.jurisdiction === selectedJurisdiction);

            // Aggregate values by (year, category)
            const rolled = d3.rollup(
                filtered,
                v => d3.sum(v, d => d.value),
                d => d.year,
                d => d.category
            );

            const gridData = [];
            years.forEach(yr => {
                categories.forEach(cat => {
                    const val = rolled.get(yr)?.get(cat) || 0;
                    gridData.push({
                        year: yr,
                        category: cat,
                        value: val,
                        jurisdictionLabel: selectedJurisdiction === "ALL" ? "All Jurisdictions (National Total)" : selectedJurisdiction
                    });
                });
            });

            const maxVal = d3.max(gridData, d => d.value) || 1;
            colorScale.domain([0, maxVal]);
            legendMaxText.text(d3.format(",")(maxVal));

            // Bind data to cells
            const cells = svg.selectAll(".heatmap-cell")
                .data(gridData, d => `${d.year}-${d.category}`);

            cells.enter()
                .append("rect")
                .attr("class", "heatmap-cell")
                .attr("x", d => xScale(d.year))
                .attr("y", d => yScale(d.category))
                .attr("width", xScale.bandwidth())
                .attr("height", yScale.bandwidth())
                .style("fill", d => colorScale(d.value))
                .on("mouseover", function (event, d) {
                    tooltip.style("opacity", 1)
                        .html(`
                            <strong>${d.category}</strong><br/>
                            Jurisdiction: ${d.jurisdictionLabel}<br/>
                            Year: ${d.year}<br/>
                            Hospitalisations: <strong>${d3.format(",")(d.value)}</strong>
                        `);
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", (event.pageX + 14) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function () {
                    tooltip.style("opacity", 0);
                })
                .merge(cells)
                .transition()
                .duration(350)
                .style("fill", d => colorScale(d.value));

            cells.exit().remove();

            // Cell numeric value overlays
            const labels = svg.selectAll(".cell-label")
                .data(gridData, d => `${d.year}-${d.category}`);

            labels.enter()
                .append("text")
                .attr("class", "cell-label")
                .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
                .attr("y", d => yScale(d.category) + yScale.bandwidth() / 2)
                .merge(labels)
                .transition()
                .duration(350)
                .style("fill", d => d.value > maxVal * 0.55 ? "#ffffff" : "#1e293b")
                .text(d => d.value > 0 ? d3.format(",")(d.value) : "0");

            labels.exit().remove();
        }

        // Initial render
        updateHeatmap("ALL");
    }).catch(err => {
        console.error("Error loading Q3 CSV data:", err);
        container.append("p")
            .style("color", "#dc2626")
            .text("Failed to load data/q3_jurisdiction_roadusers.csv. Please verify the CSV file path and ensure it is exported correctly from KNIME.");
    });
});