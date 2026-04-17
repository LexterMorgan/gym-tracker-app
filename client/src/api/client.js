const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const QUEUE_KEY = "gym-offline-mutation-queue";
export const AUTH_TOKEN_KEY = "gym-auth-token";

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
export const setAuthToken = (token) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
};
export const clearAuthToken = () => setAuthToken(null);

const getQueue = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setQueue = (queue) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent("gym-queue-updated", { detail: { pending: queue.length } }));
};

const enqueueMutation = (mutation) => {
  const queue = getQueue();
  queue.push({ ...mutation, queuedAt: new Date().toISOString() });
  setQueue(queue);
};

export const getPendingMutationCount = () => getQueue().length;

export const flushQueuedMutations = async () => {
  const queue = getQueue();
  if (!queue.length) return { flushed: 0 };
  const token = getAuthToken();
  let flushed = 0;
  while (queue.length) {
    if (typeof navigator !== "undefined" && !navigator.onLine) break;
    const item = queue[0];
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${item.path}`, {
      method: item.method,
      headers,
      body: item.body ? JSON.stringify(item.body) : undefined,
    });
    if (!response.ok) break;
    queue.shift();
    flushed += 1;
  }
  setQueue(queue);
  return { flushed, pending: queue.length };
};

const request = async (path, options = {}, queueConfig = null) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = `Request failed: ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody?.message) message = errBody.message;
      } catch {
        /* ignore */
      }
      if (response.status === 401 && token) {
        clearAuthToken();
        window.dispatchEvent(new CustomEvent("gym-auth-expired"));
      }
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    if (response.status === 204) return null;
    return response.json();
  } catch (error) {
    const canQueue = Boolean(queueConfig?.enabled && queueConfig?.method && queueConfig?.path);
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    if (canQueue && offline) {
      enqueueMutation({
        method: queueConfig.method,
        path: queueConfig.path,
        body: queueConfig.body || null,
      });
      return { queued: true };
    }
    throw error;
  }
};

export const authApi = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  google: (body) => request("/auth/google", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me", { method: "GET" }),
};

export const api = {
  getDashboard: () => request("/dashboard"),
  getProgress: () => request("/dashboard/progress"),
  listWorkouts: () => request("/workouts"),
  createWorkout: (payload) =>
    request(
      "/workouts",
      { method: "POST", body: JSON.stringify(payload) },
      { enabled: true, method: "POST", path: "/workouts", body: payload }
    ),
  updateWorkout: (id, payload) =>
    request(
      `/workouts/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      { enabled: true, method: "PUT", path: `/workouts/${id}`, body: payload }
    ),
  deleteWorkout: (id) => request(`/workouts/${id}`, { method: "DELETE" }),
  getPlan: (weekStart) => request(`/planner?weekStart=${weekStart}`),
  savePlan: (payload) =>
    request(
      "/planner",
      { method: "PUT", body: JSON.stringify(payload) },
      { enabled: true, method: "PUT", path: "/planner", body: payload }
    ),
  getFavorites: () => request("/exercises/favorites"),
  saveFavorites: (favorites) =>
    request(
      "/exercises/favorites",
      { method: "PUT", body: JSON.stringify({ favorites }) },
      { enabled: true, method: "PUT", path: "/exercises/favorites", body: { favorites } }
    ),
  getQuickAdd: () => request("/exercises/quick-add"),
};
