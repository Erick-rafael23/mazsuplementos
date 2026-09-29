import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Zap } from 'lucide-react';
import { Brand } from '../components/Layout';
import { Loading } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

export default function Login() {
  const { user, loading, login, mode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (loading) return <Loading full />;
  if (user) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(correo, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <Brand />
        <div className="login-story-copy">
          <span className="light-tag">
            <Zap size={14} /> ENERGÍA PARA TU NEGOCIO
          </span>
          <h1>
            Una tienda fuerte.
            <br />
            <em>Empieza contigo.</em>
          </h1>
          <p>Administra tu catálogo, conecta a tu equipo y mantén el control de cada detalle.</p>
          <div className="abstract-mark" aria-hidden="true">
            <div />
            <div />
            <div />
          </div>
        </div>
        <div className="login-story-footer">
          <span>MAZ SUPLEMENTOS</span>
          <span>FUERZA. ENFOQUE. PROGRESO.</span>
        </div>
      </section>
      <section className="login-form-side">
        <span className="login-topline">TU ESPACIO DE TRABAJO</span>
        <div className="login-form-wrap">
          <div className="login-symbol">
            <LockKeyhole size={23} />
          </div>
          <p className="eyebrow">QUÉ BUENO TENERTE DE VUELTA</p>
          <h2>Inicia sesión</h2>
          <p className="muted">Ingresa tus datos para administrar tu tienda.</p>
          <form onSubmit={submit}>
            <label>
              Correo electrónico
              <div className="input-icon">
                <Mail size={18} />
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="username"
                  required
                  maxLength={190}
                />
              </div>
            </label>
            <label>
              Contraseña
              <div className="input-icon">
                <LockKeyhole size={18} />
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary login-submit" disabled={busy}>
              {busy ? 'Iniciando sesión…' : 'Entrar a mi tienda'}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-security">
            <ShieldCheck size={16} /> Acceso seguro según tu rol
          </div>
          {mode === 'demo' && (
            <div className="demo-credentials">
              <strong>Demostración local</strong>
              <p>
                Contraseña: <code>MazDemo2026!</code>
              </p>
              <div>
                {[
                  ['Admin', 'admin'],
                  ['Capturista', 'capturista'],
                  ['Auditor', 'auditor'],
                ].map(([label, mail]) => (
                  <button
                    key={mail}
                    type="button"
                    onClick={() => {
                      setCorreo(`${mail}@maz.local`);
                      setPassword('MazDemo2026!');
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="login-bottom">¿Necesitas acceso? Contacta al administrador de tu tienda.</p>
      </section>
    </div>
  );
}
