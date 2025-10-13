# 🏩 SGM Front • Portal da Prefeitura (React + Vite)

Aplicação **React + Vite** para gestão e publicação de notícias da prefeitura, com **autenticação JWT**, **painel administrativo (Admin)** e **página pública** com destaque rotativo. Desenvolvido para integração com **API ASP.NET** (.NET 8, JWT + roles).

> **Destaques**
>
> * 🔐 Login com JWT, persistência e proteção de rotas
> * 👮‍♂️ Controle de acesso baseado em papéis (**Admin** x **Usuário**)
> * 📰 CRUD completo de notícias com categorias fixas
> * 🌐 Página pública de notícias com **hero rotativo** (imagem à esquerda, texto à direita)
> * 🔎 Busca e filtros sincronizados via **query string**
> * 📊 Dashboard com gráfico de publicações dos últimos 7 dias (Recharts)

---

## 🚀 Stack Tecnológica

* ⚛️ **React 18** + **Vite**
* 🦯 **React Router DOM**
* 💅 **Tailwind CSS**
* 📈 **Recharts**
* 🔑 **JWT Authentication**
* 🧩 **ESLint** + regras de boas práticas

---

## 🗂 Estrutura do Projeto

```markdown
src/
  api/
    auth.js
    noticias.js
  components/
    Navbar.jsx
    ProtectedRoute.jsx
  context/
    AuthContext.jsx
  layouts/
    Layout.jsx
  pages/
    Auth/
      LoginPage.jsx
    Dashboard.jsx
    Noticias/
      ListarNoticias.jsx
      CriarNoticia.jsx
      EditarNoticia.jsx
    Public/
      NoticiasPublicas.jsx
    Usuarios/
      ListarUsuarios.jsx
      CriarUsuario.jsx
      EditarUsuario.jsx
  router/
    AppRouter.jsx
main.jsx
index.css
```

---

## ⚙️ Configuração de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
VITE_API_BASE_URL=https://localhost:7258
```

> Ajuste conforme a URL real do backend (Azure, IIS, etc.)

---

## 🧑‍💻 Executando o Projeto

```bash
# instalar dependências
npm install

# rodar localmente
npm run dev

# gerar build de produção
npm run build

# visualizar o build
npm run preview
```

---

## 🔐 Autenticação e Autorização

* Login: `POST /api/Login` → `{ usuario, email, token }`
* Token salvo no `localStorage`
* Contexto (`AuthContext`) decodifica claims JWT:

  * `.../nameidentifier` → **userId**
  * `.../role` → **Role** (Admin/User)
  * `name`, `unique_name`, `email`
* Rotas protegidas: `<ProtectedRoute adminOnly>`

---

## 📰 Módulo de Notícias

**Categorias fixas:** `Institucional`, `Saúde`, `Educação`, `Esportes`, `Cultura`, `Policial`

**Endpoints principais:**

* `GET /api/Noticias`
* `GET /api/Noticias/{id}`
* `POST /api/Noticias`
* `PUT /api/Noticias/{id}`
* `DELETE /api/Noticias/{id}`
* `GET /api/Noticias/estatisticas/ultimos7dias` → usado no **Dashboard**

> Caso o backend aceite `PUT /api/Noticias` (sem `{id}`), o front já trata fallback automático para evitar erro 405.

---

## 🌐 Página Pública (`/portal`)

Arquivo: `src/pages/Public/NoticiasPublicas.jsx`

### ✨ Recursos:

* **Hero rotativo** (imagem à esquerda, texto à direita)
* Filtro por **categoria** e **busca** integrada
* **Paginação** client-side
* Normalização automática de URLs de imagem
* Fallback de imagem com SVG “Sem imagem”

### Exemplo de rota:

```jsx
import NoticiasPublicas from "../pages/Public/NoticiasPublicas";
<Route path="/portal" element={<NoticiasPublicas />} />
```

---

## 📊 Dashboard Administrativo

* Mostra gráfico com total de notícias publicadas por dia nos **últimos 7 dias**
* Baseado em `Recharts`
* Endpoint consumido: `GET /api/Noticias/estatisticas/ultimos7dias`

---

## 🥺 Scripts úteis

```bash
npm run lint
npx prettier --write .
```

---

## ⚠️ Troubleshooting

| Erro          | Causa Provável                                | Solução                     |
| ------------- | --------------------------------------------- | --------------------------- |
| 401 / 403     | Token inválido ou expirado                    | Refazer login               |
| 405           | PUT incorreto (endpoint diferente no backend) | Verificar rota e verbo HTTP |
| Falha de CORS | Configuração incorreta na API                 | Permitir origens no backend |

---

## 🛠️ Autor

**Giovani Godinho da Silva**
[sevenfullstack.com.br](https://sevenfullstack.com.br)
© 2025 Todos os direitos reservados.
README_EOF
