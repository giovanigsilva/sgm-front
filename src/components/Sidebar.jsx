// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const item = (to, label) => (
    <Link
      to={to}
      className={`block px-4 py-2 rounded hover:bg-blue-600 ${
        pathname === to ? "bg-blue-700" : ""
      }`}
    >
      {label}
    </Link>
  );
  return (
    <aside className="w-64 bg-blue-700 text-white p-4 space-y-2">
      <div className="text-xl font-semibold mb-4">Prefeitura JF</div>
      {item("/", "Dashboard")}
      {item("/noticias", "Notícias")}
      {user?.isAdmin && item("/usuarios", "Usuários")}
    </aside>
  );
}
