// Renders Question 5: Multi-Series Line Plot for Counterparty / Severity Trends
function renderQ5Chart(data, targetElementId) {
    const margin = {top: 30, right: 50, bottom: 50, left: 60},
          width = 800 - margin.left - margin.right,
          height = 450 - margin.top - margin.bottom;

    d3.select(`#${targetElementId}`).html("");

    const svg = d3.select(`#${targetElementId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale for Calendar Year (2011 to 2021)
    const x = d3.scaleLinear()
        .domain([2011, 2021])
        .range([0, width]);

    // Y scale for Hospitalised Injuries (0 to 6000)
    const y = d3.scaleLinear()
        .domain([0, 6000])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Line generator configuration
    const valueline = d3.line()
        .x(d => x(+d.Calendar_year))
        .y(d => y(+d.Value));
}