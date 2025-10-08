import api from "./axios.js";

export const getUsuarios = () => api.get("/usuarios").then(r => r.data);
export const getUsuarioById = (id) => api.get(`/usuarios/${id}`).then(r => r.data);
export const createUsuario = (payload) => api.post("/usuarios", payload).then(r => r.data);
export const updateUsuario = (id, payload) => api.put(`/usuarios`, { id, ...payload }).then(r => r.data);
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`);
