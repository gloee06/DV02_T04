// The team should agree on a research question and measure before adding charts.
function showDatasetSummary({ headers, rows }) {
  const recordCount = document.getElementById('record-count');
  const fieldCount = document.getElementById('field-count');
  const fieldList = document.getElementById('field-list');
  const chartTitle = document.getElementById('chart-title');
  const chartMessage = document.querySelector('#chart-placeholder p');

  recordCount.textContent = rows.length.toLocaleString();
  fieldCount.textContent = headers.length.toLocaleString();

  fieldList.replaceChildren(...headers.map((header) => {
    const chip = document.createElement('span');
    chip.className = 'field-chip';
    chip.textContent = header;
    return chip;
  }));

  chartTitle.textContent = 'Data loaded — chart design to be agreed';
  chartMessage.textContent = 'Review the available fields and decide which comparison answers the team’s research question. This draft does not treat each row as an injury count.';
  document.getElementById('chart-placeholder').classList.add('has-data');
}

window.addEventListener('projectdata:loaded', (event) => showDatasetSummary(event.detail));
