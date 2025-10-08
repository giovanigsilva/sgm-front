// src/components/Navbar.jsx
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <div className="bg-white border-b px-4 h-14 flex items-center justify-between">
      <h1 className="font-bold">Painel da Prefeitura de Juiz de Fora</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.name  || "Usuário"}
        </span>
        <button
          onClick={logout}
          className="px-3 py-1 rounded bg-gray-900 text-white text-sm"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
