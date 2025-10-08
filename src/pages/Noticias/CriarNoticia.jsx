// src/pages/Noticias/CriarNoticia.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNoticia } from "../../api/noticias";
import { useAuth } from "../../context/AuthContext";

const CATEGORIAS = [
  "Institucional",
  "Saúde",
  "Educação",
  "Esportes",
  "Cultura",
  "Policial",
];

// --- Helpers JWT ---
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

// Tenta achar um GUID válido no token (nameidentifier/sub/uid...).
function getUserIdFromPayload(p) {
  const NAMEID = "http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier";
  const candidates = [
    p?.[NAMEID],
    p?.nameid,
    p?.sub,
    p?.uid,
    p?.userId,
    p?.userid,
    p?.["user_id"],
  ].filter(Boolean);

  const guidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  return candidates.find((v) => typeof v === "string" && guidRegex.test(v)) || null;
}

export default function CriarNoticia() {
  const nav = useNavigate();
  const { token, user } = useAuth(); // se o AuthContext já guarda user.id do login, usamos aqui

  // 1) preferimos o id vindo do AuthContext (user.id)
  // 2) fallback: decodifica o JWT
  const payload = useMemo(() => (token ? parseJwt(token) : {}), [token]);
  const usuarioId = useMemo(() => {
    return user?.id || getUserIdFromPayload(payload);
  }, [user, payload]);

  const [form, setForm] = useState({
    titulo: "",
    categoria: "",
    conteudo: "",
    caminhoFoto: "",
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!usuarioId) {
      setErr("Não foi possível identificar o usuário logado. Faça login novamente.");
      return;
    }

    if (!CATEGORIAS.includes(form.categoria)) {
      setErr("Selecione uma categoria válida.");
      return;
    }

    setSaving(true);
    try {
      await createNoticia({
        titulo: form.titulo,
        conteudo: form.conteudo,
        categoria: form.categoria,
        usuarioId, // GUID do usuário logado (AuthContext ou JWT)
        ...(form.caminhoFoto ? { caminhoFoto: form.caminhoFoto } : {}),
      });
      nav("/noticias");
    } catch {
      setErr("Erro ao criar notícia.");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    form.titulo.trim() &&
    form.conteudo.trim() &&
    CATEGORIAS.includes(form.categoria) &&
    !!usuarioId;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nova Notícia</h1>
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
          <p className="text-xs text-gray-500 mt-1">
            Opções fixas definidas pelo sistema.
          </p>
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
          <p className="text-xs text-gray-500 mt-1">
            O backend espera uma <em>string</em> (caminho/URL) — não é upload multipart.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || !canSubmit}
            className={`px-4 py-2 rounded text-white ${saving || !canSubmit ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600"}`}
          >
            {saving ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}
