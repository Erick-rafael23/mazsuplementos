import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  Database,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage, money } from '../services/api';
import { EmptyState, ErrorState, Loading, PageTitle, Status } from '../components/UI';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [products, users] = await Promise.all([
        api.get('/productos'),
        user.rol !== 'capturista' ? api.get('/usuarios') : Promise.resolve(null),
      ]);
      setData({ products: products.data.data, users: users?.data.data });
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [user.rol]);
  useEffect(() => {
    load();
  }, [load]);
  const today = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const canWrite = user.rol === 'capturista';
  return (
    <>
      <PageTitle
        eyebrow="VISTA GENERAL"
        title={`Hola, ${user.nombre.split(' ')[0]} 👋`}
        description="Un buen día para llevar tu tienda al siguiente nivel."
        action={<div className="date-chip">{today}</div>}
      />
      <section className="hero-card">
        <div className="hero-copy">
          <span className="light-tag">
            <span className="tiny-dot" /> TU TIENDA, BAJO CONTROL
          </span>
          <h2>
            Más enfoque.
            <br />
            <span>Más posibilidades.</span>
          </h2>
          <p>
            Todo lo que necesitas para administrar
            <br className="desktop-break" /> tu catálogo de suplementos, en un solo lugar.
          </p>
          <Link className="button lime" to="/productos">
            Explorar catálogo <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-plus plus-one">+</span>
          <span className="art-plus plus-two">+</span>
          <div className="product-tub back-tub">
            <div className="tub-cap" />
            <div className="tub-body">
              <b>MAZ</b>
              <small>PERFORMANCE SERIES</small>
              <strong>CREATINE</strong>
              <span>MONOHYDRATE</span>
              <i>300 G</i>
            </div>
          </div>
          <div className="product-tub front-tub">
            <div className="tub-cap" />
            <div className="tub-body">
              <b>
                MAZ<span>®</span>
              </b>
              <small>FUEL YOUR POTENTIAL</small>
              <strong>
                WHEY
                <br />
                PROTEIN
              </strong>
              <div className="tub-stripe">
                <Zap size={29} fill="currentColor" />
                <span>
                  24g<small>PROTEIN</small>
                </span>
              </div>
              <i>CHOCOLATE · 2 LB</i>
            </div>
          </div>
          <div className="art-caption">
            <span /> DISEÑADO PARA IR MÁS ALLÁ
          </div>
        </div>
      </section>
      {error ? (
        <ErrorState message={error} retry={load} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <div className="stats-grid">
            {[
              {
                label: 'Total del catálogo',
                value: data.products.length,
                icon: Boxes,
                hint: 'Suplementos y servicios',
                color: 'mint',
              },
              {
                label: 'Productos activos',
                value: data.products.filter((p) => p.activo && p.tipo === 'producto').length,
                icon: Package,
                hint: 'Disponibles en tu catálogo',
                color: 'purple',
              },
              {
                label: 'Servicios',
                value: data.products.filter((p) => p.tipo === 'servicio').length,
                icon: Sparkles,
                hint: 'Más valor para tus clientes',
                color: 'peach',
              },
              data.users
                ? {
                    label: 'Usuarios del equipo',
                    value: data.users.length,
                    icon: Users,
                    hint: `${data.users.filter((u) => u.activo).length} con acceso activo`,
                    color: 'blue',
                  }
                : {
                    label: 'Registros inactivos',
                    value: data.products.filter((p) => !p.activo).length,
                    icon: ArrowDownRight,
                    hint: 'Revisa su disponibilidad',
                    color: 'blue',
                  },
            ].map(({ label, value, icon: Icon, hint, color }) => (
              <div className="stat-card" key={label}>
                <div className="stat-top">
                  <span>{label}</span>
                  <span className={`stat-icon ${color}`}>
                    <Icon size={19} />
                  </span>
                </div>
                <strong>{value.toString().padStart(2, '0')}</strong>
                <small>{hint}</small>
              </div>
            ))}
          </div>
          <div className="dashboard-bottom">
            <section className="panel recent-panel">
              <div className="panel-heading">
                <div>
                  <h2>Últimos registros</h2>
                  <p>Lo más reciente de tu catálogo</p>
                </div>
                <Link className="text-link" to="/productos">
                  Ver todos <ArrowRight size={15} />
                </Link>
              </div>
              {data.products.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>PRODUCTO / SERVICIO</th>
                        <th>PRECIO</th>
                        <th>ESTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.products.slice(0, 4).map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="product-cell">
                              <span
                                className={`product-symbol ${product.tipo === 'servicio' ? 'service' : ''}`}
                              >
                                {product.tipo === 'servicio' ? (
                                  <Sparkles size={20} />
                                ) : (
                                  <Package size={20} />
                                )}
                              </span>
                              <div>
                                <strong>{product.nombre}</strong>
                                <small>
                                  {product.tipo === 'servicio'
                                    ? 'Servicio'
                                    : 'Suplementos y accesorios'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="price">{money(product.precio)}</td>
                          <td>
                            <Status active={product.activo} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="Tu catálogo comienza aquí"
                  description={
                    canWrite
                      ? 'Agrega tu primer suplemento desde el catálogo.'
                      : 'El capturista puede agregar los primeros suplementos.'
                  }
                />
              )}
            </section>
            <section className="panel access-panel">
              <div className="access-icon">
                <ShieldCheck size={23} />
              </div>
              <p className="eyebrow">TU ESPACIO DE TRABAJO</p>
              <h2>Acceso de {user.rol}</h2>
              <p className="muted">Estas son las herramientas disponibles para tu cuenta.</p>
              <ul>
                <li>
                  <Check size={16} />
                  {canWrite
                    ? 'Administrar suplementos y servicios'
                    : 'Consultar suplementos y servicios'}
                </li>
                {user.rol !== 'capturista' && (
                  <li>
                    <Check size={16} />
                    {user.rol === 'administrador'
                      ? 'Administrar usuarios del equipo'
                      : 'Consultar usuarios del equipo'}
                  </li>
                )}
                {user.rol === 'administrador' && (
                  <li>
                    <Check size={16} />
                    Crear respaldos de información
                  </li>
                )}
              </ul>
              <Link
                className="access-link"
                to={user.rol === 'administrador' ? '/respaldos' : '/productos'}
              >
                {user.rol === 'administrador' ? <Database size={17} /> : <Boxes size={17} />}
                {user.rol === 'administrador' ? 'Proteger mis datos' : 'Ir al catálogo'}
                <ArrowUpRight size={17} />
              </Link>
            </section>
          </div>
        </>
      )}
    </>
  );
}
