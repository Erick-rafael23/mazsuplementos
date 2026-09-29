import { useCallback, useEffect, useState } from 'react';
import {
  Eye,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  Package,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, dateTime, errorMessage, money } from '../services/api';
import {
  EmptyState,
  ErrorState,
  Loading,
  Modal,
  PageTitle,
  Pagination,
  Status,
} from '../components/UI';

const emptyUser = { nombre: '', correo: '', password: '', rol: 'capturista', activo: true };
const emptyProduct = { nombre: '', descripcion: '', tipo: 'producto', precio: '', activo: true };

export default function Catalog({ kind }) {
  const isUser = kind === 'usuarios';
  const endpoint = isUser ? '/usuarios' : '/productos';
  const { user, refreshUser, logout } = useAuth();
  const notify = useToast();
  const canWrite = user.rol === (isUser ? 'administrador' : 'capturista');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('todos');
  const [status, setStatus] = useState('todos');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows((await api.get(endpoint)).data.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);
  useEffect(() => {
    load();
  }, [load]);
  const filtered = rows.filter((row) => {
    const text = `${row.nombre} ${isUser ? row.correo : row.descripcion}`.toLocaleLowerCase('es');
    return (
      text.includes(query.trim().toLocaleLowerCase('es')) &&
      (filter === 'todos' || row[isUser ? 'rol' : 'tipo'] === filter) &&
      (status === 'todos' || Boolean(row.activo) === (status === 'activo'))
    );
  });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 6)));
  const visible = filtered.slice((currentPage - 1) * 6, currentPage * 6);
  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }
  function openCreate() {
    setForm({ ...(isUser ? emptyUser : emptyProduct) });
    setFormError('');
    setModal({ action: 'create' });
  }
  async function openRow(row, action) {
    setFormError('');
    setBusy(true);
    setModal({ action: 'loading' });
    try {
      const record = (await api.get(`${endpoint}/${row.id}`)).data.data;
      setForm(
        isUser
          ? {
              nombre: record.nombre,
              correo: record.correo,
              rol: record.rol,
              activo: record.activo,
              password: '',
            }
          : {
              nombre: record.nombre,
              descripcion: record.descripcion,
              tipo: record.tipo,
              precio: record.precio,
              activo: record.activo,
            },
      );
      setModal({ action, row: record });
    } catch (err) {
      setModal(null);
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }
  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const payload = { ...form };
      if (isUser && modal.action === 'edit' && !payload.password) delete payload.password;
      if (!isUser) payload.precio = Number(payload.precio);
      const isSelf = isUser && modal.row?.id === user.id;
      const response =
        modal.action === 'create'
          ? await api.post(endpoint, payload)
          : await api.put(`${endpoint}/${modal.row.id}`, payload);
      setModal(null);
      notify(response.data.message);
      if (isSelf && payload.password) {
        logout();
        notify('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
        return;
      }
      if (isSelf) await refreshUser();
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setFormError('');
    try {
      await api.delete(`${endpoint}/${modal.row.id}`);
      setModal(null);
      notify('Registro eliminado correctamente.');
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  const nameLabel = isUser ? 'usuario' : 'producto o servicio';
  return (
    <>
      <PageTitle
        eyebrow={isUser ? 'TU EQUIPO' : 'TU CATÁLOGO'}
        title={isUser ? 'Usuarios' : 'Suplementos y servicios'}
        description={
          isUser
            ? 'Las personas que hacen crecer tu tienda.'
            : 'Organiza cada producto. Da espacio a nuevas posibilidades.'
        }
        action={
          canWrite && (
            <button className="button primary" onClick={openCreate}>
              <Plus size={18} />
              {isUser ? 'Nuevo usuario' : 'Nuevo registro'}
            </button>
          )
        }
      />
      <div className="catalog-summary">
        <span className="catalog-summary-icon">
          {isUser ? <Users size={23} /> : <Package size={23} />}
        </span>
        <div>
          <strong>
            {rows.length} {isUser ? 'usuarios en tu equipo' : 'registros en tu catálogo'}
          </strong>
          <p>
            {rows.filter((row) => row.activo).length} activos ·{' '}
            {rows.filter((row) => !row.activo).length} inactivos
          </p>
        </div>
        <span className="permission-label">
          <ShieldCheck size={15} />
          {canWrite ? 'Puedes administrar este catálogo' : 'Acceso de consulta'}
        </span>
      </div>
      <section className="panel catalog-panel">
        <div className="catalog-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label={isUser ? 'Buscar usuarios' : 'Buscar productos'}
              placeholder={isUser ? 'Buscar por nombre o correo…' : 'Buscar en el catálogo…'}
              value={query}
              onChange={(e) => changeFilter(setQuery, e.target.value)}
            />
          </div>
          <div className="filter-fields">
            <SlidersHorizontal size={17} />
            <select
              aria-label={isUser ? 'Filtrar por rol' : 'Filtrar por tipo'}
              value={filter}
              onChange={(e) => changeFilter(setFilter, e.target.value)}
            >
              <option value="todos">{isUser ? 'Todos los roles' : 'Todos los tipos'}</option>
              {(isUser ? ['administrador', 'capturista', 'auditor'] : ['producto', 'servicio']).map(
                (value) => (
                  <option key={value} value={value}>
                    {value[0].toUpperCase() + value.slice(1)}
                  </option>
                ),
              )}
            </select>
            <select
              aria-label="Filtrar por estado"
              value={status}
              onChange={(e) => changeFilter(setStatus, e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={load} />
        ) : !filtered.length ? (
          <EmptyState
            title={
              rows.length
                ? 'No encontramos coincidencias'
                : isUser
                  ? 'No hay usuarios todavía'
                  : 'Tu catálogo está listo para comenzar'
            }
            description={
              rows.length
                ? 'Cambia tu búsqueda o los filtros.'
                : canWrite
                  ? 'Usa el botón superior para crear el primer registro.'
                  : 'Los registros aparecerán aquí cuando se agreguen.'
            }
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{isUser ? 'USUARIO' : 'PRODUCTO / SERVICIO'}</th>
                  <th>{isUser ? 'CORREO ELECTRÓNICO' : 'TIPO'}</th>
                  <th>{isUser ? 'ROL' : 'PRECIO'}</th>
                  <th>ESTADO</th>
                  <th className="actions-heading">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="product-cell">
                        <span
                          className={
                            isUser
                              ? 'user-table-avatar'
                              : `product-symbol ${row.tipo === 'servicio' ? 'service' : ''}`
                          }
                        >
                          {isUser ? (
                            row.nombre
                              .split(' ')
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('')
                          ) : row.tipo === 'servicio' ? (
                            <Sparkles size={20} />
                          ) : (
                            <Package size={20} />
                          )}
                        </span>
                        <div>
                          <strong>{row.nombre}</strong>
                          <small>
                            {isUser
                              ? `ID ${String(row.id).padStart(3, '0')}`
                              : row.descripcion || 'Sin descripción'}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{isUser ? row.correo : <span className="type-label">{row.tipo}</span>}</td>
                    <td>
                      {isUser ? (
                        <span className={`role-label ${row.rol}`}>{row.rol}</span>
                      ) : (
                        <span className="price">{money(row.precio)}</span>
                      )}
                    </td>
                    <td>
                      <Status active={row.activo} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Ver ${row.nombre}`}
                          title="Ver información"
                          onClick={() => openRow(row, 'view')}
                        >
                          <Eye size={17} />
                        </button>
                        {canWrite && (
                          <>
                            <button
                              className="icon-button"
                              aria-label={`Editar ${row.nombre}`}
                              title="Editar"
                              onClick={() => openRow(row, 'edit')}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="icon-button danger-icon"
                              aria-label={`Eliminar ${row.nombre}`}
                              title={
                                isUser && row.id === user.id
                                  ? 'No puedes eliminar tu cuenta'
                                  : 'Eliminar'
                              }
                              disabled={isUser && row.id === user.id}
                              onClick={() => {
                                setFormError('');
                                setModal({ action: 'delete', row });
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <Pagination page={currentPage} setPage={setPage} total={filtered.length} />
        )}
      </section>
      <p className="catalog-footnote">
        <ShieldCheck size={14} />
        {canWrite
          ? 'Los cambios se guardan al confirmar cada formulario.'
          : `Tu rol de ${user.rol} permite consultar este catálogo.`}
      </p>
      {modal && (
        <Modal
          title={
            modal.action === 'loading'
              ? 'Cargando información'
              : modal.action === 'view'
                ? 'Información del registro'
                : modal.action === 'delete'
                  ? `Eliminar ${nameLabel}`
                  : `${modal.action === 'create' ? 'Nuevo' : 'Editar'} ${nameLabel}`
          }
          onClose={() => setModal(null)}
          busy={busy}
        >
          {modal.action === 'loading' ? (
            <Loading />
          ) : modal.action === 'delete' ? (
            <>
              <p className="delete-message">
                Se eliminará permanentemente <strong>{modal.row.nombre}</strong>. Esta acción no se
                puede deshacer.
              </p>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="modal-actions">
                <button className="button secondary" disabled={busy} onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button className="button danger" disabled={busy} onClick={remove}>
                  {busy ? 'Eliminando…' : 'Eliminar registro'}
                </button>
              </div>
            </>
          ) : modal.action === 'view' ? (
            <>
              <dl className="details-grid">
                <dt>Nombre</dt>
                <dd>{modal.row.nombre}</dd>
                {isUser ? (
                  <>
                    <dt>Correo</dt>
                    <dd>{modal.row.correo}</dd>
                    <dt>Rol</dt>
                    <dd className="capitalize">{modal.row.rol}</dd>
                  </>
                ) : (
                  <>
                    <dt>Descripción</dt>
                    <dd>{modal.row.descripcion || 'Sin descripción'}</dd>
                    <dt>Tipo</dt>
                    <dd className="capitalize">{modal.row.tipo}</dd>
                    <dt>Precio</dt>
                    <dd>{money(modal.row.precio)}</dd>
                  </>
                )}
                <dt>Estado</dt>
                <dd>
                  <Status active={modal.row.activo} />
                </dd>
                <dt>Creado</dt>
                <dd>{dateTime(modal.row.created_at)}</dd>
                <dt>Actualizado</dt>
                <dd>{dateTime(modal.row.updated_at)}</dd>
              </dl>
              <div className="modal-actions">
                <button className="button secondary" onClick={() => setModal(null)}>
                  Cerrar
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={save}>
              <label>
                Nombre
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={change}
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder={isUser ? 'Nombre completo' : 'Ej. Creatina monohidratada 300 g'}
                  autoFocus
                />
              </label>
              {isUser ? (
                <>
                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      name="correo"
                      value={form.correo}
                      onChange={change}
                      required
                      maxLength={190}
                      autoComplete="off"
                      placeholder="nombre@correo.com"
                    />
                  </label>
                  <label>
                    Contraseña
                    {modal.action === 'edit' && (
                      <span className="field-hint">Déjala vacía para conservar la actual.</span>
                    )}
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={change}
                      required={modal.action === 'create'}
                      minLength={10}
                      maxLength={72}
                      autoComplete="new-password"
                      placeholder="Mínimo 10 caracteres"
                    />
                  </label>
                  <label>
                    Rol
                    <select
                      name="rol"
                      value={form.rol}
                      onChange={change}
                      disabled={modal.row?.id === user.id}
                    >
                      <option value="administrador">Administrador</option>
                      <option value="capturista">Capturista</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Descripción
                    <textarea
                      name="descripcion"
                      value={form.descripcion}
                      onChange={change}
                      maxLength={2000}
                      rows={3}
                      placeholder="Presentación, sabor y detalles del producto…"
                    />
                  </label>
                  <div className="form-columns">
                    <label>
                      Tipo
                      <select name="tipo" value={form.tipo} onChange={change}>
                        <option value="producto">Producto</option>
                        <option value="servicio">Servicio</option>
                      </select>
                    </label>
                    <label>
                      Precio (MXN)
                      <input
                        type="number"
                        name="precio"
                        value={form.precio}
                        onChange={change}
                        min="0"
                        max="99999999.99"
                        step="0.01"
                        required
                        placeholder="0.00"
                      />
                    </label>
                  </div>
                </>
              )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={change}
                  disabled={isUser && modal.row?.id === user.id}
                />
                <span>Registro activo</span>
              </label>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Cancelar
                </button>
                <button className="button primary" disabled={busy}>
                  {busy
                    ? 'Guardando…'
                    : modal.action === 'create'
                      ? 'Crear registro'
                      : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
