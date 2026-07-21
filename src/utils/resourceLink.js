// frontend/src/utils/resourceLink.js
const APP_HOSTS = ['mathminds.club', 'www.mathminds.club'];

// curriculum.Resource.url is sometimes admin-entered as a full absolute URL
// (e.g. https://mathminds.club/quiz/<uuid>) instead of an app-relative path.
// React Router's <Link to> treats a non-leading-slash string as a path segment
// relative to the current route rather than navigating away, which silently
// breaks the link. Resolve to a relative "to" for our own domain, or flag
// truly external URLs so callers can render a plain <a> instead.
export function resolveResourceHref(url) {
  if (!url) return { to: url, external: false };
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin || APP_HOSTS.includes(parsed.hostname)) {
      return { to: parsed.pathname + parsed.search + parsed.hash, external: false };
    }
    return { to: url, external: true };
  } catch {
    return { to: url, external: false };
  }
}
