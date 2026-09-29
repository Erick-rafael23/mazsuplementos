import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  Boxes,
  ChevronRight,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const titles = {
  '/': 'Inicio',
  '/productos': 'Suplementos y servicios',
  '/usuarios': 'Usuarios',
  '/respaldos': 'Respaldos',
  '/no-autorizado': 'Acceso restringido',
};
export function Brand() {
  return (
    <div className="brand">
      <div className="brand-icon">
        <Zap size={25} fill="currentColor" />
      </div>
      <div>
        <strong>
          MAZ<span>®</span>
        </strong>
        <small>SUPLEMENTOS</small>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout, mode } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const links = [
    { to: '/', label: 'Inicio', icon: LayoutDashboard },
    ...(user.rol !== 'capturista' ? [{ to: '/usuarios', label: 'Usuarios', icon: Users }] : []),
    { to: '/productos', label: 'Suplementos y servicios', icon: Boxes },
    ...(user.rol === 'administrador'
      ? [{ to: '/respaldos', label: 'Respaldos', icon: Database }]
      : []),
  ];
  return (
    <div className="app-shell">
      {open && (
        <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
      )}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          <Brand />
          <button
            className="mobile-close icon-button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace">
          <span className="workspace-icon">M</span>
          <div>
            <strong>Mi tienda</strong>
            <small>Panel de administración</small>
          </div>
          <ShieldCheck size={17} />
        </div>
        <p className="nav-label">PRINCIPAL</p>
        <nav aria-label="Navegación principal">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              <Icon size={19} />
              <span>{label}</span>
              <ChevronRight size={15} className="nav-chevron" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-dot" />
            <strong>Todo en un solo lugar</strong>
            <p>
              Tu catálogo, tu equipo.
              <br />
              El control de tu tienda.
            </p>
            <ArrowUpRight size={20} />
          </div>
          <button className="logout" onClick={logout}>
            <LogOut size={18} />
            Cerrar sesión
          </button>
          <div className="sidebar-footer">
            MAZ Suplementos <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-toggle icon-button"
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span>Mi tienda</span>
            <ChevronRight size={14} />
            <strong>{titles[pathname] || 'Página no encontrada'}</strong>
          </div>
          <div className="topbar-right">
            <span className={`connection-pill ${mode === 'demo' ? 'demo' : ''}`}>
              <span className="tiny-dot" />
              {mode === 'demo'
                ? 'Demo local'
                : mode === 'tidb'
                  ? 'TiDB conectado'
                  : 'Sesión activa'}
            </span>
            <div className="profile">
              <span className="avatar">
                {user.nombre
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <div>
                <strong>{user.nombre}</strong>
                <small>{user.rol}</small>
              </div>
            </div>
          </div>
        </header>
        {mode === 'demo' && (
          <div className="demo-banner">
            Modo demostración · Los datos se guardan en este equipo, no en TiDB.
          </div>
        )}
        <main className="main-content">
          <Outlet />
        </main>
        <footer className="main-footer">
          <span>© {new Date().getFullYear()} MAZ Suplementos</span>
          <span>
            Hecho para impulsar tu tienda <Zap size={12} />
          </span>
        </footer>
      </div>
    </div>
  );
}
