(() => {
  const CSV_PATH = 'data/injuries.csv';

  function parseCSV(text) {
    const input = text.replace(/^\uFEFF/, '');
    const records = [];
    let cells = [];
    let value = '';
    let insideQuotes = false;

    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];

      if (char === '"') {
        if (insideQuotes && input[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        cells.push(value);
        value = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && input[i + 1] === '\n') i += 1;

        cells.push(value);
        if (cells.some((cell) => cell.trim() !== '')) records.push(cells);

        cells = [];
        value = '';
      } else {
        value += char;
      }
    }

    if (insideQuotes) {
      throw new Error('The CSV has a quote that was not closed.');
    }

    if (value.length > 0 || cells.length > 0) {
      cells.push(value);
      if (cells.some((cell) => cell.trim() !== '')) records.push(cells);
    }

    if (records.length === 0) {
      throw new Error('The CSV is empty.');
    }

    const headers = records[0].map((header) => header.trim());
    const normalizedHeaders = headers.map((header) => header.toLowerCase());

    if (headers.some((header) => !header)) {
      throw new Error('Every CSV column needs a header.');
    }

    if (new Set(normalizedHeaders).size !== headers.length) {
      throw new Error('The CSV has duplicate column names.');
    }

    const rows = records.slice(1).map((record, index) => {
      if (record.length !== headers.length) {
        throw new Error(`CSV row ${index + 2} has a different number of values than the header.`);
      }

      return Object.fromEntries(
        headers.map((header, columnIndex) => [
          header,
          record[columnIndex].trim(),
        ]),
      );
    });

    return { headers, rows };
  }

  async function loadCSV() {
    const status = document.getElementById('data-status');
    const statusText = document.getElementById('data-status-text');

    status.classList.add('is-loading');

    try {
      const response = await fetch(CSV_PATH, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Could not load ${CSV_PATH} (HTTP ${response.status}).`);
      }

      const dataset = parseCSV(await response.text());

      status.classList.remove('is-loading', 'is-error');
      status.classList.add('is-ready');
      statusText.textContent =
        `Loaded ${CSV_PATH}. Check the row meaning before interpreting the data.`;

      window.dispatchEvent(
        new CustomEvent('projectdata:loaded', { detail: dataset }),
      );
    } catch (error) {
      status.classList.remove('is-loading', 'is-ready');
      status.classList.add('is-error');
      statusText.textContent =
        `${error.message} Check the CSV file and try again.`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCSV, { once: true });
  } else {
    loadCSV();
  }
})();