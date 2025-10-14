import api from "./axios.js";

export async function loginRequest(email, senha, captchaToken) {
  const payload = { email, senha };
  if (captchaToken) {
    payload.captchaToken = captchaToken;
  }

  const { data } = await api.post("/login", payload);
  // espera { usuario, email, token, isAdmin } da sua API
  return data;
}
