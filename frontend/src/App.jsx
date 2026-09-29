import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Backups from './pages/Backups';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="productos" element={<Catalog key="productos" kind="productos" />} />
          <Route element={<ProtectedRoute roles={['administrador', 'auditor']} />}>
            <Route path="usuarios" element={<Catalog key="usuarios" kind="usuarios" />} />
          </Route>
          <Route element={<ProtectedRoute roles={['administrador']} />}>
            <Route path="respaldos" element={<Backups />} />
          </Route>
          <Route path="no-autorizado" element={<NotFound forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
