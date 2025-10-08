// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/Auth/LoginPage";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../layouts/Layout";
import NoticiasPublicas from "../pages/Public/NoticiasPublicas";
// Páginas existentes
import Dashboard from "../pages/Dashboard";
import ListarNoticias from "../pages/Noticias/ListarNoticias";

// Admin (Usuários) existentes
import ListarUsuarios from "../pages/Usuarios/ListarUsuarios";
import CriarUsuario from "../pages/Usuarios/CriarUsuario";
import EditarUsuario from "../pages/Usuarios/EditarUsuario";

// Notícias (Admin)
import CriarNoticia from "../pages/Noticias/CriarNoticia";
import EditarNoticia from "../pages/Noticias/EditarNoticia"; // ✅ IMPORT FALTANDO

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Área logada */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Notícias - Listar (qualquer usuário autenticado) */}
        <Route
          path="/noticias"
          element={
            <ProtectedRoute>
              <Layout><ListarNoticias /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Notícias - Criar (somente Admin) */}
        <Route
          path="/noticias/nova"
          element={
            <ProtectedRoute adminOnly>
              <Layout><CriarNoticia /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Notícias - Editar (somente Admin) */}
        <Route
          path="/noticias/editar/:id"
          element={
            <ProtectedRoute adminOnly>
              <Layout><EditarNoticia /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Área Administrativa de Usuários (somente Admin) */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute adminOnly>
              <Layout><ListarUsuarios /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios/novo"
          element={
            <ProtectedRoute adminOnly>
              <Layout><CriarUsuario /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios/editar/:id"
          element={
            <ProtectedRoute adminOnly>
              <Layout><EditarUsuario /></Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 opcional */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-6">
                  <h2 className="text-xl font-semibold">Página não encontrada</h2>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/portal/noticias" element={<NoticiasPublicas />} />
      </Routes>
    </BrowserRouter>
  );
}
