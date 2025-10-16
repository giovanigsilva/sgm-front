import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsuarios, deleteUsuario } from "../../api/usuarios";

const normalizeUsuarios = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload.items,
    payload.data,
    payload.result,
    payload.value,
    payload.usuarios,
    payload.users,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

export default function ListarUsuarios() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const raw = await getUsuarios();
        const list = normalizeUsuarios(raw);
        if (!Array.isArray(list) || list.length === 0) {
          setRows([]);
          if (Array.isArray(list)) {
            setErr("");
          } else {
            setErr("Nenhum usuário retornado pela API.");
          }
        } else {
          setRows(list);
        }
      } catch {
        setErr("Falha ao carregar usuários.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onDelete = async (id) => {
    if (!confirm("Excluir este usuário?")) return;
    setDeletando(id);
    try {
      await deleteUsuario(id);
      setRows(prev => prev.filter(x => x.id !== id));
      setMsg("Usuário excluído com sucesso.");
    } catch {
      setErr("Erro ao excluir usuário.");
    } finally {
      setDeletando(null);
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Link to="/usuarios/novo" className="px-3 py-2 rounded bg-blue-600 text-white">
          Novo Usuário
        </Link>
      </div>

      {msg && <div className="mt-3 p-2 bg-green-100 text-green-700 rounded">{msg}</div>}
      {err && <div className="mt-3 p-2 bg-red-100 text-red-700 rounded">{err}</div>}

      <table className="mt-4 w-full bg-white rounded border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Nome</th>
            <th className="text-left">Email</th>
            <th className="text-left">Admin</th>
            <th className="text-right pr-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.nome ?? u.name ?? u.usuario ?? "—"}</td>
              <td>{u.email ?? u.userEmail ?? "—"}</td>
              <td>{u.isAdmin || u.admin ? "Sim" : "Não"}</td>
              <td className="text-right p-2 space-x-2">
                <Link
                  to={`/usuarios/editar/${u.id}`}
                  className="px-3 py-1 text-sm rounded bg-amber-500 text-white"
                >
                  Editar
                </Link>
                <button
                  onClick={() => onDelete(u.id)}
                  className="px-3 py-1 text-sm rounded bg-red-600 text-white"
                  disabled={deletando === u.id}
                >
                  {deletando === u.id ? "Excluindo..." : "Excluir"}
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-500">Sem usuários.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
