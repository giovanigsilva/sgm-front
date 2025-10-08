const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://localhost:7258";

function authHeaderJson() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getNoticias() {
  const res = await fetch(`${apiBaseUrl}/api/Noticias`, { headers: authHeaderJson() });
  if (!res.ok) throw new Error("Falha ao listar notícias");
  return res.json();
}

export async function getNoticia(id) {
  const res = await fetch(`${apiBaseUrl}/api/Noticias/${id}`, { headers: authHeaderJson() });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Falha ao carregar notícia");
  }
  return res.json();
}

export async function deleteNoticia(id) {
  const res = await fetch(`${apiBaseUrl}/api/Noticias/${id}`, {
    method: "DELETE",
    headers: authHeaderJson(),
  });
  if (!res.ok) throw new Error("Falha ao excluir notícia");
  return true;
}

export async function createNoticia(payload) {
  const res = await fetch(`${apiBaseUrl}/api/Noticias`, {
    method: "POST",
    headers: authHeaderJson(),
    body: JSON.stringify(payload), // { titulo, conteudo, categoria, usuarioId, caminhoFoto? }
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Falha ao criar notícia");
  }
  return res.json();
}

/**
 * Atualiza notícia (DTO esperado: AtualizarNoticiaDto)
 * Tenta PUT /api/Noticias/{id}; se 405, tenta PUT /api/Noticias (sem id na rota).
 */
export async function updateNoticia(id, payload) {
  const tryPut = async (url) => {
    const res = await fetch(url, {
      method: "PUT",
      headers: authHeaderJson(),
      body: JSON.stringify(payload), // { id, titulo, conteudo, categoria, caminhoFoto? }
    });
    return res;
  };

  // 1) tenta /{id}
  let res = await tryPut(`${apiBaseUrl}/api/Noticias/${id}`);

  // 405 = Method Not Allowed -> provavelmente rota é sem {id}
  if (res.status === 405) {
    res = await tryPut(`${apiBaseUrl}/api/Noticias`);
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    // mensagens úteis pra auth/role
    if (res.status === 401) throw new Error("Não autorizado. Faça login novamente.");
    if (res.status === 403) throw new Error("Acesso negado. Somente administradores podem editar.");
    throw new Error(msg || "Falha ao atualizar notícia");
  }

  return res.json();
}

export async function getNoticiasUltimos7Dias() {
  const res = await fetch(`${apiBaseUrl}/api/Noticias/estatisticas/ultimos7dias`, {
    headers: authHeaderJson(),
  });
  if (!res.ok) throw new Error("Falha ao buscar estatísticas de notícias");
  return res.json();
}
