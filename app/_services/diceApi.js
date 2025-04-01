const baseURL = 'https://dice-api-7um7.onrender.com';
const defaultHeaders = {
  'Content-Type': 'application/json',
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro na requisição');
  }
  return response.json();
};

const diceApi = {
  post: async (endpoint, data) => {
    const response = await fetch(`${baseURL}${endpoint}`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  get: async (endpoint) => {
    const response = await fetch(`${baseURL}${endpoint}`, {
      method: 'GET',
      headers: defaultHeaders,
    });
    return handleResponse(response);
  },
};

export default diceApi;