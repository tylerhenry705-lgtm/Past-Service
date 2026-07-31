const summaryCards = document.querySelector('#summary-cards');
const refreshButton = document.querySelector('#refresh-button');
const decadeChart = document.querySelector('#decade-chart');
const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

async function request(url) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}.`);
  }
  return response.json();
}

function renderDecadeChart(decades) {
  decadeChart.replaceChildren();
  if (!decades.length) {
    decadeChart.innerHTML = '<p class="status">No closure data available.</p>';
    return;
  }

  const maxCount = Math.max(...decades.map((item) => item.count), 1);
  for (const item of decades) {
    const column = document.createElement('div');
    column.className = 'chart-column';
    const height = Math.max(10, Math.round((item.count / maxCount) * 145));
    column.innerHTML = `
      <span class="chart-value">${item.count}</span>
      <span class="chart-bar" style="height:${height}px" aria-hidden="true"></span>
      <span class="chart-label">${item._id}s</span>`;
    column.setAttribute('title', `${item.count} closure${item.count === 1 ? '' : 's'} in the ${item._id}s`);
    decadeChart.appendChild(column);
  }
}

function renderSummary(data) {
  const average = Number(data.totals.averageLifespan || 0).toFixed(1);
  const latestDecade = data.byClosureDecade.at(-1)?._id;
  const largestPeak = Number(data.totals.largestPeakLocations || 0);
  const cards = [
    { icon: '▦', label: 'Restaurant documents', value: data.totals.restaurantCount.toLocaleString() },
    { icon: '⌛', label: 'Average brand lifespan', value: `${average} years` },
    { icon: '↘', label: 'Latest closure decade', value: latestDecade ? `${latestDecade}s` : 'N/A' },
    { icon: '▲', label: 'Largest peak footprint', value: largestPeak.toLocaleString() }
  ];

  summaryCards.replaceChildren();
  for (const cardData of cards) {
    const card = document.createElement('article');
    card.className = 'summary-card';
    card.innerHTML = `<span class="summary-card__icon" aria-hidden="true">${cardData.icon}</span><strong>${cardData.value}</strong><span>${cardData.label}</span>`;
    summaryCards.appendChild(card);
  }

  document.querySelector('#largest-peak').textContent = `${largestPeak.toLocaleString()} locations`;
  const busiestDecade = [...data.byClosureDecade].sort((a, b) => b.count - a.count)[0];
  const insightTitle = document.querySelector('#insight-title');
  const insightCopy = document.querySelector('#insight-copy');
  if (busiestDecade) {
    insightTitle.textContent = `The ${busiestDecade._id}s saw the most closures.`;
    insightCopy.textContent = `${busiestDecade.count} archived ${busiestDecade.count === 1 ? 'brand closed' : 'brands closed'} during that decade, based on the current collection.`;
  } else {
    insightTitle.textContent = 'Add records to reveal collection trends.';
    insightCopy.textContent = 'Aggregation insights will appear once the collection contains restaurant documents.';
  }
  renderDecadeChart(data.byClosureDecade);
}

async function loadSummary() {
  refreshButton.disabled = true;
  refreshButton.querySelector('.refresh-icon')?.classList.add('is-spinning');
  try {
    const data = await request('/api/restaurants/stats/summary');
    renderSummary(data);
  } catch (error) {
    summaryCards.innerHTML = `<p class="status">${error.message}</p>`;
    showToast(error.message, true);
  } finally {
    refreshButton.disabled = false;
    refreshButton.querySelector('.refresh-icon')?.classList.remove('is-spinning');
  }
}

refreshButton.addEventListener('click', loadSummary);
loadSummary();
