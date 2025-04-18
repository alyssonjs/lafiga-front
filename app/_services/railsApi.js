import { apiClient } from '../_lib/api/client';

export async function fetchSchedules() {
  return apiClient.get('/api/v1/public/schedules');
}

export async function login(credentials) {
  try {
    // Faz a requisição POST para a rota /authenticate via proxy
    const response = await apiClient.post('/authenticate', credentials);
    return response; // esperado que a resposta contenha token, exp, user_infos, etc.
  } catch (error) {
    throw new Error('Erro ao efetuar login: ' + error.message);
  }
}

export async function logout() {
  try {
    const response = await apiClient.post('/api/auth/logout');
    return response;
  } catch (error) {
    throw new Error('Erro ao efetuar logout: ' + error.message);
  }
}