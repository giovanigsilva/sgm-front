import api from "./axios.js";

export async function loginRequest(email, senha) {
  const { data } = await api.post("/login", { email, senha });
  // espera { usuario, email, token, isAdmin } da sua API
  return data;
}
