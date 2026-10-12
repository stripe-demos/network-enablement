// Dashboard is the default surface: the bare root opens it, and Console lives
// under /console/. An old `/?new=1` link still reaches Console.
export function defaultSurfaceRedirect(req, res, next) {
  const url = new URL(req.url, 'http://localhost');
  if ((req.method === 'GET' || req.method === 'HEAD')
      && req.headers.accept?.includes('text/html')
      && url.pathname === '/') {
    res.statusCode = 302;
    res.setHeader('Location', `${url.searchParams.has('new') ? '/console/' : '/dashboard/'}${url.search}`);
    res.end();
    return;
  }
  next();
}

// Vite normally falls back to Console's root index.html for deep links.
export function dashboardHtmlFallback(req, _res, next) {
  const url = new URL(req.url, 'http://localhost');
  if ((req.method === 'GET' || req.method === 'HEAD')
      && req.headers.accept?.includes('text/html')
      && /^\/dashboard(?:\/|$)/.test(url.pathname)) {
    req.url = `/dashboard/index.html${url.search}`;
  }
  next();
}
