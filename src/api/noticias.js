const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://cnx-app-cadu-gev.azurewebsites.net";

function authHeaderJson() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getNoticias() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/Noticias`, { headers: authHeaderJson() });
    if (!res.ok) throw new Error("Falha ao listar notícias");
    return res.json();
  } catch (error) {
    throw new Error(error.message || "Erro de rede ao listar notícias");
  }
}

export async function getNoticia(id) {
  try {
    const res = await fetch(`${apiBaseUrl}/api/Noticias/${id}`, { headers: authHeaderJson() });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Falha ao carregar notícia");
    }
    return res.json();
  } catch (error) {
    throw new Error(error.message || "Erro de rede ao carregar notícia");
  }
}

export async function deleteNoticia(id) {
  try {
    const res = await fetch(`${apiBaseUrl}/api/Noticias/${id}`, {
      method: "DELETE",
      headers: authHeaderJson(),
    });
    if (!res.ok) throw new Error("Falha ao excluir notícia");
    return true;
  } catch (error) {
    throw new Error(error.message || "Erro de rede ao excluir notícia");
  }
}

export async function createNoticia(payload) {
  try {
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
  } catch (error) {
    throw new Error(error.message || "Erro de rede ao criar notícia");
  }
}

/**
 * Atualiza notícia (DTO esperado: AtualizarNoticiaDto)
 * Tenta PUT /api/Noticias/{id}; se 405, tenta PUT /api/Noticias (sem id na rota).
 */
export async function updateNoticia(id, payload) {
  const tryPut = async (url) => {
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: authHeaderJson(),
        body: JSON.stringify(payload), // { id, titulo, conteudo, categoria, caminhoFoto? }
      });
      return res;
    } catch (error) {
      throw new Error(error.message || "Erro de rede ao atualizar notícia");
    }
  };

  let res = await tryPut(`${apiBaseUrl}/api/Noticias/${id}`);

  if (res.status === 405) {
    res = await tryPut(`${apiBaseUrl}/api/Noticias`);
  }

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Não autorizado. Faça login novamente.");
    if (res.status === 403) throw new Error("Acesso negado. Somente administradores podem editar.");
    throw new Error(msg || "Falha ao atualizar notícia");
  }

  return res.json();
}

export async function getNoticiasUltimos7Dias() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/Noticias/estatisticas/ultimos7dias`, {
      headers: authHeaderJson(),
    });
    if (!res.ok) throw new Error("Falha ao buscar estatísticas de notícias");
    return res.json();
  } catch (error) {
    throw new Error(error.message || "Erro de rede ao buscar estatísticas de notícias");
  }
}
