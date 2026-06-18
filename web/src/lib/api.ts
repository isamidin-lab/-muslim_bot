const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((options.headers as Record<string, string>) || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  profile: () => request('/auth/profile'),
  getTenant: (slug: string) => request(`/tenants/${slug}`),
  getCourses: (params?: string) => request(`/courses${params ? `?${params}` : ''}`),
  getCourse: (id: string) => request(`/courses/${id}`),
  getMemberships: () => request('/memberships'),
  getDashboard: () => request('/analytics/dashboard'),
  createPurchase: (data: any) => request('/payments/purchase', { method: 'POST', body: JSON.stringify(data) }),
};
