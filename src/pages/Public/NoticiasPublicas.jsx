import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cnx-app-cadu-gev.azurewebsites.net";

async function fetchNoticiasPublicas({ page = 1, pageSize = 12, q = "", categoria = "" }) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));
  if (q) qs.set("q", q);
  if (categoria) qs.set("categoria", categoria);

  const res = await fetch(`${API_BASE}/api/Noticias?${qs.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Falha ao carregar notícias públicas");
  }

  const data = await res.json();

  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }

  if (data?.items) {
    return { items: data.items, total: data.total ?? data.items.length };
  }

  return { items: [], total: 0 };
}

const CATEGORIAS = ["", "Institucional", "Saúde", "Educação", "Esportes", "Cultura", "Policial"];

const simplify = (s = "") =>
  s?.normalize?.("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() ?? String(s).toLowerCase();

const normCat = (s = "") => simplify(s).toUpperCase();

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
  if (!s) return PLACEHOLDER;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) {
    return `${API_BASE}${s}`.replace(/([^:]\/)\/+/g, "$1");
  }
  return `${API_BASE}/${s}`.replace(/([^:]\/)\/+/g, "$1");
}

function onImgError(e) {
  const img = e.currentTarget;
  img.src = PLACEHOLDER;
  img.onerror = null;
}

export default function NoticiasPublicas() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [categoria, setCategoria] = useState(() => searchParams.get("categoria") ?? "");
  const [page, setPage] = useState(() => Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState(() => Number(searchParams.get("pageSize") || 12));

  useEffect(() => {
    const nextQ = searchParams.get("q") ?? "";
    const nextCategoria = searchParams.get("categoria") ?? "";
    const nextPage = Number(searchParams.get("page") || 1);
    const nextPageSize = Number(searchParams.get("pageSize") || 12);

    setQ((prev) => (prev === nextQ ? prev : nextQ));
    setCategoria((prev) => (prev === nextCategoria ? prev : nextCategoria));
    setPage((prev) => (prev === nextPage ? prev : nextPage));
    setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize));
  }, [searchParams]);

  const updateParam = useCallback(
    (next) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        Object.entries(next).forEach(([key, value]) => {
          const shouldDelete =
            value === undefined ||
            value === null ||
            value === "" ||
            (key === "page" && Number(value) === 1) ||
            (key === "pageSize" && Number(value) === 12);
          if (shouldDelete) params.delete(key);
          else params.set(key, String(value));
        });
        return params;
      });
    },
    [setSearchParams]
  );

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modalItem, setModalItem] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroIndexRef = useRef(0);
  const [gridItems, setGridItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const { items } = await fetchNoticiasPublicas({ page, pageSize, q, categoria });
        if (!cancelled) {
          setAllItems(items);
        }
      } catch (error) {
        if (!cancelled) {
          setErr(error.message ?? "Erro ao carregar notícias");
          setAllItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, q, categoria]);

  const filtered = useMemo(() => {
    const qNorm = simplify(q);
    const catNorm = normCat(categoria);
    return allItems.filter((item) => {
      const itemCat = normCat(item?.categoria ?? "");
      const matchesCategoria = !catNorm || itemCat === catNorm;
      if (!qNorm) return matchesCategoria;
      const titulo = simplify(item?.titulo ?? "");
      const conteudo = simplify(item?.conteudo ?? "");
      const resumo = simplify(item?.resumo ?? "");
      const matchesBusca =
        titulo.includes(qNorm) || conteudo.includes(qNorm) || resumo.includes(qNorm);
      return matchesCategoria && matchesBusca;
    });
  }, [allItems, q, categoria]);

  useEffect(() => {
    if (heroIndex >= filtered.length) {
      setHeroIndex(0);
    }
  }, [filtered.length, heroIndex]);

  useEffect(() => {
    setHeroIndex(0);
  }, [filtered.length, categoria, q]);

  useEffect(() => {
    if (filtered.length < 2) return undefined;
    const id = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % filtered.length);
    }, 6000);
    return () => clearInterval(id);
  }, [filtered]);

  useEffect(() => {
    heroIndexRef.current = heroIndex;
  }, [heroIndex]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
      updateParam({ page: totalPages });
    }
  }, [filtered.length, page, pageSize, updateParam]);

  const heroItem = filtered[heroIndex];
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (!filtered.length) {
      setGridItems([]);
      return;
    }

    const cappedHeroIdx =
      filtered.length === 0
        ? -1
        : Math.min(heroIndexRef.current, Math.max(filtered.length - 1, 0));

    const baseList =
      page === 1 && cappedHeroIdx >= 0
        ? filtered.filter((_, index) => index !== cappedHeroIdx)
        : filtered;

    const adjustedPageOffset = (page - 1) * pageSize - (page === 1 ? 1 : 0);
    const safeStart = Math.max(0, adjustedPageOffset);
    const visibleCount = page === 1 ? Math.max(pageSize - 1, 0) : pageSize;

    setGridItems(baseList.slice(safeStart, safeStart + visibleCount));
  }, [filtered, page, pageSize]);
  const gridItemsLength = gridItems.length;

  const shareLinks = useMemo(() => {
    if (!modalItem) return [];
    if (typeof window === "undefined") return [];

    const { origin, pathname, search } = window.location;
    const params = new URLSearchParams(search);
    const itemId = modalItem.id ?? modalItem.slug ?? modalItem.titulo ?? "";
    if (itemId) params.set("noticia", String(itemId));
    const query = params.toString();
    const baseUrl = `${origin}${pathname}`;
    const shareUrl = query ? `${baseUrl}?${query}` : baseUrl;
    const title = (modalItem.titulo ?? "Confira esta notícia").trim();
    const description = (modalItem.resumo ?? modalItem.conteudo ?? "").trim();
    const shortDescription = description.length > 140 ? `${description.slice(0, 137)}...` : description;

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(shortDescription || title);
    const whatsappText = encodeURIComponent(`${title}\n${shareUrl}`);

    return [
      {
        name: "WhatsApp",
        type: "whatsapp",
        href: `https://api.whatsapp.com/send?text=${whatsappText}`,
        className: "bg-emerald-500 hover:bg-emerald-600",
      },
      {
        name: "Facebook",
        type: "facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        className: "bg-blue-600 hover:bg-blue-700",
      },
      {
        name: "X (Twitter)",
        type: "x",
        href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
        className: "bg-slate-900 hover:bg-black",
      },
      {
        name: "LinkedIn",
        type: "linkedin",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
        className: "bg-sky-700 hover:bg-sky-800",
      },
    ];
  }, [modalItem]);

  const onChangeCategoria = (event) => {
    const value = event.target.value;
    setCategoria(value);
    setPage(1);
    updateParam({ categoria: value, page: 1 });
  };

  const onChangeBusca = (event) => {
    const value = event.target.value;
    setQ(value);
    setPage(1);
    updateParam({ q: value, page: 1 });
  };

  const goFirst = () => {
    setPage(1);
    updateParam({ page: 1 });
  };

  const goPrev = () => {
    const nextPage = Math.max(1, page - 1);
    setPage(nextPage);
    updateParam({ page: nextPage });
  };

  const goNext = () => {
    const nextPage = Math.min(totalPages, page + 1);
    setPage(nextPage);
    updateParam({ page: nextPage });
  };

  const goLast = () => {
    setPage(totalPages);
    updateParam({ page: totalPages });
  };

  const onChangePageSize = (event) => {
    const nextPageSize = Number(event.target.value);
    setPageSize(nextPageSize);
    setPage(1);
    updateParam({ pageSize: nextPageSize, page: 1 });
  };

  const openModal = (item) => setModalItem(item);
  const closeModal = () => setModalItem(null);

  useEffect(() => {
    if (!modalItem) return undefined;
    const handler = (event) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalItem]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 lg:px-8">
      <header className="flex flex-col gap-6 rounded-3xl bg-white/90 p-6 shadow-sm backdrop-blur">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Portal de Notícias da Prefeitura de Juiz de Fora</h1>
          <p className="mt-2 text-sm text-slate-600">
            Fique por dentro das novidades do município em todas as áreas.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[2fr,1fr,auto]">
          <input
            value={q}
            onChange={onChangeBusca}
            placeholder="Buscar por título ou conteúdo"
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={categoria}
            onChange={onChangeCategoria}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat || "todas"} value={cat}>
                {cat ? cat : "Todas as categorias"}
              </option>
            ))}
          </select>
          <select
            value={pageSize}
            onChange={onChangePageSize}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {[6, 9, 12, 18].map((option) => (
              <option key={option} value={option}>
                {option} por página
              </option>
            ))}
          </select>
        </div>
      </header>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading && !err && (
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      )}

      {!loading && !err && filtered.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
          Nenhuma notícia encontrada para os filtros selecionados.
        </div>
      )}

      {!loading && !err && filtered.length > 0 && (
        <>
          {heroItem && (
            <section>
              <article
                className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition hover:shadow-xl md:h-[360px] md:flex-row"
                onClick={() => openModal(heroItem)}
                onKeyDown={(event) => event.key === "Enter" && openModal(heroItem)}
                role="button"
                tabIndex={0}
              >
                <div className="relative h-60 w-full overflow-hidden md:h-full md:w-1/2">
                  <img
                    src={urlImg(heroItem.caminhoFoto)}
                    onError={onImgError}
                    alt={heroItem.titulo}
                    className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/0 to-black/30" />
                </div>
                <div className="flex w-full flex-1 flex-col gap-4 p-6 md:w-1/2 md:justify-center md:p-8">
                  <span className="inline-flex w-max items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-700">
                    {heroItem.categoria}
                  </span>
                  <h2 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl md:text-4xl">
                    {heroItem.titulo}
                  </h2>
                  <time className="text-sm font-medium uppercase tracking-wide text-slate-500">
                    {formatDate(heroItem.criadoEm)}
                  </time>
                  <p className="text-sm leading-relaxed text-slate-600 md:text-base">
                    {heroItem.resumo ??
                      (heroItem.conteudo
                        ? heroItem.conteudo.slice(0, 260) +
                          (heroItem.conteudo.length > 260 ? "..." : "")
                        : "Clique para ler a notícia completa.")}
                  </p>
                </div>
              </article>
            </section>
          )}

          <section className="flex flex-col gap-6">
            <header className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {total} notícia{total === 1 ? "" : "s"} encontrada{total === 1 ? "" : "s"}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                Página {page} de {totalPages}
              </div>
            </header>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridItems.map((item) => (
                <article
                  key={item.id}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                  onClick={() => openModal(item)}
                  onKeyDown={(event) => event.key === "Enter" && openModal(item)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={urlImg(item.caminhoFoto)}
                      onError={onImgError}
                      alt={item.titulo}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 px-5 py-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700/80">
                      {item.categoria}
                    </span>
                    <h4 className="text-lg font-semibold text-slate-900 line-clamp-2">
                      {item.titulo}
                    </h4>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {item.resumo ??
                        (item.conteudo
                          ? item.conteudo.slice(0, 180) +
                            (item.conteudo.length > 180 ? "..." : "")
                          : "Clique para ler a notícia completa.")}
                    </p>
                    <time className="mt-auto text-xs font-medium uppercase text-slate-400">
                      {formatDate(item.criadoEm)}
                    </time>
                  </div>
                </article>
              ))}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <div className="text-slate-600">
                Exibindo {Math.min((page - 1) * pageSize + gridItemsLength + (page === 1 && heroItem ? 1 : 0), total)}{" "}
                de {total} notícias
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goFirst}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition enabled:hover:border-blue-500 enabled:hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Primeiro
                </button>
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition enabled:hover:border-blue-500 enabled:hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition enabled:hover:border-blue-500 enabled:hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
                <button
                  type="button"
                  onClick={goLast}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition enabled:hover:border-blue-500 enabled:hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Última
                </button>
              </div>
            </footer>
          </section>
        </>
      )}

      {modalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8"
          onClick={closeModal}
        >
          <div
            className="relative flex w-full max-w-4xl max-h-[85vh] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-slate-600 shadow hover:bg-white"
              aria-label="Fechar modal de notícia"
            >
              ×
            </button>
            <div className="h-64 shrink-0 overflow-hidden md:h-72">
              <img
                src={urlImg(modalItem.caminhoFoto)}
                onError={onImgError}
                alt={modalItem.titulo}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700/70">
                {modalItem.categoria}
              </span>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{modalItem.titulo}</h2>
              <time className="mt-1 block text-sm text-slate-500">
                {formatDate(modalItem.criadoEm)}
              </time>
              {shareLinks.length > 0 && (
                <div className="mt-5 border-t border-slate-200 pt-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Compartilhar
                  </span>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {shareLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.name}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${link.className}`}
                      >
                        <ShareIcon type={link.type} />
                        <span className="sr-only">{link.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700">
                {(modalItem.conteudo ?? "").split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {paragraph.trim()}
                  </p>
                ))}
                {!modalItem.conteudo && (
                  <p className="italic text-slate-500">Conteúdo completo indisponível.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}