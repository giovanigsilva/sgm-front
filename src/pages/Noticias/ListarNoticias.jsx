// src/pages/Noticias/ListarNoticias.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getNoticias, deleteNoticia } from "../../api/noticias";
import { useAuth } from "../../context/AuthContext";

const CATEGORIAS = ["Institucional", "Saúde", "Educação", "Esportes", "Cultura", "Policial"];
const PAGE_SIZES = [5, 10, 20];

export default function ListarNoticias() {
  const { isAdmin } = useAuth();

  const [raw, setRaw] = useState([]);           // dados crus da API
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState(null);
  const [error, setError] = useState("");

  // filtros
  const [q, setQ] = useState("");               // busca texto
  const [categoria, setCategoria] = useState(""); // filtro categoria

  // paginação
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const list = await getNoticias();
        // Normaliza datas se vierem como string
        setRaw(Array.isArray(list) ? list : []);
      } catch {
        setError("Falha ao carregar notícias");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtrados = useMemo(() => {
    let arr = raw;

    if (categoria) {
      arr = arr.filter(n => n.categoria === categoria);
    }

    if (q.trim()) {
      const term = q.trim().toLowerCase();
      arr = arr.filter(n =>
        (n.titulo || "").toLowerCase().includes(term) ||
        (n.conteudo || "").toLowerCase().includes(term)
      );
    }

    // ordena por data desc se existir, senão pelo título
    arr = [...arr].sort((a, b) => {
      const da = a.criadoEm ? new Date(a.criadoEm).getTime() : 0;
      const db = b.criadoEm ? new Date(b.criadoEm).getTime() : 0;
      if (db !== da) return db - da;
      return String(a.titulo || "").localeCompare(String(b.titulo || ""));
    });

    return arr;
  }, [raw, q, categoria]);

  const total = filtrados.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // garante página válida ao mudar filtros/tamanho
  useEffect(() => {
    setPage(1);
  }, [q, categoria, pageSize]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, page, pageSize]);

  const onDelete = async (id) => {
    if (!confirm("Excluir esta notícia?")) return;
    setDeletando(id);
    try {
      await deleteNoticia(id);
      setRaw(prev => prev.filter(n => n.id !== id));
    } catch {
      alert("Erro ao excluir.");
    } finally {
      setDeletando(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      // dd/MM/yyyy HH:mm
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    } catch {
      return "-";
    }
  };

  if (loading) return <p>Carregando…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Notícias</h1>

        <div className="flex gap-2">
          {/* filtro categoria */}
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="border rounded px-2 py-1 bg-white"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* busca */}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título ou conteúdo…"
            className="border rounded px-2 py-1 w-56"
          />

          {/* tamanho página */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1 bg-white"
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}/página</option>)}
          </select>

          {/* novo (só Admin) */}
          {isAdmin && (
            <Link to="/noticias/nova" className="px-3 py-2 rounded bg-blue-600 text-white">
              Nova Notícia
            </Link>
          )}
        </div>
      </div>

      {/* tabela */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full bg-white rounded border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Título</th>
              <th className="p-2 text-left">Categoria</th>
              <th className="p-2 text-left">Autor</th>
              <th className="p-2 text-left">Criado em</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(n => (
              <tr key={n.id} className="border-t">
                <td className="p-2 align-top">
                  <div className="font-medium">{n.titulo}</div>
                </td>
                <td className="p-2 align-top">{n.categoria || "-"}</td>
                <td className="p-2 align-top">{n.autor || "-"}</td>
                <td className="p-2 align-top">{formatDate(n.criadoEm)}</td>
                <td className="p-2 align-top text-right space-x-2 whitespace-nowrap">
                  {isAdmin ? (
                    <>
                      <Link
                        to={`/noticias/editar/${n.id}`}
                        className="px-3 py-1 text-sm rounded bg-amber-500 text-white"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => onDelete(n.id)}
                        className="px-3 py-1 text-sm rounded bg-red-600 text-white"
                        disabled={deletando === n.id}
                      >
                        {deletando === n.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">Somente leitura</span>
                  )}
                </td>
              </tr>
            ))}

            {pageItems.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={5}>
                  Nenhum resultado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* paginação */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {total} resultado{total !== 1 ? "s" : ""} • Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border bg-white"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            « Primeiro
          </button>
          <button
            className="px-3 py-1 rounded border bg-white"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ‹ Anterior
          </button>
          <button
            className="px-3 py-1 rounded border bg-white"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima ›
          </button>
          <button
            className="px-3 py-1 rounded border bg-white"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            Última »
          </button>
        </div>
      </div>
    </div>
  );
}
