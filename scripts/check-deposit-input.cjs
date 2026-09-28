// Kiểm tra state React và dữ liệu gửi API, không tạo giao dịch trong database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const states = [];
let cursor = 0;
const requests = [];
const react = {
  useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = value; }];
  },
  useRef(initial) { const [value] = react.useState({current: initial}); return value; },
  useEffect() {},
  useMemo(fn) { return fn(); },
};
const jsx = (type, props) => ({type, props});
const context = {
  exports: {}, console, Intl, process: {env: {NODE_ENV: 'development'}},
  require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return {jsx, jsxs: jsx, Fragment: 'fragment'};
    if (name.includes('CurrentUserProvider')) return {useCurrentUser: () => ({refreshUser: async () => {}})};
    if (name.includes('PaymentSuccessModal')) return {PaymentSuccessModal: () => null};
    return {};
  },
  async fetch(url, options) {
    const body = JSON.parse(options.body);
    requests.push(body);
    return {ok: true, json: async () => ({data: {id: String(requests.length), amount: String(body.amount), paymentCode: `CODE${requests.length}`, status: 'PENDING'}})};
  },
};
const code = ts.transpileModule(fs.readFileSync('app/add-funds/page.tsx', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX}}).outputText;
vm.runInNewContext(code, context);
function render() { cursor = 0; return context.exports.default(); }
function find(node, test) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) { for (const item of node) { const found = find(item, test); if (found) return found; } return null; }
  if (test(node)) return node;
  return find(node.props?.children, test);
}
const input = tree => find(tree, node => node.type === 'input' && node.props.inputMode === 'numeric');
const button = tree => find(tree, node => node.props?.className === 'fund-button');
const image = tree => find(tree, node => node.type === 'img');
(async () => {
  let tree = render();
  states[0] = {configured: true, bankId: 'MB', accountNumber: 'test'};
  assert.equal(input(tree).props.value, '');
  for (const amount of ['30000', '20000', '50000']) {
    input(tree).props.onChange({target: {value: amount}});
    tree = render();
    assert.equal(input(tree).props.value, Number(amount).toLocaleString('vi-VN'));
    const before = requests.length;
    const pending = button(tree).props.onClick();
    await button(tree).props.onClick();
    await pending;
    tree = render();
    assert.equal(requests.length, before + 1);
    assert.equal(requests.at(-1).amount, Number(amount));
    assert.ok(image(tree).props.src.includes(`amount=${amount}&`));
  }
  const previousQr = image(tree).props.src;
  input(tree).props.onChange({target: {value: '200'}});
  tree = render();
  assert.equal(image(tree).props.src, previousQr);
  await button(tree).props.onClick();
  tree = render();
  assert.equal(requests.length, 3);
  assert.equal(image(tree).props.src, previousQr);
  assert.equal(find(tree, n => n.props?.className === 'fund-error').props.children, 'Số tiền tối thiểu là 5.000đ');
  input(tree).props.onChange({target: {value: ''}});
  assert.equal(input(render()).props.value, '');
  console.log('PASS: ô trống, định dạng, payload 30k/20k/50k, QR, chống bấm đôi, mức tối thiểu, giữ QR cũ khi input thay đổi.');
})().catch(error => {console.error(error); process.exitCode = 1;});
