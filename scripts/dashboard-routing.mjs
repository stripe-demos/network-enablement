// The bare root opens the Network enablement landing page (the Flows entry,
// root index.html). An old `/?new=1` link still reaches Console, a
// `?prototypeView=` frame still reaches Dashboard, and `/flows/` links move to
// the root (the browser keeps the #demo hash).
export function defaultSurfaceRedirect(req, res, next) {
  const url = new URL(req.url, 'http://localhost');
  if ((req.method === 'GET' || req.method === 'HEAD')
      && req.headers.accept?.includes('text/html')) {
    let location = null;
    if (url.pathname === '/' && url.searchParams.has('new')) location = '/console/';
    else if (url.pathname === '/' && url.searchParams.has('prototypeView')) location = '/dashboard/';
    else if (/^\/flows(?:\/|$)/.test(url.pathname)) location = '/';
    if (location) {
      res.statusCode = 302;
      res.setHeader('Location', `${location}${url.search}`);
      res.end();
      return;
    }
  }
  next();
}

// Vite normally falls back to the root index.html for deep links. Dashboard and
// Console each have their own HTML entry.
const SURFACE_ENTRIES = [
  [/^\/dashboard(?:\/|$)/, '/dashboard/index.html'],
  [/^\/console(?:\/|$)/, '/console/index.html'],
];

export function dashboardHtmlFallback(req, _res, next) {
  const url = new URL(req.url, 'http://localhost');
  if ((req.method === 'GET' || req.method === 'HEAD')
      && req.headers.accept?.includes('text/html')) {
    const entry = SURFACE_ENTRIES.find(([pattern]) => pattern.test(url.pathname));
    if (entry) req.url = `${entry[1]}${url.search}`;
  }
  next();
}
