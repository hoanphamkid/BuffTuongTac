const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');

// Exercise the real handlers with isolated dependencies; never post test reviews
// or change customer orders in the application's database.
function loadModule(relativePath, overrides = {}) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename,
  }).outputText;
  const mod = { exports: {} };
  const nativeRequire = createRequire(filename);
  const execute = vm.runInThisContext(`(function(require, module, exports) {${compiled}\n})`, { filename });
  execute((name) => Object.hasOwn(overrides, name) ? overrides[name] : nativeRequire(name), mod, mod.exports);
  return mod.exports;
}

const reviews = loadModule('lib/reviews.ts');
const valid = { orderId: 'order-a', rating: 4, content: 'Dịch vụ tốt, tư vấn rõ ràng.' };
function route(user, db) {
  return loadModule('app/api/reviews/route.ts', {
    '@/lib/auth': { currentUser: async () => user },
    '@/lib/prisma': { prisma: db }, '@/lib/reviews': reviews,
  });
}
function request(body = valid, headers = {}) {
  return new Request('http://localhost:3000/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
function fakeDb(status, create) {
  return { $transaction: async (callback) => callback({
    $queryRaw: async (query, ...parameters) => {
      assert.deepEqual(parameters, ['order-a', 'user-a']);
      assert.match(query.join('?'), /"userId" = \?/);
      assert.match(query.join('?'), /FOR UPDATE/);
      return status ? [{ id: 'order-a', status }] : [];
    },
    orderReview: { create: create || (() => assert.fail('must not save an ineligible review')) },
  }) };
}

test('unauthenticated users cannot submit even with a valid order ID', async () => {
  const response = await route(null, {}).POST(request());
  assert.equal(response.status, 401);
});

test('a different website cannot submit a review with the visitor session', async () => {
  const response = await route({ id: 'user-a' }, {}).POST(request(valid, { Origin: 'https://another-site.example' }));
  assert.equal(response.status, 403);
});

test('invalid JSON, whitespace-only comments, invalid stars and forged identity are rejected', async () => {
  const { POST } = route({ id: 'user-a' }, {});
  for (const input of [null, {}, { ...valid, rating: 0 }, { ...valid, rating: 6 }, { ...valid, rating: 2.5 }, { ...valid, rating: '5' }, { ...valid, content: ' '.repeat(20) }, { ...valid, content: 'ngắn' }, { ...valid, content: 'a'.repeat(1001) }, { ...valid, userId: 'someone-else' }]) {
    assert.equal((await POST(request(input))).status, 400);
  }
  assert.equal((await POST(new Request('http://localhost:3000/api/reviews', { method: 'POST', body: '{broken-json' }))).status, 400);
});

test('missing orders and orders owned by someone else cannot be reviewed', async () => {
  assert.equal((await route({ id: 'user-a' }, fakeDb(null)).POST(request())).status, 404);
});

for (const status of ['PENDING', 'PROCESSING', 'IN_PROGRESS', 'PARTIAL', 'CANCELED', 'FAILED', 'REFUNDED']) {
  test(`an existing ${status} order can be reviewed immediately by its owner`, async () => {
    const db = fakeDb(status, async (query) => {
      assert.deepEqual(query.data, valid);
      return { id: 'review-a' };
    });
    assert.equal((await route({ id: 'user-a' }, db).POST(request())).status, 201);
  });
}

test('the owner can review a completed order; input is trimmed and only allowed fields are stored', async () => {
  let saved;
  const db = fakeDb('COMPLETED', async (query) => { saved = query; return { id: 'review-a' }; });
  const response = await route({ id: 'user-a' }, db).POST(request({ ...valid, content: `  ${valid.content}  ` }, { Origin: 'http://localhost:3000' }));
  assert.equal(response.status, 201);
  assert.deepEqual(saved.data, valid);
  assert.deepEqual((await response.json()).data, { id: 'review-a' });
});

test('the database unique constraint prevents duplicate reviews, including competing submissions', async () => {
  const db = fakeDb('PENDING', async () => { throw Object.assign(new Error('duplicate'), { code: 'P2002' }); });
  const response = await route({ id: 'user-a' }, db).POST(request());
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /một lần/);
});

test('database failures return a retryable error, never a success', async () => {
  const db = { $transaction: async () => { throw new Error('private connection data'); } };
  const response = await route({ id: 'user-a' }, db).POST(request());
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private connection data/);
});

test('listing uses actual ratings, stable pagination and the current user unreviewed orders without a status filter', async () => {
  const db = { $transaction: async (callback) => callback({
    orderReview: {
      groupBy: async () => [{ rating: 5, _count: { _all: 7 } }, { rating: 1, _count: { _all: 1 } }],
      findMany: async (query) => {
        assert.deepEqual(query.where, { rating: 5 });
        assert.equal(query.skip, 6);
        assert.equal(query.take, 6);
        assert.deepEqual(query.orderBy, [{ createdAt: 'desc' }, { id: 'desc' }]);
        assert.deepEqual(query.select.order.select.user.select, { username: true });
        return [{ id: 'review-a', rating: 5, content: valid.content, createdAt: new Date('2026-10-07T00:00:00Z'), order: { user: { username: 'tester' }, service: { name: 'Views', platform: { name: 'TikTok', slug: 'tiktok' } } } }];
      },
    },
    order: {
      findMany: async (query) => {
        assert.deepEqual(query.where, { userId: 'user-a', review: { is: null } });
        return [{ id: 'order-a', service: { name: 'Views' }, createdAt: new Date('2026-10-07T00:00:00Z') }];
      },
      count: async (query) => { assert.deepEqual(query.where, { userId: 'user-a' }); return 2; },
    },
  }) };
  const response = await route({ id: 'user-a' }, db).GET(new Request('http://localhost:3000/api/reviews?rating=5&page=99'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const { data } = await response.json();
  assert.equal(data.summary.total, 8);
  assert.equal(data.summary.average, 4.5);
  assert.deepEqual(data.pagination, { page: 2, totalPages: 2, total: 7 });
  assert.equal(data.reviews[0].order, undefined);
  assert.equal(data.reviews[0].username, 'tester');
  assert.equal(data.eligibility.orders[0].id, 'order-a');
});

test('an empty community has no fabricated average and guests receive no private orders', async () => {
  const db = { $transaction: async (callback) => callback({
    orderReview: { groupBy: async () => [], findMany: async () => [] },
    order: { findMany: () => assert.fail('guests have no orders'), count: () => assert.fail('guests have no orders') },
  }) };
  const response = await route(null, db).GET(new Request('http://localhost:3000/api/reviews'));
  const { data } = await response.json();
  assert.equal(data.summary.average, null);
  assert.equal(data.summary.total, 0);
  assert.deepEqual(data.eligibility, { signedIn: false, orderCount: 0, orders: [] });
});

test('malformed filters are rejected before querying data', async () => {
  const { GET } = route(null, {});
  for (const query of ['rating=0', 'rating=6', 'rating=3.5', 'page=-1', 'page=10001', 'page=text']) {
    assert.equal((await GET(new Request(`http://localhost:3000/api/reviews?${query}`))).status, 400);
  }
});
