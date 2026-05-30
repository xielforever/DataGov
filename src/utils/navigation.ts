/**
 * Navigate to a view within the app using query parameters.
 * Replaces the scattered window.history.replaceState + PopStateEvent pattern.
 */
export function navigateTo(view: string, params?: Record<string, string>) {
  let url = `?view=${view}`;
  if (params) {
    const search = new URLSearchParams(params).toString();
    if (search) url += `&${search}`;
  }
  window.history.replaceState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
