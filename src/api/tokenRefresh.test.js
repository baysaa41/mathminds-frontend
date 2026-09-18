import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { hardLogout, refreshAccessToken } from './tokenRefresh';
import { getToken, setAccessToken, setRefreshToken, setUser } from './tokenStore';

function jsonResponse(body, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  });
}

describe('tokenRefresh', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores the new access token returned by the backend', async () => {
    setRefreshToken('old-refresh');
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({ access: 'new-access' })));

    const token = await refreshAccessToken();

    expect(token).toBe('new-access');
    expect(getToken()).toBe('new-access');
  });

  it('persists a rotated refresh token when the backend returns one', async () => {
    setRefreshToken('old-refresh');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => jsonResponse({ access: 'new-access', refresh: 'new-refresh' }))
    );

    await refreshAccessToken();

    expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
  });

  it('clears the session when the refresh token is missing', async () => {
    setAccessToken('stale-access');
    setUser({ id: 1 });

    await expect(refreshAccessToken()).rejects.toThrow('No refresh token');

    expect(getToken()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('clears the session when the refresh call fails', async () => {
    setRefreshToken('expired');
    setAccessToken('stale-access');
    vi.stubGlobal('fetch', vi.fn(() => jsonResponse({}, false)));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(refreshAccessToken()).rejects.toThrow('Failed to refresh token');

    expect(getToken()).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('shares one request across concurrent callers', async () => {
    setRefreshToken('old-refresh');
    const fetchMock = vi.fn(() => jsonResponse({ access: 'new-access' }));
    vi.stubGlobal('fetch', fetchMock);

    const [a, b, c] = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect([a, b, c]).toEqual(['new-access', 'new-access', 'new-access']);
  });

  it('hardLogout removes tokens and the stored user', () => {
    setAccessToken('a');
    setRefreshToken('r');
    setUser({ id: 1 });
    localStorage.setItem('oauth_last_code', 'code');
    localStorage.setItem('code_verifier', 'keeper');

    hardLogout();

    expect(getToken()).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('oauth_last_code')).toBeNull();
    // Явагдаж буй MMO нэвтрэлтийн гарааны мэдээлэл хэвээр үлдэнэ
    expect(localStorage.getItem('code_verifier')).toBe('keeper');
  });
});
