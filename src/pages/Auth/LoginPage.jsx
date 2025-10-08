// src/pages/Auth/LoginPage.jsx
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, senha });
      nav("/");
    } catch {
      setErr("Falha no login");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-100">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4 text-center">
          Acessar o sistema
        </h2>
        <input
          type="email"
          placeholder="E-mail"
          className="border w-full p-2 mb-3 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          className="border w-full p-2 mb-3 rounded"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        {err && <div className="text-red-600 text-sm mb-3">{err}</div>}
        <button className="w-full bg-blue-700 text-white py-2 rounded">
          Entrar
        </button>
      </form>
    </div>
  );
}
