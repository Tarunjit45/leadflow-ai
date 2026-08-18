// Frontend API client with dynamic domain resolution, JWT header injection and fallback support

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return 'https://leadflow-api-l23m.onrender.com';
  }
  return 'https://leadflow-api-l23m.onrender.com';
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('leadflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}/api/v1${cleanEndpoint}`;
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
