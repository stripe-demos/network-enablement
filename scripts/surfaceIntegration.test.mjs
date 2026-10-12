import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { launchConsole, consumeConsoleHandoff } from '../src/integration/consoleHandoff.js';
import { dashboardHtmlFallback, defaultSurfaceRedirect } from './dashboard-routing.mjs';
import { dashboardPath, dashboardRelativePath } from '../src/dashboard/lib/dashboardRouting.js';
import { createDashboardStorage } from '../src/dashboard/lib/storage.js';

function fakeBrowser() {
  const entries = [{ url: '/dashboard/transactions/payments', state: { idx: 2 } }];
  const history = {
    get state() { return entries.at(-1).state; },
    pushState(state, _, url) { entries.push({ state, url }); },
    replaceState(state, _, url = entries.at(-1).url) { entries[entries.length - 1] = { state, url }; },
  };
  let reloads = 0;
  return { history, entries, location: { reload() { reloads++; } }, get reloads() { return reloads; } };
}

test('Dashboard prompt reaches Console once without entering the URL or storage', () => {
  const browser = fakeBrowser();
  launchConsole('  Compare revenue & refunds?  ', { browser });
  assert.equal(browser.entries[0].url, '/dashboard/transactions/payments');
  assert.equal(browser.entries[1].url, '/console/?new=1');
  assert.equal(browser.reloads, 1);
  assert.deepEqual(consumeConsoleHandoff(browser.history), { prompt: 'Compare revenue & refunds?' });
  assert.equal(consumeConsoleHandoff(browser.history), null);
});

test('intermediate Dashboard Console route is replaced so Back cannot relaunch it', () => {
  const browser = fakeBrowser();
  browser.history.pushState({ usr: { launchPrompt: 'Revenue' }, idx: 3 }, '', '/dashboard/console');
  launchConsole('Revenue', { replace: true, browser });
  assert.deepEqual(browser.entries.map(entry => entry.url), ['/dashboard/transactions/payments', '/console/?new=1']);
  assert.deepEqual(consumeConsoleHandoff(browser.history), { prompt: 'Revenue' });
});

test('blank opens cannot reuse an earlier prompt; consuming preserves unrelated history', () => {
  const browser = fakeBrowser();
  launchConsole('Previous question', { browser });
  launchConsole('', { browser });
  assert.equal(consumeConsoleHandoff(browser.history), null);
  browser.history.replaceState({ idx: 8, usr: { keep: true }, dashboardConsoleHandoff: { prompt: 'New question' } }, '');
  consumeConsoleHandoff(browser.history);
  assert.deepEqual(browser.history.state, { idx: 8, usr: { keep: true } });
});

test('deep links load the Dashboard document, while Console and asset requests are untouched', () => {
  for (const url of ['/dashboard', '/dashboard/', '/dashboard/transactions/payments?view=failed', '/dashboard/components']) {
    const req = { url, method: 'GET', headers: { accept: 'text/html' } };
    let next = 0;
    dashboardHtmlFallback(req, null, () => next++);
    assert.equal(req.url, '/dashboard/index.html' + (url.includes('?') ? '?view=failed' : ''));
    assert.equal(next, 1);
  }
  for (const url of ['/console/', '/console/?new=1', '/dashboard-assets/icons/home.svg', '/src/dashboard/dashboard-main.jsx']) {
    const req = { url, method: 'GET', headers: { accept: 'text/html' } };
    dashboardHtmlFallback(req, null, () => {});
    assert.equal(req.url, url);
  }
  const asset = { url: '/dashboard/example.js', method: 'GET', headers: { accept: '*/*' } };
  dashboardHtmlFallback(asset, null, () => {});
  assert.equal(asset.url, '/dashboard/example.js');
});

test('the bare root opens Dashboard; Console, Dashboard and asset requests are untouched', () => {
  const visit = (url, accept = 'text/html') => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end() { this.ended = true; } };
    let next = 0;
    defaultSurfaceRedirect({ url, method: 'GET', headers: { accept } }, res, () => next++);
    return { res, next };
  };
  for (const [url, location] of [['/', '/dashboard/'], ['/?prototypeView=x', '/dashboard/?prototypeView=x'], ['/?new=1', '/console/?new=1']]) {
    const { res, next } = visit(url);
    assert.equal(res.statusCode, 302);
    assert.equal(res.headers.Location, location);
    assert.equal(next, 0);
  }
  for (const url of ['/console/', '/console/?new=1', '/dashboard/', '/src/main.jsx']) assert.equal(visit(url).next, 1);
  assert.equal(visit('/', '*/*').next, 1);
});

test('Dashboard native navigation keeps its basename and external links remain external', () => {
  assert.equal(dashboardPath('/transactions/payments?view=failed#row'), '/dashboard/transactions/payments?view=failed#row');
  assert.equal(dashboardPath('/dashboard/components'), '/dashboard/components');
  assert.equal(dashboardPath('https://stripe.com'), 'https://stripe.com');
  assert.equal(dashboardPath('//stripe.com'), '//stripe.com');
  assert.equal(dashboardRelativePath('/dashboard/customers/all-customers'), '/customers/all-customers');
  assert.equal(dashboardRelativePath('/dashboard'), '/');
});

test('Dashboard preference writes and removals cannot touch Console preferences', () => {
  const data = new Map([['sidebar-collapsed', 'false'], ['console-theme-v2', 'dark']]);
  const storage = createDashboardStorage(() => ({
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  }));
  storage.setItem('sidebar-collapsed', 'true');
  assert.equal(storage.getItem('sidebar-collapsed'), 'true');
  storage.removeItem('sidebar-collapsed');
  assert.deepEqual([...data], [['sidebar-collapsed', 'false'], ['console-theme-v2', 'dark']]);
  const blocked = createDashboardStorage(() => { throw new Error('Storage unavailable'); });
  assert.equal(blocked.getItem('anything'), null);
  assert.doesNotThrow(() => blocked.setItem('anything', 'value'));
});

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.[jt]sx?$/.test(path) ? [path] : [];
  });
}

test('surface imports stay within their owner or the plain-data integration boundary', () => {
  const src = resolve('src');
  for (const surface of ['console', 'dashboard']) {
    for (const file of sourceFiles(resolve(src, surface))) {
      for (const match of readFileSync(file, 'utf8').matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)) {
        const specifier = match[1];
        assert.ok(!specifier.startsWith('@/'), `${file}: use an explicit surface alias`);
        if (surface === 'console') assert.ok(!specifier.startsWith('@dashboard/') && !specifier.startsWith('next/'), `${file}: Dashboard-only alias`);
        const importPath = specifier.startsWith('@dashboard/')
          ? resolve(src, 'dashboard', specifier.slice('@dashboard/'.length))
          : specifier.startsWith('.') ? resolve(dirname(file), specifier) : null;
        if (!importPath) continue;
        const target = relative(src, importPath).split('/')[0];
        assert.ok(target === surface || target === 'integration', `${file}: cross-surface import ${specifier}`);
      }
    }
  }
  assert.ok(!readFileSync('src/main.jsx', 'utf8').includes('./dashboard/'));
  assert.ok(!readFileSync('src/dashboard/dashboard-main.jsx', 'utf8').includes('/console/'));
});
