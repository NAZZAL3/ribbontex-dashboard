const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('ribbontex_token');
}

function getOwnerToken(): string | null {
  return sessionStorage.getItem('ribbontex_owner_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  opts?: { owner?: boolean }
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts?.owner) {
    const ownerToken = getOwnerToken();
    if (ownerToken) headers['X-Owner-Token'] = ownerToken;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('ribbontex_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (res.status === 403 && opts?.owner) {
    clearOwnerToken();
    throw new Error('Owner access required');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<{ username: string }>('/auth/me'),

  verifyOwner: (password: string) =>
    request<{ ownerToken: string }>('/auth/owner', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  getOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<import('../types').Order[]>(`/orders${qs}`);
  },

  createOrder: (payload: import('../types').CreateOrderPayload) =>
    request<import('../types').Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateOrderStatus: (id: number, status: string) =>
    request<import('../types').Order>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteOrder: (id: number) =>
    request<{ success: boolean }>(`/orders/${id}`, { method: 'DELETE' }),

  getStats: (period = '30') =>
    request<import('../types').DashboardStats>(`/stats?period=${period}`, {}, { owner: true }),

  createStoreVisit: (payload: import('../types').CreateStoreVisitPayload) =>
    request<import('../types').StoreVisit>('/store-visits', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getStoreTodayLog: () =>
    request<import('../types').StoreTodayLog>('/store-visits/today-log'),

  getStoreAnalytics: () =>
    request<import('../types').StoreTodayStats>('/store-visits/analytics', {}, { owner: true }),

  getStoreHistory: (days = '30') =>
    request<import('../types').StoreHistory>(`/store-visits/history?days=${days}`, {}, {
      owner: true,
    }),

  updateStoreVisit: (id: number, payload: import('../types').UpdateStoreVisitPayload) =>
    request<import('../types').StoreVisit>(`/store-visits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteStoreVisit: (id: number) =>
    request<{ success: boolean }>(`/store-visits/${id}`, { method: 'DELETE' }),
};

export function setToken(token: string) {
  localStorage.setItem('ribbontex_token', token);
}

export function clearToken() {
  localStorage.removeItem('ribbontex_token');
  clearOwnerToken();
}

export function hasToken() {
  return !!getToken();
}

export function setOwnerToken(token: string) {
  sessionStorage.setItem('ribbontex_owner_token', token);
}

export function clearOwnerToken() {
  sessionStorage.removeItem('ribbontex_owner_token');
}

export function hasOwnerToken() {
  return !!getOwnerToken();
}
