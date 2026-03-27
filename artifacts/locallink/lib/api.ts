import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `https://${domain}/api`;
  }
  return "http://localhost:8080/api";
}

export const API_BASE = getApiBase();

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<T> {
  const token = requiresAuth ? await getToken() : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, data?.error ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  auth: {
    register: (data: {
      name: string;
      email: string;
      password: string;
      role: "seeker" | "provider";
    }) => request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }, false),

    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }, false),

    me: () => request<any>("/auth/me"),

    updateMe: (data: Partial<{ name: string; bio: string; location: string; phone: string }>) =>
      request<any>("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
  },

  listings: {
    list: (params?: { category?: string; search?: string; sort?: string }) => {
      const qs = params
        ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString()
        : "";
      return request<any[]>(`/listings${qs}`, {}, false);
    },

    get: (id: string) => request<any>(`/listings/${id}`, {}, false),

    create: (data: any) =>
      request<any>("/listings", { method: "POST", body: JSON.stringify(data) }),

    update: (id: string, data: any) =>
      request<any>(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

    delete: (id: string) =>
      request<any>(`/listings/${id}`, { method: "DELETE" }),

    byProvider: (providerId: string) =>
      request<any[]>(`/listings/provider/${providerId}`, {}, false),
  },

  requests: {
    list: () => request<any[]>("/requests"),
    get: (id: string) => request<any>(`/requests/${id}`),
    create: (data: { listingId: string; providerId: string; message: string; scheduledDate?: string; price: number }) =>
      request<any>("/requests", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      request<any>(`/requests/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },

  conversations: {
    list: () => request<any[]>("/conversations"),
    get: (id: string) => request<any>(`/conversations/${id}`),
    messages: (id: string) => request<any[]>(`/conversations/${id}/messages`),
    sendMessage: (id: string, text: string) =>
      request<any>(`/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ text }) }),
  },

  reviews: {
    byProvider: (providerId: string) => request<any[]>(`/reviews/provider/${providerId}`, {}, false),
    byListing: (listingId: string) => request<any[]>(`/reviews/listing/${listingId}`, {}, false),
    create: (data: { providerId: string; listingId: string; requestId: string; rating: number; comment: string }) =>
      request<any>("/reviews", { method: "POST", body: JSON.stringify(data) }),
  },

  notifications: {
    list: () => request<any[]>("/notifications"),
    markRead: (id: string) =>
      request<any>(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllRead: () =>
      request<any>("/notifications/read-all", { method: "PATCH" }),
  },
};
