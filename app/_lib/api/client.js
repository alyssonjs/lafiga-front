import { env } from '@/env';

export const apiClient = {
  async get(endpoint, options) {
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.API_SECRET_KEY}`,
        ...options?.headers,
      },
      cache: options?.cache || 'default',
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    return response.json();
  },

  // Adicione métodos para POST, PUT, DELETE conforme necessário
};