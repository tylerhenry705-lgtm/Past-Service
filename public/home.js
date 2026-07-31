const heroRecordCount = document.querySelector('#hero-record-count');

async function loadHomeCount() {
  try {
    const response = await fetch('/api/restaurants/stats/summary');
    if (!response.ok) throw new Error('Unable to read database summary.');
    const data = await response.json();
    const count = Number(data?.totals?.restaurantCount || 0);
    heroRecordCount.textContent = `${count.toLocaleString()} restaurant ${count === 1 ? 'record' : 'records'} in MongoDB`;
  } catch {
    heroRecordCount.textContent = 'MongoDB-powered historical collection';
  }
}

loadHomeCount();
