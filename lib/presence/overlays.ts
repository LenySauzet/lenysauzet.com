const SCROLL_LOCK = 'data-scroll-locked';
const CAL_MODAL = 'cal-modal-box';
const CAL_STATE = 'state';
const CAL_CLOSED = 'closed';

const isOpen = (modal: Element) =>
  modal.getAttribute(CAL_STATE) !== CAL_CLOSED &&
  !(modal instanceof HTMLElement && modal.style.visibility === 'hidden');

const isCovered = () =>
  document.body.hasAttribute(SCROLL_LOCK) || [...document.querySelectorAll(CAL_MODAL)].some(isOpen);

export function watchOverlays(onChange: (covered: boolean) => void) {
  let covered = isCovered();
  const watched = new WeakSet<Element>();

  const check = () => {
    const next = isCovered();
    if (next !== covered) onChange((covered = next));
  };

  const modals = new MutationObserver(check);
  const watchModals = () => {
    for (const modal of document.querySelectorAll(CAL_MODAL)) {
      if (watched.has(modal)) continue;
      watched.add(modal);
      modals.observe(modal, { attributes: true, attributeFilter: [CAL_STATE, 'style'] });
    }
  };
  const page = new MutationObserver(() => {
    watchModals();
    check();
  });
  page.observe(document.body, { attributes: true, attributeFilter: [SCROLL_LOCK], childList: true });
  watchModals();

  if (covered) onChange(covered);
  return () => {
    page.disconnect();
    modals.disconnect();
  };
}
