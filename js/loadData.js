// js/loadData.js - Data loading function for the D3 dashboard
async function loadDataset(filePath) {
    try {
        // Load CSV data using D3 fetch
        const data = await d3.csv(filePath);
        console.log("Data loaded successfully from:", filePath);
        return data;
    } catch (error) {
        console.error("Error loading the dataset:", error);
        return null;
    }
}