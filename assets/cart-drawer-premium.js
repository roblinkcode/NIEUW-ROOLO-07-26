if (!customElements.get('cart-drawer-premium-upsells')) {
  class CartDrawerPremiumUpsells extends HTMLElement {
    connectedCallback() {
      this.initialize();
    }

    initialize() {
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

      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      list.classList.toggle('is-expanded', isExpanded);
      this.updateAlternativesToggle(toggle, isExpanded);

      if (toggle.dataset.premiumInitialized === 'true') return;
      toggle.dataset.premiumInitialized = 'true';

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

      if (card.dataset.premiumInitialized === 'true') {
        this.resolveVariant(card);
        return;
      }

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

      card.dataset.premiumInitialized = 'true';
      this.resolveVariant(card, true);
    }

    resetTransientState() {
      this.querySelectorAll('.cart-drawer-premium-upsell__card').forEach((card) => {
        this.initializeCard(card);
        this.hideError(card);
        this.setLoading(card, false);
        this.resolveVariant(card, true);
      });
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
      card.addButton.classList.toggle('loading', isLoading);
      if (isLoading) {
        card.addButton.setAttribute('aria-busy', 'true');
      } else {
        card.addButton.removeAttribute('aria-busy');
      }
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
        requestAnimationFrame(() => window.CartDrawerPremiumStability?.initialize());
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
      window.CartDrawerPremiumStability?.initialize();
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

(() => {
  if (window.CartDrawerPremiumStability) {
    window.CartDrawerPremiumStability.initialize();
    return;
  }

  const checkoutContents = new WeakMap();
  const drawersBeingRestored = new WeakSet();
  const drawerOpenStorageKey = 'premiumCartDrawerRestoreOpen';
  const documentLockClasses = [
    'overflow-hidden',
    'cart-drawer-open',
    'drawer-open',
    'is-drawer-open',
    'no-scroll',
    'scroll-locked'
  ];
  const drawerStateClasses = [
    'active',
    'animate',
    'open',
    'opening',
    'is-open',
    'drawer--open',
    'loading',
    'is-loading'
  ];
  const interactionStyleProperties = [
    'cursor',
    'opacity',
    'pointer-events',
    'visibility'
  ];
  const layoutStyleProperties = [
    'align-items',
    'column-gap',
    'display',
    'flex',
    'flex-basis',
    'flex-grow',
    'flex-shrink',
    'gap',
    'grid',
    'grid-area',
    'grid-auto-columns',
    'grid-auto-flow',
    'grid-auto-rows',
    'grid-column',
    'grid-column-end',
    'grid-column-start',
    'grid-row',
    'grid-row-end',
    'grid-row-start',
    'grid-template',
    'grid-template-areas',
    'grid-template-columns',
    'grid-template-rows',
    'inline-size',
    'justify-content',
    'max-width',
    'max-inline-size',
    'min-width',
    'min-inline-size',
    'order',
    'overflow-wrap',
    'row-gap',
    'white-space',
    'width',
    'word-break'
  ];
  const layoutSelector = [
    '.drawer__inner',
    '.cart-drawer__body',
    '.cart-drawer-item',
    '.cart-item__media',
    '.cart-drawer-item__right',
    '.cart-drawer-item__details-and-delete-btn',
    '.cart-item__details',
    '.cart-item__name',
    '.product-option',
    '.cart-drawer-item__quantity-and-prices',
    '.cart-item__quantity',
    '.cart-item__totals'
  ].join(',');
  let observedDrawer = null;
  let drawerObserver = null;
  let refreshRequest = null;
  let historyRestoreRequest = null;
  let initializeFrame = null;

  function getCartDrawer() {
    return document.querySelector('cart-drawer');
  }

  function removeInlineProperties(element, properties) {
    if (!element) return;
    properties.forEach((property) => element.style.removeProperty(property));
  }

  function clearDocumentLocks() {
    [document.documentElement, document.body].forEach((element) => {
      if (!element) return;
      element.classList.remove(...documentLockClasses);
      removeInlineProperties(element, [
        'overflow',
        'overflow-x',
        'overflow-y',
        'pointer-events',
        'touch-action'
      ]);
    });
  }

  function resetElementInteraction(element, enable = false) {
    if (!element) return;

    element.classList.remove('loading', 'is-loading', 'loading-active', 'pointer-events--none');
    element.removeAttribute('aria-busy');
    element.removeAttribute('aria-disabled');
    element.removeAttribute('data-loading');
    element.removeAttribute('inert');
    removeInlineProperties(element, interactionStyleProperties);

    if (enable) {
      element.classList.remove('disabled');
      element.removeAttribute('disabled');
      element.disabled = false;
    }
  }

  function ensurePremiumStylesheet(cartDrawer) {
    const stylesheetUrl = cartDrawer?.dataset.premiumStylesheet;
    if (!stylesheetUrl) return;

    const absoluteUrl = new URL(stylesheetUrl, window.location.href).href;
    const stylesheet = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .find((link) => link.href === absoluteUrl);

    if (stylesheet) {
      stylesheet.disabled = false;
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = absoluteUrl;
    link.dataset.premiumCartDrawerStylesheet = 'true';
    document.head.appendChild(link);
  }

  function resetCheckout(cartDrawer) {
    const checkoutButton = cartDrawer.querySelector('[data-premium-checkout]');
    const cartForm = cartDrawer.querySelector('#CartDrawer-Form');
    if (!checkoutButton || !cartForm) return;

    if (!checkoutContents.has(checkoutButton)) {
      checkoutContents.set(checkoutButton, checkoutButton.innerHTML);
    } else if (checkoutButton.innerHTML !== checkoutContents.get(checkoutButton)) {
      checkoutButton.innerHTML = checkoutContents.get(checkoutButton);
    }

    resetElementInteraction(checkoutButton, true);
    checkoutButton.setAttribute('type', 'submit');
    checkoutButton.setAttribute('name', 'checkout');
    checkoutButton.setAttribute('form', cartForm.id);
    checkoutButton.removeAttribute('tabindex');

    const label = checkoutButton.querySelector('.button__label');
    if (label) {
      label.classList.remove('hidden');
      label.removeAttribute('aria-hidden');
      removeInlineProperties(label, interactionStyleProperties);
    }

    checkoutButton.querySelectorAll(
      '.spinner, [class*="spinner"], [data-loading-spinner], .button__spinner, .loading__spinner'
    ).forEach((spinner) => {
      spinner.classList.add('hidden');
      spinner.setAttribute('aria-hidden', 'true');
      removeInlineProperties(spinner, interactionStyleProperties);
    });

    checkoutButton.disabled = cartDrawer.classList.contains('is-empty');
  }

  function resetLayoutStyles(cartDrawer) {
    [cartDrawer, ...cartDrawer.querySelectorAll(layoutSelector)].forEach((element) => {
      removeInlineProperties(element, layoutStyleProperties);
    });
  }

  function synchronizeCartState(cartDrawer) {
    const hasCartItems = Boolean(cartDrawer.querySelector('.cart-drawer-item'));
    const emptyStates = Array.from(cartDrawer.querySelectorAll('.drawer__inner-empty'));

    if (hasCartItems) {
      emptyStates.forEach((emptyState) => emptyState.remove());
      cartDrawer.classList.remove('is-empty');
      return;
    }

    if (emptyStates.length > 0) cartDrawer.classList.add('is-empty');
  }

  function storeDrawerOpenState(isOpen) {
    try {
      window.sessionStorage.setItem(drawerOpenStorageKey, String(isOpen));
    } catch (error) {
      // History restoration still works; only the open-state preference is lost.
    }
  }

  function takeStoredDrawerOpenState() {
    try {
      const shouldOpen = window.sessionStorage.getItem(drawerOpenStorageKey) === 'true';
      window.sessionStorage.removeItem(drawerOpenStorageKey);
      return shouldOpen;
    } catch (error) {
      return false;
    }
  }

  function clearStoredDrawerOpenState() {
    try {
      window.sessionStorage.removeItem(drawerOpenStorageKey);
    } catch (error) {
      // sessionStorage can be unavailable in restricted browser contexts.
    }
  }

  function closeCartDrawer(cartDrawer) {
    if (typeof cartDrawer.close === 'function') {
      try {
        cartDrawer.close();
      } catch (error) {
        // The explicit cleanup below is sufficient when a third-party focus trap fails.
      }
    }

    const stateElements = [
      cartDrawer,
      cartDrawer.querySelector('#CartDrawer'),
      ...cartDrawer.querySelectorAll('.drawer__inner, .cart-drawer__overlay')
    ].filter(Boolean);

    stateElements.forEach((element) => {
      element.classList.remove(...drawerStateClasses);
      element.removeAttribute('open');
      element.removeAttribute('aria-busy');
      removeInlineProperties(element, interactionStyleProperties);
    });

    clearDocumentLocks();
  }

  function resetCartDrawerState({ closeDrawer = false } = {}) {
    const cartDrawer = getCartDrawer();
    if (!cartDrawer) {
      if (closeDrawer) clearDocumentLocks();
      return;
    }

    ensurePremiumStylesheet(cartDrawer);
    if (closeDrawer) closeCartDrawer(cartDrawer);
    cartDrawer.classList.add('cart-drawer-premium');
    synchronizeCartState(cartDrawer);
    resetLayoutStyles(cartDrawer);
    cartDrawer.querySelectorAll('.cart__items--disabled').forEach((element) => {
      element.classList.remove('cart__items--disabled');
    });
    cartDrawer.querySelectorAll('.loading, .is-loading, .loading-active').forEach((element) => {
      element.classList.remove('loading', 'is-loading', 'loading-active');
    });
    cartDrawer.querySelectorAll('.pointer-events--none').forEach((element) => {
      element.classList.remove('pointer-events--none');
      removeInlineProperties(element, interactionStyleProperties);
    });
    cartDrawer.querySelectorAll('[aria-busy]').forEach((element) => element.removeAttribute('aria-busy'));
    cartDrawer.querySelectorAll('.loading-overlay, .loading-overlay__spinner').forEach((element) => {
      element.classList.add('hidden');
      element.setAttribute('aria-hidden', 'true');
    });
    cartDrawer.querySelectorAll('[data-upsell-add]').forEach((button) => {
      resetElementInteraction(button);
    });
    cartDrawer.querySelectorAll('cart-drawer-premium-upsells').forEach((upsells) => {
      if (typeof upsells.initialize === 'function') upsells.initialize();
      if (typeof upsells.resetTransientState === 'function') upsells.resetTransientState();
    });
    resetCheckout(cartDrawer);

    if (!cartDrawer.classList.contains('active')) {
      clearDocumentLocks();
    }
  }

  function scheduleInitialize() {
    if (initializeFrame) return;
    initializeFrame = requestAnimationFrame(() => {
      initializeFrame = null;
      initialize();
    });
  }

  function observeSectionRendering(cartDrawer) {
    if (!cartDrawer) return;
    if (observedDrawer === cartDrawer && drawerObserver) return;
    if (drawerObserver) drawerObserver.disconnect();

    observedDrawer = cartDrawer;
    drawerObserver = new MutationObserver((mutations) => {
      const sectionWasReplaced = mutations.some(({ target }) => (
        target.id === 'CartDrawer' || target.classList?.contains('drawer__inner')
      ));
      if (sectionWasReplaced) scheduleInitialize();
    });
    drawerObserver.observe(cartDrawer, { childList: true, subtree: true });
  }

  function initialize() {
    const cartDrawer = getCartDrawer();
    if (!cartDrawer) return;

    resetCartDrawerState();
    observeSectionRendering(cartDrawer);
  }

  function replaceRenderedSections(sections) {
    const currentCartDrawers = Array.from(document.querySelectorAll('cart-drawer'));
    const cartDrawer = currentCartDrawers[0];
    const currentBubble = document.getElementById('cart-icon-bubble');
    if (!cartDrawer || !currentBubble) return false;

    const parser = new DOMParser();
    const drawerDocument = parser.parseFromString(sections['cart-drawer'], 'text/html');
    const bubbleDocument = parser.parseFromString(sections['cart-icon-bubble'], 'text/html');
    const currentDrawerSection = cartDrawer.closest('.shopify-section');
    const incomingDrawerSection = drawerDocument.querySelector('.shopify-section');
    const incomingCartDrawer = drawerDocument.querySelector('cart-drawer');
    const incomingBubbleSection = bubbleDocument.querySelector('.shopify-section');
    if (!incomingCartDrawer || !incomingBubbleSection) return false;

    incomingCartDrawer.classList.remove(...drawerStateClasses);
    incomingCartDrawer.classList.add('cart-drawer-premium');

    const incomingBubble = currentBubble.cloneNode(false);
    incomingBubble.innerHTML = incomingBubbleSection.innerHTML;

    if (drawerObserver) drawerObserver.disconnect();
    drawerObserver = null;
    observedDrawer = null;

    currentCartDrawers.slice(1).forEach((duplicateDrawer) => duplicateDrawer.remove());
    currentBubble.replaceWith(incomingBubble);
    if (currentDrawerSection && incomingDrawerSection) {
      currentDrawerSection.replaceWith(incomingDrawerSection);
    } else {
      cartDrawer.replaceWith(incomingCartDrawer);
    }

    initialize();
    return true;
  }

  function restoreDrawerOpenState(shouldOpen) {
    const cartDrawer = getCartDrawer();
    if (!cartDrawer) return;

    if (!shouldOpen) {
      closeCartDrawer(cartDrawer);
      return;
    }

    if (cartDrawer.classList.contains('active') || drawersBeingRestored.has(cartDrawer)) return;
    drawersBeingRestored.add(cartDrawer);

    if (typeof cartDrawer.open === 'function') {
      cartDrawer.open();
    } else {
      cartDrawer.classList.add('animate', 'active');
      document.body.classList.add('overflow-hidden');
    }

    setTimeout(() => drawersBeingRestored.delete(cartDrawer), 250);
  }

  async function refreshFromSections() {
    if (refreshRequest) return refreshRequest;

    const url = new URL(window.location.href);
    url.searchParams.set('sections', 'cart-drawer,cart-icon-bubble');

    refreshRequest = fetch(url.toString(), {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Section rendering failed: ${response.status}`);
        return response.json();
      })
      .then((sections) => {
        if (!sections?.['cart-drawer'] || !sections?.['cart-icon-bubble']) return false;
        return replaceRenderedSections(sections);
      })
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });

    return refreshRequest;
  }

  function handlePageHide() {
    const cartDrawer = getCartDrawer();
    storeDrawerOpenState(Boolean(cartDrawer?.classList.contains('active')));
    resetCartDrawerState({ closeDrawer: true });
  }

  function handlePageShow(event) {
    const navigationEntry = performance.getEntriesByType?.('navigation')?.[0];
    const restoredFromHistory = event.persisted || navigationEntry?.type === 'back_forward';

    if (!restoredFromHistory) {
      clearStoredDrawerOpenState();
      resetCartDrawerState();
      observeSectionRendering(getCartDrawer());
      return;
    }

    if (historyRestoreRequest) return;

    const shouldRestoreOpen = takeStoredDrawerOpenState();
    resetCartDrawerState({ closeDrawer: true });
    observeSectionRendering(getCartDrawer());

    historyRestoreRequest = refreshFromSections()
      .finally(() => {
        resetCartDrawerState();
        restoreDrawerOpenState(shouldRestoreOpen);
      })
      .finally(() => {
        historyRestoreRequest = null;
      });
  }

  window.CartDrawerPremiumStability = {
    initialize,
    resetCartDrawerState,
    refreshFromSections
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('pageshow', handlePageShow);
  document.addEventListener('shopify:section:load', initialize);
})();
