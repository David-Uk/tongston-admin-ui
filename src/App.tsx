import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ToastProvider } from './components/ui/Toast'
import { AdminUsersPage } from './pages/AdminUsers'
import { AiRunsPage } from './pages/AiRuns'
import { ContentPage } from './pages/Content'
import { LoginPage } from './pages/Login'
import { MediaPage } from './pages/Media'
import { TokensPage } from './pages/Tokens'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/content" element={<ContentPage />} />
              <Route path="/ai-runs" element={<AiRunsPage />} />
              <Route path="/tokens" element={<TokensPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute admin>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="/" element={<Navigate to="/content" replace />} />
            <Route path="*" element={<Navigate to="/content" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
