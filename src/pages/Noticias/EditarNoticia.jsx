// src/pages/Noticias/EditarNoticia.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getNoticia, updateNoticia } from "../../api/noticias";
import { useAuth } from "../../context/AuthContext";

const CATEGORIAS = ["Institucional", "Saúde", "Educação", "Esportes", "Cultura", "Policial"];

export default function EditarNoticia() {
  const { id } = useParams();
  const nav = useNavigate();
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    titulo: "",
    categoria: "",
    conteudo: "",
    caminhoFoto: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const n = await getNoticia(id);
        setForm({
          titulo: n.titulo ?? "",
          categoria: n.categoria ?? "",
          conteudo: n.conteudo ?? "",
          caminhoFoto: n.caminhoFoto ?? "",
        });
      } catch (e) {
        setErr(e.message || "Falha ao carregar notícia");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canSubmit = useMemo(() =>
    form.titulo.trim() &&
    form.conteudo.trim() &&
    CATEGORIAS.includes(form.categoria), [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!isAdmin) {
      setErr("Apenas administradores podem editar notícias.");
      return;
    }
    if (!CATEGORIAS.includes(form.categoria)) {
      setErr("Selecione uma categoria válida.");
      return;
    }

    setSaving(true);
    try {
      await updateNoticia(id, {
        id, // AtualizarNoticiaDto requer Id no body
        titulo: form.titulo,
        conteudo: form.conteudo,
        categoria: form.categoria,
        ...(form.caminhoFoto ? { caminhoFoto: form.caminhoFoto } : { caminhoFoto: null }),
      });
      nav("/noticias");
    } catch (e) {
      setErr(e.message || "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Carregando…</p>;
  if (err && !saving) {
    return (
      <div className="max-w-2xl">
        <p className="mb-4 text-red-600">{err}</p>
        <Link to="/noticias" className="px-3 py-2 rounded bg-gray-200">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar Notícia</h1>
        <Link to="/noticias" className="px-3 py-2 rounded bg-gray-200">Voltar</Link>
      </div>

      {err && <div className="mt-3 p-2 bg-red-100 text-red-700 rounded">{err}</div>}

      <form onSubmit={onSubmit} className="mt-4 space-y-4 bg-white p-4 rounded border">
        <div>
          <label className="block text-sm mb-1">Título</label>
          <input
            name="titulo"
            value={form.titulo}
            onChange={onChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Categoria</label>
          <select
            name="categoria"
            value={form.categoria}
            onChange={onChange}
            className="border p-2 rounded w-full bg-white"
            required
          >
            <option value="" disabled>Selecione…</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Conteúdo</label>
          <textarea
            name="conteudo"
            value={form.conteudo}
            onChange={onChange}
            rows={8}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Caminho da Foto (opcional)</label>
          <input
            name="caminhoFoto"
            value={form.caminhoFoto}
            onChange={onChange}
            className="border p-2 rounded w-full"
            placeholder="URL completa"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || !canSubmit}
            className={`px-4 py-2 rounded text-white ${saving || !canSubmit ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600"}`}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
