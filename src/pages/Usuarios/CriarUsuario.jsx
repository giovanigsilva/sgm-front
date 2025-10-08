import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUsuario } from "../../api/usuarios";

export default function CriarUsuario() {
  const nav = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", senha: "", isAdmin: false });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      await createUsuario({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        isAdmin: form.isAdmin
      });
      nav("/usuarios");
    } catch {
      setErr("Erro ao criar usuário.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Novo Usuário</h1>
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
        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input type="password" name="senha" value={form.senha} onChange={onChange} className="border p-2 rounded w-full" required />
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="isAdmin" checked={form.isAdmin} onChange={onChange} />
          <span>Administrador</span>
        </label>

        <div className="pt-2">
          <button disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
