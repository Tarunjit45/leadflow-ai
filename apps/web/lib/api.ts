// Frontend API client with JWT header injection and local fallback support

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('leadflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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
