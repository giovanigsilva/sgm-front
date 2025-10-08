// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest } from "../api/auth";

const AuthContext = createContext(null);

// ==== Helpers ====
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) || {};
  } catch {
    return {};
  }
}

function extractRole(payload) {
  // tenta vários campos comuns
  const role =
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    payload.role ||
    (Array.isArray(payload.roles) ? payload.roles[0] : undefined);
  return role || null;
}

function extractIsAdmin(payload) {
  const r = extractRole(payload);
  return Array.isArray(r) ? r.includes("Admin") : r === "Admin";
}

function extractUserId(payload) {
  const NAMEID = "http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier";
  const candidates = [
    payload[NAMEID],
    payload.nameid,
    payload.sub,
    payload.uid,
    payload.userId,
    payload.userid,
    payload["user_id"],
  ].filter(Boolean);

  const guidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  return candidates.find((v) => typeof v === "string" && guidRegex.test(v)) || null;
}

// ==== Provider ====
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // Reconstroi user a partir do token, caso exista token mas não exista "user" salvo
  useEffect(() => {
    if (token && !user) {
      const p = parseJwt(token);
      const rebuilt = {
        id: extractUserId(p),
        role: extractRole(p),
        name:
          p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
          p.unique_name ||
          p.name ||
          "Usuário",
        email:
          p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
          p.email ||
          "",
        isAdmin: extractIsAdmin(p),
      };
      setUser(rebuilt);
      localStorage.setItem("user", JSON.stringify(rebuilt));
    }
  }, [token, user]);

  // Faz login e popula token + user (prioriza campos vindos da API)
  const login = async ({ email, senha }) => {
    const res = await loginRequest(email, senha);
    // Esperado: { usuario, email, usuarioId?, role?, token }
    const p = parseJwt(res.token);

    const finalUser = {
      id: res.usuarioId || extractUserId(p),
      role: res.role || extractRole(p),
      name: res.usuario ?? p.unique_name ?? p.name ?? email,
      email: res.email ?? email,
      isAdmin:
        typeof res.role === "string"
          ? res.role === "Admin"
          : extractIsAdmin(p),
    };

    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(finalUser));
    setToken(res.token);
    setUser(finalUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // valor memorizado para evitar re-renders desnecessários
  const value = useMemo(
    () => ({ token, user, isAdmin: !!user?.isAdmin, login, logout }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
