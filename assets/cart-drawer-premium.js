if (!customElements.get('cart-drawer-premium-upsells')) {
  class CartDrawerPremiumUpsells extends HTMLElement {
    connectedCallback() {
      this.translations = {
        add: this.dataset.textAdd,
        adding: this.dataset.textAdding,
        added: this.dataset.textAdded,
        unavailable: this.dataset.textUnavailable,
        error: this.dataset.textError,
        expand: this.dataset.textExpand,
        collapse: this.dataset.textCollapse
      };

      this.querySelectorAll('.cart-drawer-premium-upsell__card').forEach((card) => {
        this.initializeCard(card);
      });

      this.initializeAlternatives();
    }

    initializeAlternatives() {
      const toggle = this.querySelector('[data-upsell-toggle]');
      const list = this.querySelector('[data-upsell-list]');

      if (!toggle || !list) return;

      this.updateAlternativesToggle(toggle, false);

      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        const willExpand = !isExpanded;

        toggle.setAttribute('aria-expanded', String(willExpand));
        list.classList.toggle('is-expanded', willExpand);
        this.updateAlternativesToggle(toggle, willExpand);

        if (willExpand) {
          requestAnimationFrame(() => {
            list.scrollTo({ left: 0, top: 0, behavior: 'auto' });
          });
        }
      });
    }

    updateAlternativesToggle(toggle, isExpanded) {
      const label = toggle.querySelector('[data-upsell-toggle-label]');

      if (label) label.textContent = isExpanded ? this.translations.collapse : this.translations.expand;
    }

    initializeCard(card) {
      const variantsElement = card.querySelector('[data-upsell-variants]');

      if (!variantsElement) return;

      try {
        card.variants = JSON.parse(variantsElement.textContent);
      } catch (error) {
        this.showError(card, this.translations.error);
        return;
      }

      card.selects = Array.from(card.querySelectorAll('[data-option-position]')).sort(
        (first, second) => Number(first.dataset.optionPosition) - Number(second.dataset.optionPosition)
      );
      card.addButton = card.querySelector('[data-upsell-add]');

      card.selects.forEach((select) => {
        const preferredValue = select.dataset.optionType === 'size'
          ? this.dataset.preferredSize
            : select.dataset.optionType === 'height'
              ? this.dataset.preferredHeight
              : '';

        if (!preferredValue) return;

        const preferredOption = Array.from(select.options).find((option) => option.value === preferredValue);

        if (preferredOption) select.value = preferredOption.value;
      });

      card.selects.forEach((select) => {
        select.addEventListener('change', () => this.resolveVariant(card));
      });

      if (card.addButton) {
        card.addButton.addEventListener('click', () => this.addUpsell(card));
      }

      this.resolveVariant(card, true);
    }

    resolveVariant(card, allowFallback = false) {
      const selectedOptions = card.selects.map((select) => select.value);
      const hasSize = card.selects.some((select) => select.dataset.optionType === 'size');
      const hasHeight = card.selects.some((select) => select.dataset.optionType === 'height');
      let selectedVariant = card.variants.find(
        (variant) => variant.available && this.optionsMatch(variant.options, selectedOptions)
      );

      if (!selectedVariant && allowFallback) {
        selectedVariant = card.variants
          .filter((variant) => variant.available)
          .map((variant) => ({
            variant,
            score: variant.options.reduce(
              (total, option, index) => total + (option === selectedOptions[index] ? 1 : 0),
              0
            )
          }))
          .sort((first, second) => second.score - first.score)[0]?.variant;

        if (selectedVariant) {
          card.selects.forEach((select, index) => {
            select.value = selectedVariant.options[index];
          });
        }
      }

      card.selectedVariant = selectedVariant || null;
      this.hideError(card);

      if (!hasSize || !hasHeight) {
        this.setButtonAvailability(card, false, this.translations.unavailable);
        this.showError(card, this.translations.unavailable);
        return;
      }

      if (!selectedVariant) {
        this.setButtonAvailability(card, false, this.translations.unavailable);
        return;
      }

      this.setButtonAvailability(card, true, this.translations.add);
    }

    optionsMatch(variantOptions, selectedOptions) {
      return variantOptions.length === selectedOptions.length && variantOptions.every(
        (option, index) => String(option) === String(selectedOptions[index])
      );
    }

    setButtonAvailability(card, isAvailable, label) {
      if (!card.addButton) return;

      card.addButton.disabled = !isAvailable;
      const labelElement = card.addButton.querySelector('[data-upsell-button-label]');
      if (labelElement) labelElement.textContent = label;
    }

    setLoading(card, isLoading) {
      if (!card.addButton) return;

      const label = card.addButton.querySelector('[data-upsell-button-label]');
      const spinner = card.addButton.querySelector('.loading-overlay__spinner');

      card.addButton.disabled = isLoading;
      card.addButton.setAttribute('aria-busy', String(isLoading));
      if (label && isLoading) label.textContent = this.translations.adding;
      if (spinner) spinner.classList.toggle('hidden', !isLoading);
    }

    async addUpsell(card) {
      if (!card.selectedVariant || !card.addButton) return;

      this.hideError(card);
      this.setLoading(card, true);

      try {
        const response = await fetch(window.routes?.cart_add_url || '/cart/add.js', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            items: [{ id: card.selectedVariant.id, quantity: 1 }],
            sections: ['cart-drawer', 'cart-icon-bubble'],
            sections_url: window.location.pathname
          })
        });
        const state = await response.json();

        if (!response.ok || state.status) {
          throw new Error(state.description || state.message || this.translations.error);
        }

        this.setButtonAvailability(card, true, this.translations.added);
        this.renderCartSections(state);
      } catch (error) {
        this.showError(card, error.message || this.translations.error);
        this.setLoading(card, false);
        this.resolveVariant(card);
      }
    }

    renderCartSections(state) {
      const cartDrawer = document.querySelector('cart-drawer');

      if (!state.sections?.['cart-drawer'] || !state.sections?.['cart-icon-bubble']) {
        throw new Error(this.translations.error);
      }

      if (cartDrawer && typeof cartDrawer.renderContents === 'function') {
        cartDrawer.classList.remove('is-empty');
        cartDrawer.renderContents(state);
        return;
      }

      const parser = new DOMParser();
      const drawerDocument = parser.parseFromString(state.sections['cart-drawer'], 'text/html');
      const bubbleDocument = parser.parseFromString(state.sections['cart-icon-bubble'], 'text/html');
      const currentDrawer = document.getElementById('CartDrawer');
      const incomingDrawer = drawerDocument.getElementById('CartDrawer');
      const currentBubble = document.getElementById('cart-icon-bubble');
      const incomingBubbleSection = bubbleDocument.querySelector('.shopify-section');

      if (!cartDrawer || !currentDrawer || !incomingDrawer || !currentBubble || !incomingBubbleSection) {
        throw new Error(this.translations.error);
      }

      currentDrawer.innerHTML = incomingDrawer.innerHTML;
      currentBubble.innerHTML = incomingBubbleSection.innerHTML;
      cartDrawer.classList.remove('is-empty');
      cartDrawer.classList.add('animate', 'active');
      document.body.classList.add('overflow-hidden');
    }

    showError(card, message) {
      const errorElement = card.querySelector('[data-upsell-error]');
      if (!errorElement) return;

      errorElement.textContent = message;
      errorElement.hidden = false;
    }

    hideError(card) {
      const errorElement = card.querySelector('[data-upsell-error]');
      if (!errorElement) return;

      errorElement.textContent = '';
      errorElement.hidden = true;
    }
  }

  customElements.define('cart-drawer-premium-upsells', CartDrawerPremiumUpsells);
}
