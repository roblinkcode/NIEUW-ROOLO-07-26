(() => {
  const labels = new Map([
    ['Zwart', 'Volledig Zwart'],
    ['Zwart / Oranje rand', 'Zwart / Oranje Rand'],
    ['Zwart / Oranje clips', 'Zwart / Oranje Bevestigingen'],
  ]);

  if (!customElements.get('pawguard-controller')) {
    customElements.define('pawguard-controller', class extends HTMLElement {
      connectedCallback() {
        this.root = this.closest('[id^="MainProduct-"]');
        if (!this.root) return;
        this.updateLabels = () => {
          const stickyTitle = this.root.querySelector('.sticky-atc__title');
          if (stickyTitle) stickyTitle.textContent = 'ROOLO PawGuard';
          this.root.querySelectorAll('.product-form__input input[type="radio"]').forEach(input => {
            const name = labels.get(input.value);
            const label = input.nextElementSibling;
            if (!name || label?.tagName !== 'LABEL') return;
            const text = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (text && text.textContent.trim() !== name) text.textContent = name + ' ';
          });
          this.root.querySelectorAll('.sticky-atc option').forEach(option => {
            const name = labels.get(option.textContent.trim());
            if (name) option.textContent = name;
          });
        };
        this.updateLabels();
        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
            if (data.sectionId === this.dataset.section) this.updateLabels();
          });
        }
        // Keep the native sticky element and scroll/variant behavior. Its legacy click
        // listener calls missing productForm.handleSubmit; submit the SAME native form.
        this.onStickyClick = event => {
          const button = event.target.closest('.sticky-atc button.main-product-atc');
          if (!button || !this.root.contains(button)) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          const form = document.getElementById(button.getAttribute('form'));
          const submitter = form?.querySelector('[type="submit"]');
          if (!form || !submitter || button.disabled || submitter.disabled || submitter.getAttribute('aria-disabled') === 'true') return;
          form.requestSubmit(submitter);
        };
        this.root.addEventListener('click', this.onStickyClick, true);
      }
      disconnectedCallback() {
        this.unsubscribe?.();
        this.root?.removeEventListener('click', this.onStickyClick, true);
      }
    });
  }

  if (!customElements.get('pawguard-installments')) {
    customElements.define('pawguard-installments', class extends HTMLElement {
      static total(variants, lines, percentageLeft = 1, fixedDiscount = 0) {
        if (!Number.isFinite(percentageLeft) || percentageLeft < 0 || percentageLeft > 1 || !Number.isFinite(fixedDiscount) || fixedDiscount < 0 || !lines.length) return null;
        let total = 0;
        for (const line of lines) {
          const variant = variants[String(line.id)];
          const quantity = Number(line.quantity);
          if (!variant || !Number.isSafeInteger(quantity) || quantity < 1 || !Number.isFinite(variant.price)) return null;
          let unit = variant.price;
          let threshold = 0;
          for (const tier of variant.breaks || []) {
            if (quantity >= tier.minimum && tier.minimum >= threshold && Number.isFinite(tier.price)) {
              unit = tier.price;
              threshold = tier.minimum;
            }
          }
          total += unit * quantity;
        }
        return Math.max(0, Math.round(total * percentageLeft - fixedDiscount));
      }
      connectedCallback() {
        this.root = this.closest('[id^="MainProduct-"]');
        if (!this.root) return;
        this.variants = JSON.parse(this.querySelector('script[type="application/json"]').textContent);
        this.variantId = this.dataset.variant;
        this.money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: this.dataset.currency });
        this.update = this.update.bind(this);
        this.onInput = event => {
          if (event.target.matches('[name="quantity"], [name="id"], select, input[type="radio"]')) this.update();
        };
        this.root.addEventListener('input', this.onInput);
        this.root.addEventListener('change', this.onInput);
        this.unsubscribers = [];
        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.unsubscribers.push(subscribe(PUB_SUB_EVENTS.variantChange, ({ data }) => {
            if (data.sectionId !== this.dataset.section) return;
            this.variantId = data.variant?.id;
            // Shopify section responses carry current contextual prices and quantity rules.
            const refreshed = data.html?.querySelector('pawguard-installments script[type="application/json"]');
            if (refreshed) this.variants = JSON.parse(refreshed.textContent);
            if (data.variant && this.variants[String(data.variant.id)]) this.variants[String(data.variant.id)].price = data.variant.price;
            this.update();
          }));
          this.unsubscribers.push(subscribe(PUB_SUB_EVENTS.quantityUpdate, this.update));
        }
        this.update();
      }
      selection() {
        const bundles = this.root.querySelector('bundle-deals');
        if (bundles?.formVariants?.length) {
          return { lines: bundles.formVariants, percentageLeft: Number(bundles.dataset.percentageLeft), fixedDiscount: Number(bundles.dataset.fixedDiscount) };
        }
        const breaks = this.root.querySelector('quantity-breaks');
        const selected = breaks?.querySelector('input[name="quantity"]:checked');
        if (selected) {
          const label = selected.nextElementSibling;
          return {
            lines: breaks.formVariants?.length ? breaks.formVariants : [{ id: this.variantId, quantity: Number(selected.value) }],
            percentageLeft: Number(label.dataset.percentageLeft),
            fixedDiscount: Number(label.dataset.fixedDiscount),
          };
        }
        const form = document.getElementById(`product-form-${this.dataset.section}`);
        const input = form?.elements.namedItem('quantity');
        const quantity = input ? Number(input.value) : this.variants[String(this.variantId)]?.minimum || 1;
        return { lines: [{ id: this.variantId, quantity }], percentageLeft: 1, fixedDiscount: 0 };
      }
      update() {
        const selection = this.selection();
        const total = this.constructor.total(this.variants, selection.lines, selection.percentageLeft, selection.fixedDiscount);
        this.hidden = total === null || total <= 0;
        if (!this.hidden) this.querySelector('[data-installment]').textContent = this.money.format(total / 300);
      }
      disconnectedCallback() {
        this.root?.removeEventListener('input', this.onInput);
        this.root?.removeEventListener('change', this.onInput);
        this.unsubscribers?.forEach(unsubscribe => unsubscribe());
      }
    });
  }
})();
