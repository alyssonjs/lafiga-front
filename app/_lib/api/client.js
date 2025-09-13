import { env } from '../../../env';

export const apiClient = {
  async get(endpoint, options = {}) {
    // Build query string from options.params if provided
    let url = `${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`;
    if (options.params && typeof options.params === 'object') {
      const usp = new URLSearchParams();
      Object.entries(options.params).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (Array.isArray(v)) {
          v.forEach((item) => usp.append(k, String(item)));
        } else if (typeof v === 'object') {
          // Shallow-flatten one level: key[sub]=value
          Object.entries(v).forEach(([sk, sv]) => {
            if (sv !== undefined && sv !== null) usp.append(`${k}[${sk}]`, String(sv));
          });
        } else {
          usp.append(k, String(v));
        }
      });
      const qs = usp.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : env.API_SECRET_KEY; // fallback para ambiente server (não ideal para rotas autenticadas)
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
      cache: options.cache || "default",
    });
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async post(endpoint, body, options = {}) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : env.API_SECRET_KEY;
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
      body: JSON.stringify(body),
      cache: options.cache || "no-cache",
    });
    
    const data = await response.json().catch(() => ({}));
  
    if (!response.ok) {
      // Se o backend devolveu { errors: [...] } ou { error: "..." }
      const message = data.errors
        ? data.errors.join(", ")
        : data.error || response.statusText;
      const error = new Error(message);
      error.response = data;
      throw error;
    }
  
    return data;
  },

  async put(endpoint, body, options = {}) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : env.API_SECRET_KEY;
  
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        body: JSON.stringify(body),
        cache: options.cache || "no-cache",
      }
    );
  
    const data = await response.json().catch(() => ({}));
  
    if (!response.ok) {
      // Se o backend devolveu { errors: [...] } ou { error: "..." }
      const message = data.errors
        ? data.errors.join(", ")
        : data.error || response.statusText;
      const error = new Error(message);
      error.response = data;
      throw error;
    }
  
    return data;
  },

  async delete(endpoint, options = {}) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : env.API_SECRET_KEY;
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
      cache: options.cache || "no-cache",
    });
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
};
