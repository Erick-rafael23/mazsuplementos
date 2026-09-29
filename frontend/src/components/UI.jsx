import { useEffect, useRef } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle, PackageOpen, X } from 'lucide-react';

export function Loading({ full = false }) {
  return (
    <div className={`loading ${full ? 'full' : ''}`} role="status">
      <LoaderCircle className="spin" size={24} /> Cargando…
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={26} />
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title = 'No hay resultados',
  description = 'Prueba con otro término o modifica los filtros.',
}) {
  return (
    <div className="empty-state">
      <PackageOpen size={36} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Status({ active }) {
  return (
    <span className={`status ${active ? '' : 'inactive'}`}>
      <i />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}
export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Modal({ title, children, onClose, busy = false, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          disabled={busy}
          onClick={onClose}
          aria-label="Cerrar ventana"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Pagination({ page, setPage, total, size = 6 }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="pagination">
      <span>
        {total
          ? `${(page - 1) * size + 1}–${Math.min(page * size, total)} de ${total} registros`
          : '0 registros'}
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <span className="page-number">{page}</span>
        <span>de {pages}</span>
        <button
          className="icon-button"
          aria-label="Página siguiente"
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
