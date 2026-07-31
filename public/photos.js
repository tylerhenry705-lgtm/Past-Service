(() => {
  const dialog = document.querySelector('#photo-lightbox');
  if (!dialog) return;

  const image = document.querySelector('#lightbox-image');
  const title = document.querySelector('#lightbox-title');
  const copy = document.querySelector('#lightbox-copy');
  const source = document.querySelector('#lightbox-source');
  const closeButton = document.querySelector('#lightbox-close');
  const previousButton = document.querySelector('#lightbox-prev');
  const nextButton = document.querySelector('#lightbox-next');
  const cards = [...document.querySelectorAll('.archive-photo-card')];
  let activeIndex = 0;

  function showPhoto(index) {
    activeIndex = (index + cards.length) % cards.length;
    const card = cards[activeIndex];
    const cardImage = card.querySelector('img');
    const cardTitle = card.querySelector('figcaption strong');
    const cardCopy = card.querySelector('figcaption span');
    const cardSource = card.querySelector('figcaption a');

    image.src = cardImage.src;
    image.alt = cardImage.alt;
    title.textContent = cardTitle?.textContent || 'Archive image';
    copy.textContent = cardCopy?.textContent || '';

    if (cardSource) {
      source.hidden = false;
      source.href = cardSource.href;
    } else {
      source.hidden = true;
      source.removeAttribute('href');
    }
  }

  cards.forEach((card, index) => {
    card.querySelector('.photo-open')?.addEventListener('click', () => {
      showPhoto(index);
      dialog.showModal();
      document.body.classList.add('modal-open');
    });
  });

  function closeLightbox() {
    if (dialog.open) dialog.close();
    document.body.classList.remove('modal-open');
  }

  closeButton?.addEventListener('click', closeLightbox);
  previousButton?.addEventListener('click', () => showPhoto(activeIndex - 1));
  nextButton?.addEventListener('click', () => showPhoto(activeIndex + 1));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeLightbox();
  });
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  document.addEventListener('keydown', (event) => {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') showPhoto(activeIndex - 1);
    if (event.key === 'ArrowRight') showPhoto(activeIndex + 1);
  });
})();
