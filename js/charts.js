(() => {
  let currentDataset = null;

  function showSummary(dataset) {
    const recordCount = document.getElementById('record-count');
    const fieldCount = document.getElementById('field-count');
    const fieldList = document.getElementById('field-list');

    recordCount.textContent = dataset.rows.length.toLocaleString();
    fieldCount.textContent = dataset.headers.length.toLocaleString();

    fieldList.replaceChildren(
      ...dataset.headers.map((header) => {
        const chip = document.createElement('span');
        chip.className = 'field-chip';
        chip.textContent = header;
        return chip;
      }),
    );
  }

  function renderCategoryChart(fieldName) {
    const chartArea = document.getElementById('chart-placeholder');
    const chartTitle = document.getElementById('chart-title');
    const caption = document.querySelector('.chart-caption');

    chartArea.replaceChildren();

    if (!fieldName) {
      chartTitle.textContent = 'Choose a field to explore';
      chartArea.textContent = 'Select a field above to see how many rows have each value.';
      caption.textContent =
        'Bars count CSV rows. Confirm that one row represents one injury record before interpreting these counts.';
      return;
    }

    const counts = new Map();

    currentDataset.rows.forEach((row) => {
      const value = row[fieldName]?.trim();
      if (!value) return;

      counts.set(value, (counts.get(value) || 0) + 1);
    });

    const categories = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10);

    chartTitle.textContent = `Records by ${fieldName}`;
    caption.textContent =
      'Bars count CSV rows in each category. Confirm the dataset’s unit of analysis before interpreting them.';

    if (categories.length === 0) {
      chartArea.textContent = 'There are no non-empty values for this field.';
      return;
    }

    const maxCount = categories[0][1];
    const list = document.createElement('div');
    list.className = 'category-chart';
    list.setAttribute('role', 'list');
    list.setAttribute('aria-label', `Record counts by ${fieldName}`);

    categories.forEach(([category, count]) => {
      const row = document.createElement('div');
      row.className = 'category-row';
      row.setAttribute('role', 'listitem');

      const label = document.createElement('span');
      label.className = 'category-label';
      label.textContent = category;
      label.title = category;

      const track = document.createElement('span');
      track.className = 'category-track';
      track.setAttribute('aria-hidden', 'true');

      const bar = document.createElement('span');
      bar.className = 'category-bar';
      bar.style.width = `${(count / maxCount) * 100}%`;
      track.append(bar);

      const value = document.createElement('span');
      value.className = 'category-value';
      value.textContent = count.toLocaleString();

      row.append(label, track, value);
      list.append(row);
    });

    chartArea.append(list);
  }

  function buildExplorer(dataset) {
    currentDataset = dataset;
    showSummary(dataset);

    const chartArea = document.getElementById('chart-placeholder');
    const chartTitle = document.getElementById('chart-title');
    const caption = document.querySelector('.chart-caption');

    chartArea.classList.add('has-data');
    chartTitle.textContent = 'Explore records by field';

    const label = document.createElement('label');
    label.className = 'chart-select-label';
    label.htmlFor = 'category-field';
    label.textContent = 'Choose a category field';

    const select = document.createElement('select');
    select.id = 'category-field';
    select.className = 'chart-select';

    const prompt = document.createElement('option');
    prompt.value = '';
    prompt.textContent = 'Select a field';
    select.append(prompt);

    dataset.headers.forEach((header) => {
      const option = document.createElement('option');
      option.value = header;
      option.textContent = header;
      select.append(option);
    });

    const controls = document.createElement('div');
    controls.className = 'chart-controls';
    controls.append(label, select);

    chartArea.replaceChildren(controls);
    chartArea.append(document.createElement('div'));

    select.addEventListener('change', () => {
      const chartContent = chartArea.lastElementChild;
      chartContent.id = 'category-chart-content';
      renderCategoryChart(select.value);
    });

    caption.textContent =
      'Bars count CSV rows. Confirm that each row represents one injury record before interpreting the counts.';
  }

  window.addEventListener('projectdata:loaded', (event) => {
    buildExplorer(event.detail);
  });
})();