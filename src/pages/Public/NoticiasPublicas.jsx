// src/pages/Public/NoticiasPublicas.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://cnx-app-cadu-gev.azurewebsites.net/api/";

async function fetchNoticiasPublicas({ page = 1, pageSize = 12, q = "", categoria = "" }) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (q) qs.set("q", q);
  if (categoria) qs.set("categoria", categoria);
  const res = await fetch(`${API_BASE}/api/Noticias?${qs.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Falha ao carregar notícias");
  const data = await res.json();
  return Array.isArray(data) ? { items: data, total: data.length } : data;
}

const CATEGORIAS = ["", "Institucional", "Saúde", "Educação", "Esportes", "Cultura", "Policial"];
const simplify = (s = "") =>
  s?.normalize?.("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() ?? String(s).toLowerCase();
const normCat = (s = "") => simplify(s).toUpperCase();

// placeholder e helpers de imagem
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
      <rect width='1600' height='900' fill='#e5e7eb'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            font-size='64' fill='#9ca3af' font-family='sans-serif'>Sem imagem</text>
    </svg>`
  );
function urlImg(p) {
  if (!p) return PLACEHOLDER;
  const s = String(p).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`.replace(/([^:]\/)\/+/g, "$1");
}
function onImgError(e) {
  const img = e.currentTarget;
  img.src = PLACEHOLDER;
  img.onerror = null; // mantém object-cover e block
}

export default function NoticiasPublicas() {
  const [searchParams, setSearchParams] = useSearchParams();

  // filtros vindos da URL
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [categoria, setCategoria] = useState(() => searchParams.get("categoria") ?? "");
  const [page, setPage] = useState(() => Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get("pageSize") || 12));

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setCategoria(searchParams.get("categoria") ?? "");
    setPage(Number(searchParams.get("page") || 1));
    setPageSize(Number(searchParams.get("pageSize") || 12));
  }, [searchParams]);

  const updateParam = (next) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...next };
    Object.keys(merged).forEach((k) => {
      if (merged[k] === "" || merged[k] == null) delete merged[k];
    });
    setSearchParams(merged);
  };

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { items } = await fetchNoticiasPublicas({ page, pageSize, q, categoria });
        setAllItems(Array.isArray(items) ? items : []);
      } catch (e) {
        setErr(e.message || "Falha ao carregar");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize, q, categoria]);

  // filtro client-side
  const filtered = useMemo(() => {
    let arr = [...allItems];
    if (categoria) {
      const wanted = normCat(categoria);
      arr = arr.filter((n) => normCat(n.categoria) === wanted);
    }
    if (q.trim()) {
      const term = simplify(q.trim());
      arr = arr.filter((n) => simplify(n.titulo).includes(term) || simplify(n.conteudo).includes(term));
    }
    arr.sort((a, b) => {
      const da = a.criadoEm ? new Date(a.criadoEm).getTime() : 0;
      const db = b.criadoEm ? new Date(b.criadoEm).getTime() : 0;
      return db - da;
    });
    return arr;
  }, [allItems, q, categoria]);

  // ========= HERO ROTATIVO (1 item) =========
  const [heroIndex, setHeroIndex] = useState(0);

  // reseta o índice quando muda o conjunto
  useEffect(() => {
    setHeroIndex(0);
  }, [filtered.length, categoria, q]);

  // troca automática a cada 3s (só se houver 2+ itens)
  useEffect(() => {
    if (filtered.length <= 1) return;
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % filtered.length);
    }, 3000);
    return () => clearInterval(id);
  }, [filtered.length]);

  const heroItem = filtered[heroIndex];

  // paginação client-side para o GRID (abaixo do hero)
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // na página 1, não repetir o hero no grid
  const filteredExcludingHero = useMemo(
    () => filtered.filter((_, i) => !(page === 1 && i === heroIndex)),
    [filtered, heroIndex, page]
  );

  const start = (page - 1) * pageSize - (page === 1 ? 1 : 0);
  const safeStart = Math.max(0, start);
  const gridItems = filteredExcludingHero.slice(
    safeStart,
    safeStart + (page === 1 ? pageSize - 1 : pageSize)
  );

  // handlers
  const onChangeCategoria = (e) => {
    const value = e.target.value;
    setCategoria(value);
    setPage(1);
    updateParam({ categoria: value, page: 1 });
  };
  const onChangeBusca = (e) => {
    const value = e.target.value;
    setQ(value);
    setPage(1);
    updateParam({ q: value, page: 1 });
  };

  const goFirst = () => { setPage(1); updateParam({ page: 1 }); };
  const goPrev = () => { const p = Math.max(1, page - 1); setPage(p); updateParam({ page: p }); };
  const goNext = () => { const p = Math.min(totalPages, page + 1); setPage(p); updateParam({ page: p }); };
  const goLast = () => { setPage(totalPages); updateParam({ page: totalPages }); };
  const onChangePageSize = (e) => {
    const ps = Number(e.target.value);
    setPageSize(ps);
    setPage(1);
    updateParam({ pageSize: ps, page: 1 });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* topo */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-slate-900">Prefeitura Municipal de Juiz de Fora</Link>
          <Link to="/login" className="text-sm px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100">
            Acessar Gerenciador
          </Link>
        </div>
      </header>

      {/* HERO ÚNICO (rotativo) - imagem à esquerda, texto à direita */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {heroItem ? (
          <article className="rounded-3xl shadow-sm overflow-hidden border bg-white">
            <div className="flex flex-col md:flex-row">
              {/* Imagem à esquerda (mantém proporção, não estica) */}
              <div className="md:w-1/2 w-full">
                {/* Mobile: 16:9; Desktop: altura fixa */}
                <div className="aspect-[16/9] md:aspect-auto md:h-80 w-full overflow-hidden">
                  <img
                    key={heroItem.id}
                    src={urlImg(heroItem.caminhoFoto)}
                    onError={onImgError}
                    alt={heroItem.titulo}
                    className="block h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Texto à direita */}
              <div className="md:w-1/2 w-full p-6 flex flex-col justify-center">
                <span className="inline-block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                  {heroItem.categoria}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                  {heroItem.titulo}
                </h1>
                <p className="mt-3 text-slate-700 line-clamp-4 md:line-clamp-5">
                  {heroItem.conteudo}
                </p>
                {/* <div className="mt-4 text-sm text-slate-500">{formatDate(heroItem.criadoEm)}</div> */}
              </div>
            </div>

            {/* indicadores (bolinhas) */}
            {filtered.length > 1 && (
              <div className="p-3 flex justify-end gap-1 border-t bg-slate-50">
                {filtered.slice(0, Math.min(filtered.length, 8)).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 w-2 rounded-full ${i === heroIndex ? "bg-slate-700" : "bg-slate-300"}`}
                  />
                ))}
              </div>
            )}
          </article>
        ) : (
          <div className="h-80 rounded-3xl bg-slate-200" />
        )}
      </section>

      {/* filtros + grid */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="flex gap-2 items-center">
            <select value={categoria} onChange={onChangeCategoria} className="bg-white border rounded-lg px-3 py-2">
              {CATEGORIAS.map((c) => (
                <option key={c || "todas"} value={c}>
                  {c || "Todas as categorias"}
                </option>
              ))}
            </select>
            <input
              value={q}
              onChange={onChangeBusca}
              placeholder="Buscar notícias…"
              className="bg-white border rounded-lg px-3 py-2 w-64"
            />
          </div>
          <div className="text-sm text-slate-600">
            {total} resultado{total !== 1 ? "s" : ""}
          </div>
        </div>

        {err && <p className="mt-4 text-red-600">{err}</p>}
        {loading && <p className="mt-4">Carregando…</p>}

        {!loading && !err && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridItems.map((n) => (
              <article key={n.id} className="group overflow-hidden rounded-2xl bg-white border hover:shadow transition">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-t-2xl">
                  <img
                    src={urlImg(n.caminhoFoto)}
                    onError={onImgError}
                    alt={n.titulo}
                    className="block h-full w-full object-cover group-hover:scale-[1.02] transition"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">{n.categoria}</span>
                    <time className="text-xs text-slate-500">{formatDate(n.criadoEm)}</time>
                  </div>
                  <h3 className="mt-1 font-semibold line-clamp-2">{n.titulo}</h3>
                  <p className="text-sm text-slate-600 line-clamp-3 mt-1">{n.conteudo}</p>
                </div>
              </article>
            ))}
            {gridItems.length === 0 && (
              <p className="col-span-full text-slate-500">Sem notícias para os filtros atuais.</p>
            )}
          </div>
        )}

        {/* paginação */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={goFirst} className="px-3 py-1.5 rounded border bg-white" disabled={page <= 1}>
              « Primeiro
            </button>
            <button onClick={goPrev} className="px-3 py-1.5 rounded border bg-white" disabled={page <= 1}>
              ‹ Anterior
            </button>
            <button onClick={goNext} className="px-3 py-1.5 rounded border bg-white" disabled={page >= totalPages}>
              Próxima ›
            </button>
            <button onClick={goLast} className="px-3 py-1.5 rounded border bg-white" disabled={page >= totalPages}>
              Última »
            </button>
          </div>
          <select value={pageSize} onChange={onChangePageSize} className="bg-white border rounded px-2 py-1">
            {[6, 12, 18, 24].map((s) => (
              <option key={s} value={s}>
                {s}/página
              </option>
            ))}
          </select>
        </div>
      </section>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-600 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Prefeitura Municipal de Juiz de Fora</span>
          <Link to="/login" className="underline underline-offset-2">
            Acessar Gerenciador
          </Link>
        </div>
      </footer>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}
