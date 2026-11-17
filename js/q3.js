// Question 3: Horizontal Grouped Bar Chart for Road-User Groups
function renderQ3Chart(data, targetElementId) {
    const margin = {top: 30, right: 30, bottom: 60, left: 180},
          width = 800 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    // Clear previous chart if any
    d3.select(`#${targetElementId}`).html("");

    const svg = d3.select(`#${targetElementId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
}