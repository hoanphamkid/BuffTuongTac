const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');

// Run the actual modules with in-memory dependencies, never the live database.
function loadModule(relativePath, overrides = {}) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const mod = { exports: {} };
  const nativeRequire = createRequire(filename);
  const execute = vm.runInThisContext(`(function(require, module, exports) {${compiled}\n})`, { filename });
  execute((name) => Object.hasOwn(overrides, name) ? overrides[name] : nativeRequire(name), mod, mod.exports);
  return mod.exports;
}

const { emptyOrderDraft, readOrderDraft, writeOrderDraft, clearOrderDraft } = loadModule('lib/order-draft.ts');
const { balanceShortfall, parseTopUpAmount } = loadModule('lib/order-pricing.ts');
test('top-up prefill preserves the exact shortfall and rejects invalid query amounts', () => {
  assert.equal(parseTopUpAmount(String(balanceShortfall(25000, 7179))), '17821');
  assert.equal(parseTopUpAmount('1234'), '1234');
  assert.equal(parseTopUpAmount('005000'), '5000');
  for (const value of [null, '', '0', '-1', '1.5', 'Infinity', 'abc', '1000000000000']) {
    assert.equal(parseTopUpAmount(value), '');
  }
});
function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('shortfall is exact and disappears after a sufficient top-up or for a trial', () => {
  assert.equal(balanceShortfall(40000, '7179'), 32821);
  assert.equal(balanceShortfall(40000, '40000'), 0);
  assert.equal(balanceShortfall(40000, '50000'), 0);
  assert.equal(balanceShortfall(40000, '0', true), 0);
  assert.equal(balanceShortfall(NaN, 1000), 0);
});

test('returning from top-up restores non-default service/server, link, quantity and comments', () => {
  const storage = memoryStorage();
  const draft = { ...emptyOrderDraft, platformId: 'tiktok', serviceId: 'comments', serverId: 'server-2', link: 'https://www.tiktok.com/@example/video/123', quantity: 500, comments: 'Một\nHai', reaction: 'love' };
  writeOrderDraft(storage, 'user-a', draft, 1000);
  assert.deepEqual(readOrderDraft(storage, 'user-a', 2000), draft);
  assert.equal(readOrderDraft(storage, 'user-b', 2000), null);
});

test('a successful order or logout clears only the current account draft', () => {
  const storage = memoryStorage();
  writeOrderDraft(storage, 'user-a', emptyOrderDraft, 1000);
  writeOrderDraft(storage, 'user-b', emptyOrderDraft, 1000);
  clearOrderDraft(storage, 'user-a');
  assert.equal(readOrderDraft(storage, 'user-a', 2000), null);
  assert.ok(readOrderDraft(storage, 'user-b', 2000));
});

test('expired/corrupt drafts and blocked storage cannot break the form', () => {
  const storage = memoryStorage();
  writeOrderDraft(storage, 'user-a', emptyOrderDraft, 1000);
  assert.equal(readOrderDraft(storage, 'user-a', 1000 + 86400001), null);
  assert.equal(readOrderDraft({ getItem: () => '{bad-json' }, 'user-a'), null);
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); }, removeItem() { throw Error('blocked'); } };
  assert.equal(readOrderDraft(blocked, 'user-a'), null);
  assert.doesNotThrow(() => writeOrderDraft(blocked, 'user-a', emptyOrderDraft));
  assert.doesNotThrow(() => clearOrderDraft(blocked, 'user-a'));
});

test('trial mode persists but the trial KEY is never stored', () => {
  const storage = memoryStorage();
  writeOrderDraft(storage, 'user-a', { ...emptyOrderDraft, trialMode: true, quantity: 100, trialKey: 'secret-key' }, 1000);
  const restored = readOrderDraft(storage, 'user-a', 2000);
  assert.equal(restored.trialMode, true);
  assert.equal(restored.quantity, 100);
  assert.equal('trialKey' in restored, false);
});

function orderRoute(user, findFirst) {
  return loadModule('app/api/orders/[id]/route.ts', {
    '@/lib/auth': { currentUser: async () => user },
    '@/lib/prisma': { prisma: { order: { findFirst } } },
  }).GET;
}

test('order details reject an unauthenticated request before touching the database', async () => {
  const get = orderRoute(null, () => assert.fail('must not query the database'));
  const response = await get(new Request('http://localhost/api/orders/order-a'), { params: Promise.resolve({ id: 'order-a' }) });
  assert.equal(response.status, 401);
});

test('order lookup requires both the exact ID and the signed-in owner', async () => {
  const get = orderRoute({ id: 'user-a' }, async (query) => {
    assert.deepEqual(query.where, { id: 'order-b', userId: 'user-a' });
    assert.equal(query.select.user, undefined);
    return null;
  });
  const response = await get(new Request('http://localhost/api/orders/order-b'), { params: Promise.resolve({ id: 'order-b' }) });
  assert.equal(response.status, 404);
});

test('the owner gets their requested order with private, non-cacheable pricing data', async () => {
  const get = orderRoute({ id: 'user-a' }, async () => ({ id: 'order-a', price: '40000', status: 'PENDING' }));
  const response = await get(new Request('http://localhost/api/orders/order-a'), { params: Promise.resolve({ id: 'order-a' }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual((await response.json()).data, { id: 'order-a', price: 40000, status: 'PENDING' });
});

test('the success popup links to the newly created order, including free trials', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { OrderSuccessModal } = loadModule('components/order/OrderSuccessModal.tsx');
  for (const total of [40000, 0]) {
    const html = renderToStaticMarkup(React.createElement(OrderSuccessModal, {
      order: { id: 'order-new', service: 'Views', server: 'SV1', quantity: 1000, total }, onClose() {},
    }));
    assert.match(html, /href="\/orders\/order-new"/);
    assert.match(html, /Xem đơn vừa đặt/);
  }
});
