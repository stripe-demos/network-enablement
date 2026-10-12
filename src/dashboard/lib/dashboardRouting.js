export function dashboardPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return path;
  if (path === '/dashboard' || path.startsWith('/dashboard/') || path.startsWith('/dashboard?')) return path;
  return `/dashboard${path}`;
}

export function dashboardRelativePath(path) {
  return path.replace(/^\/dashboard(?=\/|$)/, '') || '/';
}
