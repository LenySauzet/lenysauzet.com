const SCROLL_LOCK = 'data-scroll-locked';
const CAL_MODAL = 'cal-modal-box';
const CAL_STATE = 'state';
const CAL_CLOSED = 'closed';

const isCovered = () =>
  document.body.hasAttribute(SCROLL_LOCK) ||
  [...document.querySelectorAll(CAL_MODAL)].some((modal) => modal.getAttribute(CAL_STATE) !== CAL_CLOSED);

export function watchOverlays(onChange: (covered: boolean) => void) {
  let covered = isCovered();
  const watched = new WeakSet<Element>();

  const check = () => {
    const next = isCovered();
    if (next !== covered) onChange((covered = next));
  };

  const modals = new MutationObserver(check);
  const page = new MutationObserver(() => {
    for (const modal of document.querySelectorAll(CAL_MODAL)) {
      if (watched.has(modal)) continue;
      watched.add(modal);
      modals.observe(modal, { attributes: true, attributeFilter: [CAL_STATE] });
    }
    check();
  });
  page.observe(document.body, { attributes: true, attributeFilter: [SCROLL_LOCK], childList: true });

  if (covered) onChange(covered);
  return () => {
    page.disconnect();
    modals.disconnect();
  };
}
