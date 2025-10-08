import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUsuarioById, updateUsuario } from "../../api/usuarios";

export default function EditarUsuario() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", isAdmin: false, senha: "" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await getUsuarioById(id);
        setForm({ nome: u.nome, email: u.email, isAdmin: u.isAdmin, senha: "" });
      } catch {
        setErr("Falha ao carregar usuário.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      await updateUsuario(id, {
        nome: form.nome,
        email: form.email,
        isAdmin: form.isAdmin,
        ...(form.senha ? { senha: form.senha } : {}) // envia senha só se preenchida
      });
      nav("/usuarios");
    } catch {
      setErr("Erro ao atualizar usuário.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Editar Usuário</h1>
      {err && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">{err}</div>}

      <form onSubmit={onSubmit} className="space-y-3 bg-white p-4 rounded border">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input name="nome" value={form.nome} onChange={onChange} className="border p-2 rounded w-full" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={onChange} className="border p-2 rounded w-full" required />
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="isAdmin" checked={form.isAdmin} onChange={onChange} />
          <span>Administrador</span>
        </label>
        <div>
          <label className="block text-sm mb-1">Senha (opcional)</label>
          <input type="password" name="senha" value={form.senha} onChange={onChange} className="border p-2 rounded w-full" placeholder="Deixe vazio para manter a atual" />
        </div>

        <div className="pt-2">
          <button disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white">
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
