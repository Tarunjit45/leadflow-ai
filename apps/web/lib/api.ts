// Frontend API client with dynamic domain resolution, JWT header injection and fallback support

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    // If running on custom domain or cloud host on standard ports (e.g. 443 / 80)
    if (window.location.port === '3000') {
      return 'http://localhost:8000';
    }
    return window.location.origin;
  }
  return 'http://localhost:8000';
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('leadflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`Fetch error for ${url}:`, err);
    throw err;
  }
}
