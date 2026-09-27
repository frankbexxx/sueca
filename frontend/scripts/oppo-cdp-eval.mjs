/**
 * CDP evaluate helper for installed Suecão WebView.
 * Usage: node scripts/oppo-cdp-eval.mjs '<js expression>'
 */
import WebSocket from 'ws';
import fs from 'node:fs';

const fileIdx = process.argv.indexOf('--file');
const expr =
  fileIdx >= 0 ? fs.readFileSync(process.argv[fileIdx + 1], 'utf8') : process.argv[2];
if (!expr) {
  console.error('usage: node scripts/oppo-cdp-eval.mjs <expression> | --file path');
  process.exit(2);
}

const tabs = await fetch('http://127.0.0.1:9222/json').then((r) => r.json());
const page = tabs.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
if (!page) {
  console.error(JSON.stringify({ ok: false, reason: 'no_page', tabs }));
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.on('open', res);
  ws.on('error', rej);
});

let id = 0;
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const i = ++id;
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 15000);
    ws.on('message', function h(raw) {
      const m = JSON.parse(String(raw));
      if (m.id === i) {
        clearTimeout(t);
        ws.off('message', h);
        resolve(m);
      }
    });
    ws.send(JSON.stringify({ id: i, method, params }));
  });

await send('Runtime.enable');
const ev = await send('Runtime.evaluate', {
  expression: expr,
  awaitPromise: true,
  returnByValue: true
});
if (ev.result?.exceptionDetails) {
  console.error(JSON.stringify(ev.result.exceptionDetails, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(ev.result?.result?.value ?? ev.result, null, 2));
ws.close();
