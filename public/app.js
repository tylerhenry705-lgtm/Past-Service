const listElement = document.querySelector('#restaurant-list');
const statusElement = document.querySelector('#status-message');
const template = document.querySelector('#restaurant-template');
const filterForm = document.querySelector('#filter-form');
const restaurantForm = document.querySelector('#restaurant-form');
const summaryCards = document.querySelector('#summary-cards');
const refreshButton = document.querySelector('#refresh-button');
const resetFiltersButton = document.querySelector('#reset-filters');
const dialog = document.querySelector('#restaurant-dialog');
const toast = document.querySelector('#toast');
const saveButton = document.querySelector('#save-button');
const restaurantIdInput = document.querySelector('#restaurant-id');
const decadeChart = document.querySelector('#decade-chart');

const accentColors = ['#d99a3f', '#3e806a', '#bd5a43', '#6887a8', '#8a6d9d', '#9a7a3d'];

const restaurantImages = {
  'Burger Chef': { src: 'images/archive/burger-chef.webp', label: 'Archive photo' },
  'Red Barn': { src: 'images/archive/red-barn.webp', label: 'Surviving building' },
  "Pup 'N' Taco": { src: 'images/archive/pup-n-taco.webp', label: 'Archive photo' },
  'White Tower Hamburgers': { src: 'images/archive/white-tower.webp', label: 'Archive photo' },
  'Doggie Diner': { src: 'images/archive/doggie-diner.webp', label: 'Historic sign' }
};

const fallbackRestaurantImage = {
  src: 'images/archive/drive-in-illustration.webp',
  label: 'Archive illustration'
};
let currentRestaurants = [];
let toastTimer;

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.style.color = isError ? '#9b3324' : '';
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}.`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function accentFor(name) {
  const score = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return accentColors[score % accentColors.length];
}

function showSkeletons() {
  listElement.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton-card" aria-hidden="true"></div>').join('');
}

function renderRestaurants(restaurants) {
  listElement.replaceChildren();

  if (restaurants.length === 0) {
    listElement.innerHTML = `
      <div class="empty-state">
        <strong>No restaurants matched your filters.</strong>
        <p>Try a broader search or reset the collection filters.</p>
        <button class="button button--secondary" type="button" data-reset-empty>Reset filters</button>
      </div>`;
    listElement.querySelector('[data-reset-empty]').addEventListener('click', resetFilters);
    return;
  }

  for (const restaurant of restaurants) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('.restaurant-card');
    const accent = accentFor(restaurant.name);
    card.style.setProperty('--card-accent', accent);

    const imageData = restaurantImages[restaurant.name] || fallbackRestaurantImage;
    const image = fragment.querySelector('.restaurant-card__image');
    image.src = imageData.src;
    image.alt = `${restaurant.name} restaurant visual`;
    fragment.querySelector('.restaurant-card__image-label').textContent = imageData.label;

    fragment.querySelector('.restaurant-logo').textContent = initials(restaurant.name);
    fragment.querySelector('.restaurant-card__years').textContent = `${restaurant.foundedYear}–${restaurant.closedYear}`;
    fragment.querySelector('.restaurant-card__name').textContent = restaurant.name;
    fragment.querySelector('.restaurant-card__location').textContent = `${restaurant.headquarters} · ${restaurant.country}`;
    fragment.querySelector('.restaurant-card__history').textContent = restaurant.history;
    fragment.querySelector('.restaurant-card__peak').textContent = restaurant.peakLocations?.toLocaleString() || 'Not recorded';
    fragment.querySelector('.restaurant-card__lifespan').textContent = `${restaurant.closedYear - restaurant.foundedYear} years`;
    fragment.querySelector('.restaurant-card__items').textContent = restaurant.signatureItems?.join(' · ') || 'Not recorded';
    fragment.querySelector('.restaurant-card__reason').textContent = restaurant.closureReason;

    fragment.querySelector('.edit-button').setAttribute('aria-label', `Edit ${restaurant.name}`);
    fragment.querySelector('.delete-button').setAttribute('aria-label', `Delete ${restaurant.name}`);

    fragment.querySelector('.edit-button').addEventListener('click', () => openRestaurantDialog(restaurant));
    fragment.querySelector('.delete-button').addEventListener('click', () => deleteRestaurant(restaurant));

    listElement.appendChild(fragment);
  }
}

async function deleteRestaurant(restaurant) {
  const confirmed = window.confirm(`Delete ${restaurant.name} from the MongoDB collection? This cannot be undone.`);
  if (!confirmed) return;

  try {
    await request(`/api/restaurants/${restaurant._id}`, { method: 'DELETE' });
    showToast(`${restaurant.name} was deleted.`);
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
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
    card.innerHTML = `
      <span class="summary-card__icon" aria-hidden="true">${cardData.icon}</span>
      <strong>${cardData.value}</strong>
      <span>${cardData.label}</span>`;
    summaryCards.appendChild(card);
  }

  document.querySelector('#hero-record-count').textContent = data.totals.restaurantCount.toLocaleString();
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

async function loadRestaurants() {
  try {
    showSkeletons();
    setStatus('Loading restaurants…');
    const params = new URLSearchParams(new FormData(filterForm));
    for (const [key, value] of [...params.entries()]) {
      if (!value) params.delete(key);
    }

    const query = params.toString();
    const data = await request(`/api/restaurants${query ? `?${query}` : ''}`);
    currentRestaurants = data.restaurants;
    renderRestaurants(currentRestaurants);
    setStatus(`${data.count} restaurant ${data.count === 1 ? 'document' : 'documents'} found`);
  } catch (error) {
    listElement.replaceChildren();
    setStatus(error.message, true);
    showToast(error.message, true);
  }
}

async function loadSummary() {
  try {
    const data = await request('/api/restaurants/stats/summary');
    renderSummary(data);
  } catch (error) {
    summaryCards.innerHTML = `<p class="status">${error.message}</p>`;
    showToast(error.message, true);
  }
}

async function refreshAll() {
  refreshButton.disabled = true;
  refreshButton.querySelector('.refresh-icon')?.classList.add('is-spinning');
  try {
    await Promise.all([loadRestaurants(), loadSummary()]);
  } finally {
    refreshButton.disabled = false;
    refreshButton.querySelector('.refresh-icon')?.classList.remove('is-spinning');
  }
}

function openRestaurantDialog(restaurant = null) {
  restaurantForm.reset();
  restaurantIdInput.value = restaurant?._id || '';

  const editing = Boolean(restaurant);
  document.querySelector('#form-eyebrow').textContent = editing ? 'Update a document' : 'Create a document';
  document.querySelector('#form-title').textContent = editing ? `Edit ${restaurant.name}` : 'Add a restaurant';
  document.querySelector('#form-description').textContent = editing
    ? 'Update the selected MongoDB document and save your changes.'
    : 'Enter the historical details for a defunct fast-food chain.';
  saveButton.textContent = editing ? 'Save changes' : 'Save restaurant';

  if (restaurant) {
    const fields = ['name', 'foundedYear', 'closedYear', 'headquarters', 'country', 'peakLocations', 'closureReason', 'history'];
    for (const field of fields) {
      restaurantForm.elements[field].value = restaurant[field] ?? '';
    }
    restaurantForm.elements.signatureItems.value = restaurant.signatureItems?.join(', ') || '';
  }

  dialog.showModal();
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => restaurantForm.elements.name.focus());
}

function closeRestaurantDialog() {
  if (dialog.open) dialog.close();
  document.body.classList.remove('modal-open');
}

function resetFilters() {
  filterForm.reset();
  loadRestaurants();
}

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadRestaurants();
});

restaurantForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(restaurantForm);
  const payload = Object.fromEntries(formData.entries());
  const id = payload.restaurantId;
  delete payload.restaurantId;

  payload.foundedYear = Number(payload.foundedYear);
  payload.closedYear = Number(payload.closedYear);
  payload.peakLocations = payload.peakLocations ? Number(payload.peakLocations) : undefined;
  payload.signatureItems = payload.signatureItems
    ? payload.signatureItems.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  saveButton.disabled = true;
  saveButton.textContent = id ? 'Saving changes…' : 'Saving…';

  try {
    await request(id ? `/api/restaurants/${id}` : '/api/restaurants', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(payload)
    });
    closeRestaurantDialog();
    showToast(`${payload.name} was ${id ? 'updated' : 'added'} successfully.`);
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = id ? 'Save changes' : 'Save restaurant';
  }
});

for (const buttonId of ['open-create-button', 'hero-create-button', 'section-create-button']) {
  document.querySelector(`#${buttonId}`).addEventListener('click', () => openRestaurantDialog());
}

document.querySelector('#close-dialog-button').addEventListener('click', closeRestaurantDialog);
document.querySelector('#cancel-dialog-button').addEventListener('click', closeRestaurantDialog);
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) closeRestaurantDialog();
});

resetFiltersButton.addEventListener('click', resetFilters);
refreshButton.addEventListener('click', refreshAll);

let searchTimer;
filterForm.elements.search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadRestaurants, 350);
});

refreshAll();
