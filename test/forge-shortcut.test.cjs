const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../legacy_enhancement_suite.user.js'), 'utf8');

function page(continuePage = false) {
  const handlers = new Map();
  const window = new EventTarget();
  const document = new EventTarget();
  const form = new EventTarget();
  const link = { contains: (target) => target === control };
  let requests = 0;
  let cancel = false;
  const control = {
    tagName: 'INPUT',
    disabled: false,
    form,
    closest: () => link,
    click() {
      if (this.disabled) return;
      const click = dispatch(document, 'click', { target: control });
      if (click.defaultPrevented) return;
      const request = continuePage ? click : dispatch(form, 'submit');
      if (!request.defaultPrevented) requests++;
    },
  };
  document.getElementById = (id) =>
    id === (continuePage ? 'craft_again' : 'forgeButton') ? control : null;
  function dispatch(target, type, properties = {}) {
    const event = new Event(type, { cancelable: true });
    for (const [key, value] of Object.entries(properties)) {
      Object.defineProperty(event, key, { value });
    }
    target.dispatchEvent(event);
    return event;
  }
  // Registering the feature separately avoids initializing unrelated page features.
  const context = vm.createContext({
    window,
    document,
    Promise,
    registerFunction(fn) {
      handlers.set(fn.name, fn);
    },
  });
  const feature = source.slice(
    source.indexOf('registerFunction(\n  function addForgeKeybinding'),
    source.indexOf('//                                  Market'),
  );
  vm.runInContext(feature, context);
  handlers.get('addForgeKeybinding')();
  (continuePage ? document : form).addEventListener(continuePage ? 'click' : 'submit', (event) => {
    if (cancel) event.preventDefault();
  });
  return {
    control,
    requests: () => requests,
    cancel: (value) => (cancel = value),
    submit: () => {
      if (!dispatch(form, 'submit').defaultPrevented) requests++;
    },
    key(type = 'keydown', properties = {}) {
      return dispatch(window, type, { key: ' ', target: { tagName: 'BODY' }, ...properties });
    },
    restore: () => dispatch(window, 'pageshow', { persisted: true }),
    nativeRelease(callback) {
      window.addEventListener('keyup', callback);
    },
  };
}

for (const continuePage of [false, true]) {
  const action = continuePage ? 'Craft Again' : 'Forge';
  test(`${action}: held Space, clicks, and release make one request per page`, () => {
    const first = page(continuePage);
    first.nativeRelease(() => first.control.click());
    first.key();
    for (let i = 0; i < 20; i++) first.key('keydown', { repeat: true });
    first.control.click();
    first.key('keyup');
    first.key();
    assert.equal(first.requests(), 1);
    const next = page(continuePage);
    next.key('keydown', { repeat: true });
    assert.equal(next.requests(), 1);
  });

  test(`${action}: canceled actions allow retry`, async () => {
    const current = page(continuePage);
    current.cancel(true);
    current.key();
    assert.equal(current.requests(), 0);
    await Promise.resolve();
    current.cancel(false);
    current.key('keydown', { repeat: true });
    assert.equal(current.requests(), 1);
  });

  test(`${action}: disabled controls and editable or modified keys do not act`, () => {
    const current = page(continuePage);
    current.control.disabled = true;
    current.key();
    current.control.disabled = false;
    for (const tagName of ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']) {
      current.key('keydown', { target: { tagName } });
    }
    current.key('keydown', { target: { isContentEditable: true } });
    for (const modifier of ['metaKey', 'ctrlKey', 'altKey']) {
      current.key('keydown', { [modifier]: true });
    }
    assert.equal(current.requests(), 0);
    current.key('keydown', { target: current.control });
    assert.equal(current.requests(), 1);
  });
}

test('mouse and direct form submissions also lock out subsequent keyboard requests', () => {
  const current = page();
  current.submit();
  current.submit();
  current.control.click();
  current.key('keydown', { repeat: true });
  assert.equal(current.requests(), 1);
  current.restore();
  current.key();
  assert.equal(current.requests(), 2);
});
