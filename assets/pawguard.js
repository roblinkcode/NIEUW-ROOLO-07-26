(() => {
  // Display labels only. Shopify option values, variant IDs and native image/price updates stay intact.
  const labels = new Map([
    ['Zwart', 'Volledig Zwart'],
    ['Zwart / Oranje rand', 'Zwart / Oranje Rand'],
    ['Zwart / Oranje clips', 'Zwart / Oranje Bevestigingen'],
  ]);
  function updateLabels() {
    const marker = document.getElementById('pawguard-page');
    if (!marker) return;
    const root = marker.closest('[id^="MainProduct-"]');
    if (!root) return;
    const stickyTitle = root.querySelector('.sticky-atc__title');
    if (stickyTitle) stickyTitle.textContent = 'ROOLO PawGuard';
    root.querySelectorAll('.product-form__input input[type="radio"]').forEach(input => {
      const label = labels.get(input.value);
      const element = input.nextElementSibling;
      if (!label || element?.tagName !== 'LABEL') return;
      // Preserve the screen-reader sold-out message and the label's for attribute.
      const text = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
      if (text && text.textContent.trim() !== label) text.textContent = label + ' ';
    });
    root.querySelectorAll('.sticky-atc option').forEach(option => {
      const label = labels.get(option.textContent.trim());
      if (label) option.textContent = label;
    });
  }
  if (!window.pawguardLabelsInitialized) {
    window.pawguardLabelsInitialized = true;
    document.addEventListener('shopify:section:load', updateLabels);
    const initialize = () => {
      updateLabels();
      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        subscribe(PUB_SUB_EVENTS.variantChange, updateLabels);
      }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
  }
  updateLabels();

  if (!customElements.get('pawguard-installments')) {
    customElements.define('pawguard-installments', class extends HTMLElement {
      connectedCallback() {
        this.amounts = JSON.parse(this.querySelector('script[type="application/json"]').textContent);
        this.update(this.dataset.variant);
        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
            if (data.sectionId === this.dataset.section) this.update(data.variant?.id);
          });
        }
      }
      update(id) {
        const amount = this.amounts[id];
        this.hidden = !amount;
        if (amount) this.querySelector('[data-installment]').textContent = amount;
      }
      disconnectedCallback() { this.unsubscribe?.(); }
    });
  }
})();
