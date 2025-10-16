import api from "./axios.js";

const LOGIN_ENDPOINTS = ["/Auth/login", "/auth/login", "/login", "/Login", "/api/login"];

export async function loginRequest(email, senha, captchaToken) {
  const payload = { email, senha };
  if (captchaToken) payload.captchaToken = captchaToken;

  let lastError;

  for (const endpoint of LOGIN_ENDPOINTS) {
    try {
      const { data } = await api.post(endpoint, payload);
      return data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status === 401 || status === 400) throw error;
      if (status && ![404, 405].includes(status)) throw error;
    }
  }

  throw lastError ?? new Error("Não foi possível acessar o endpoint de login.");
}
