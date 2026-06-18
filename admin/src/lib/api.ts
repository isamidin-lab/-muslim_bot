const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  health: () => request('/health'),

  getCourses: (params?: string) => request(`/courses${params ? `?${params}` : ''}`),
  getCourse: (id: string) => request(`/courses/${id}`),
  createCourse: (data: any) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: string, data: any) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: string) => request(`/courses/${id}`, { method: 'DELETE' }),

  getMemberships: () => request('/memberships'),
  createMembership: (data: any) => request('/memberships', { method: 'POST', body: JSON.stringify(data) }),
  updateMembership: (id: string, data: any) => request(`/memberships/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMembership: (id: string) => request(`/memberships/${id}`, { method: 'DELETE' }),

  getChannels: () => request('/channels'),
  createChannel: (data: any) => request('/channels', { method: 'POST', body: JSON.stringify(data) }),
  deleteChannel: (id: string) => request(`/channels/${id}`, { method: 'DELETE' }),

  getUsers: () => request('/users'),
  getUserStats: () => request('/users/stats'),

  getBroadcasts: () => request('/broadcasts'),
  createBroadcast: (data: any) => request('/broadcasts', { method: 'POST', body: JSON.stringify(data) }),
  sendBroadcast: (id: string) => request(`/broadcasts/${id}/send`, { method: 'POST' }),
  deleteBroadcast: (id: string) => request(`/broadcasts/${id}`, { method: 'DELETE' }),

  getDashboard: () => request('/analytics/dashboard'),
  getCourseAnalytics: () => request('/analytics/courses'),

  getPayments: () => request('/payments'),
  getRevenue: () => request('/payments/revenue'),

  getAdminStats: () => request('/admin/stats'),
  getTenants: () => request('/tenants'),
};
