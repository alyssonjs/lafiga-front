import { env } from '../../../env';

export const apiClient = {
  async get(endpoint, options = {}) {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: options.cache || 'default',
    });

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);

    return response.json();
  },

  async post(endpoint, body, options = {}) {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
      cache: options.cache || 'no-cache',
    });

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);

    return response.json();
  },

  async put(endpoint, body, options = {}) {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
      cache: options.cache || 'no-cache',
    });

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);

    return response.json();
  },

  async delete(endpoint, options = {}) {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: options.cache || 'no-cache',
    });

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);

    return response.json();
  },
};
