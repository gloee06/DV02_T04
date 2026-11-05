// Draft CSV loader. Keep the source dataset documented in data/README.md.
const DATA_PATH = 'data/injuries.csv';

function parseCSV(text) {
  const source = text.replace(/^\uFEFF/, '');
  const records = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== '')) records.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell.trim() !== '')) records.push(row);
  }

  if (records.length < 1) throw new Error('The CSV is empty or has no header row.');
  const headers = records[0].map((header) => header.trim());
  if (headers.some((header) => !header)) throw new Error('Every CSV column needs a header.');

  const rows = records.slice(1).map((cells) => Object.fromEntries(
    headers.map((header, index) => [header, (cells[index] ?? '').trim()]),
  ));

  return { headers, rows };
}

async function loadProjectData() {
  const status = document.getElementById('data-status');
  const message = document.getElementById('data-status-text');
  status.classList.add('is-loading');

  try {
    const response = await fetch(DATA_PATH, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load ${DATA_PATH} (HTTP ${response.status}).`);
    const dataset = parseCSV(await response.text());
    window.projectDataset = dataset;
    status.classList.remove('is-loading');
    status.classList.add('is-ready');
    message.textContent = `Loaded ${DATA_PATH}. Check the fields and record meaning before interpreting them.`;
    window.dispatchEvent(new CustomEvent('projectdata:loaded', { detail: dataset }));
  } catch (error) {
    status.classList.remove('is-loading');
    status.classList.add('is-error');
    message.textContent = `${error.message} Add the agreed CSV to the data folder when it is ready.`;
  }
}

document.addEventListener('DOMContentLoaded', loadProjectData);
