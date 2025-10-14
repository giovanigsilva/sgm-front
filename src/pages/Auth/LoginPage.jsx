// src/pages/Auth/LoginPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(() => !RECAPTCHA_SITE_KEY);

  const redirectTo = (() => {
    const raw = searchParams.get("redirect");
    if (!raw) return "/";
    try {
      return decodeURIComponent(raw);
    } catch {
      return "/";
    }
  })();

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;

    const existing = document.querySelector("script[data-recaptcha-v3]");
    if (existing) {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => setCaptchaReady(true));
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptchaV3 = "true";
    script.onload = () => {
      window.grecaptcha?.ready(() => setCaptchaReady(true));
    };
    script.onerror = () => {
      setErr("Não foi possível carregar o serviço reCAPTCHA. Atualize a página e tente novamente.");
    };

    document.head.appendChild(script);

    return () => {
      // Mantemos o script carregado para reuso caso o usuário retorne à tela.
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email || !senha) {
      setErr("Informe e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      let captchaToken = null;
      if (RECAPTCHA_SITE_KEY) {
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha || !captchaReady) {
          throw new Error("Não foi possível validar o reCAPTCHA. Atualize a página e tente novamente.");
        }
        captchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "login" });
      }

      await login({ email, senha, captchaToken });
      nav(redirectTo);
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || "Falha no login";
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100"
      >
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Acessar o sistema</h2>
          <p className="mt-2 text-sm text-slate-500">
            Faça login com suas credenciais administrativas.
          </p>
        </div>

        <label className="mb-4 block">
          <span className="text-sm font-medium text-slate-700">E-mail</span>
          <input
            type="email"
            autoComplete="username"
            required
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="mb-4 block">
          <span className="text-sm font-medium text-slate-700">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
          />
        </label>

        {err && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (RECAPTCHA_SITE_KEY && !captchaReady)}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {RECAPTCHA_SITE_KEY && (
          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
            Esta página é protegida pelo reCAPTCHA e está sujeita à
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 hover:underline"
            >
              Política de Privacidade
            </a>
            {" "}e aos
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 hover:underline"
            >
              Termos de Serviço
            </a>
            {" "}da Google.
          </p>
        )}
      </form>
    </div>
  );
}
