const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const classes = new Map();
const subscribers = new Map();
const forms = new Map();
const sandbox = {
  HTMLElement: class {}, Node: { TEXT_NODE: 3 }, Intl,
  customElements: { get: name => classes.get(name), define: (name, value) => classes.set(name, value) },
  document: { getElementById: id => forms.get(id) },
  PUB_SUB_EVENTS: { variantChange: 'variant', quantityUpdate: 'quantity' },
  subscribe: (event, callback) => {
    const callbacks = subscribers.get(event) || new Set();
    callbacks.add(callback); subscribers.set(event, callbacks);
    return () => callbacks.delete(callback);
  },
};
vm.runInNewContext(fs.readFileSync('assets/pawguard.js', 'utf8'), sandbox);
const emit = (type, data) => subscribers.get(type)?.forEach(callback => callback(data));
const Installments = classes.get('pawguard-installments');
const variants = { 1: { price: 5995, minimum: 1 }, 2: { price: 9000, minimum: 1 }, 3: { price: 5995, minimum: 1, breaks: [{ minimum: 3, price: 4995 }, { minimum: 2, price: 5495 }] } };
const amount = quantity => Installments.total(variants, [{ id: 1, quantity }]);
const format = total => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(total / 300).replace(/\s/g, ' ');
assert.deepEqual([1, 2, 3].map(n => format(amount(n))), ['€ 19,98', '€ 39,97', '€ 59,95']);
assert.equal(Installments.total(variants, [{ id: 3, quantity: 3 }]), 14985, 'Highest applicable native tier, irrespective of order');
assert.equal(Installments.total(variants, [{ id: 1, quantity: 2 }], .9, 500), 10291, 'Theme 2-pack percentage and fixed discounts');
assert.equal(Installments.total(variants, [{ id: 1, quantity: 1 }, { id: 2, quantity: 1 }], .8, 0), 11996, 'Mixed-variant bundle');
assert.equal(Installments.total(variants, [{ id: 999, quantity: 1 }]), null);
assert.equal(Installments.total(variants, [{ id: 1, quantity: 0 }]), null);
assert.equal(Installments.total(variants, [{ id: 1, quantity: 1.5 }]), null);
assert.equal(Installments.total(variants, [{ id: 1, quantity: 1 }], 1, 99999), 0);
const listeners = new Map();
const root = { querySelector: () => null, querySelectorAll: () => [], addEventListener: (type, callback) => listeners.set(type, callback), removeEventListener: type => listeners.delete(type), contains: () => true };
const quantity = { value: '1' };
forms.set('product-form-test', { elements: { namedItem: () => quantity } });
const output = {};
const element = new Installments();
element.dataset = { section: 'test', variant: '1', currency: 'EUR' };
element.closest = () => root;
element.querySelector = selector => selector === '[data-installment]' ? output : { textContent: JSON.stringify(variants) };
element.connectedCallback();
assert.equal(output.textContent.replace(/\s/g, ' '), '€ 19,98');
quantity.value = '2'; listeners.get('input')({ target: { matches: () => true } });
assert.equal(output.textContent.replace(/\s/g, ' '), '€ 39,97');
emit('variant', { data: { sectionId: 'other', variant: { id: 2, price: 9000 } } });
assert.equal(output.textContent.replace(/\s/g, ' '), '€ 39,97', 'Other products do not affect amount');
emit('variant', { data: { sectionId: 'test', variant: { id: 2, price: 9000 } } });
assert.equal(output.textContent.replace(/\s/g, ' '), '€ 60,00');
emit('variant', { data: { sectionId: 'test', variant: undefined } });
assert.equal(element.hidden, true, 'Invalid variant hides stale installment');
element.disconnectedCallback();
assert.equal(subscribers.get('variant').size, 0);
assert.equal(listeners.size, 0);
const Controller = classes.get('pawguard-controller');
const controller = new Controller();
controller.dataset = { section: 'test' }; controller.closest = () => root;
let submissions = 0, stopped = 0;
const submitter = { disabled: false, getAttribute: () => 'false' };
const form = { querySelector: () => submitter, requestSubmit: button => { assert.equal(button, submitter); submissions++; } };
forms.set('product-form-test', form);
controller.connectedCallback();
const button = { disabled: false, getAttribute: () => 'product-form-test' };
const event = { target: { closest: () => button }, preventDefault() {}, stopImmediatePropagation() { stopped++; } };
listeners.get('click')(event);
assert.equal(submissions, 1); assert.equal(stopped, 1, 'Legacy broken handler is blocked');
button.disabled = true; listeners.get('click')(event);
assert.equal(submissions, 1, 'Sold-out state must not be bypassed');
controller.disconnectedCallback();
assert.equal(listeners.size, 0);
vm.runInNewContext(fs.readFileSync('assets/pawguard.js', 'utf8'), sandbox);
assert.equal(classes.size, 2, 'Theme editor asset reload does not register duplicate components');
console.log('PASS: amounts 1/2/3, variant changes, quantity input, native tiers, 2-pack/bundle discounts, isolation, cleanup, sticky native submission and sold-out guard.');
