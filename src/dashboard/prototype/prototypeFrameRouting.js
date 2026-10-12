export function toPreviewFramePath(path) {
  if (!path || typeof path !== 'string') return path

  try {
    const url = new URL(path, typeof window === 'undefined' ? 'http://localhost' : window.location.origin)
    const origin = typeof window === 'undefined' ? url.origin : window.location.origin
    if (url.origin !== origin) return path

    const params = new URLSearchParams(url.search)
    params.set('previewPath', url.pathname)
    const query = params.toString()
    return `/${query ? `?${query}` : ''}${url.hash || ''}`
  } catch {
    return path
  }
}

export function frameSafePath(path) {
  if (typeof window === 'undefined') return path

  const params = new URLSearchParams(window.location.search)
  if (!params.get('prototypeView')) return path

  return toPreviewFramePath(path)
}
