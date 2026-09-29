import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldX } from 'lucide-react';
export default function NotFound({ forbidden = false }) {
  return (
    <div className="not-found">
      <ShieldX size={45} strokeWidth={1.3} />
      <p className="eyebrow">{forbidden ? '403 · ACCESO RESTRINGIDO' : '404 · NO ENCONTRADO'}</p>
      <h1>{forbidden ? 'Este espacio requiere otro permiso' : 'No encontramos esta página'}</h1>
      <p className="muted">
        {forbidden
          ? 'Tu rol no tiene acceso a este módulo. Puedes continuar en el inicio.'
          : 'La dirección no existe o fue escrita de forma incorrecta.'}
      </p>
      <Link className="button primary" to="/">
        <ArrowLeft size={17} />
        Volver al inicio
      </Link>
    </div>
  );
}
