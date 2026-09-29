import { useCallback, useEffect, useState } from 'react';
import { Database, FileJson, HardDrive, Plus, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api, dateTime, errorMessage } from '../services/api';
import { EmptyState, ErrorState, Loading, PageTitle } from '../components/UI';

export default function Backups() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [latest, setLatest] = useState(null);
  const notify = useToast();
  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setRows((await api.get('/backups')).data.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function create() {
    setBusy(true);
    try {
      const response = await api.post('/backups', {}, { timeout: 60000 });
      setLatest(response.data.data);
      notify(response.data.message);
      await load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="TRANQUILIDAD PARA TU TIENDA"
        title="Respaldos"
        description="Una copia de tu información, siempre a tu alcance."
        action={
          <button className="button primary" onClick={create} disabled={busy}>
            <Plus size={18} />
            {busy ? 'Creando respaldo…' : 'Crear respaldo'}
          </button>
        }
      />
      <section className="backup-intro">
        <div className="backup-art">
          <Database size={52} strokeWidth={1.2} />
          <ShieldCheck size={29} />
        </div>
        <div>
          <span className="eyebrow">INFORMACIÓN PROTEGIDA</span>
          <h2>Tu trabajo merece una copia.</h2>
          <p>
            Crea un respaldo de los usuarios y del catálogo completo de tu tienda. Cada copia se
            guarda en el equipo donde se ejecuta el servidor.
          </p>
          <span className="backup-path">
            <HardDrive size={15} /> backend/backups/ · Formato JSON
          </span>
        </div>
      </section>
      <div className="backup-stats">
        <div className="panel">
          <span>Último respaldo</span>
          <strong>{rows[0] ? dateTime(rows[0].fecha) : 'Sin respaldos todavía'}</strong>
        </div>
        <div className="panel">
          <span>Copias guardadas</span>
          <strong>{rows.length}</strong>
        </div>
        <div className="panel">
          <span>Acceso al módulo</span>
          <strong className="access-admin">
            <ShieldCheck size={18} /> Solo administrador
          </strong>
        </div>
      </div>
      {latest && (
        <div className="backup-success" role="status">
          <ShieldCheck size={22} />
          <div>
            <strong>Respaldo creado correctamente</strong>
            <p>{latest.nombre}</p>
            <small>
              {latest.registros} registros guardados · {dateTime(latest.fecha)}
            </small>
          </div>
        </div>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Historial de respaldos</h2>
            <p>Copias locales disponibles en el servidor</p>
          </div>
          <FileJson size={21} />
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={load} />
        ) : !rows.length ? (
          <EmptyState
            title="Tu primera copia está a un clic"
            description="Presiona Crear respaldo para guardar la información actual."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ARCHIVO</th>
                  <th>FECHA DE CREACIÓN</th>
                  <th>TAMAÑO</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.nombre}>
                    <td>
                      <div className="backup-filename">
                        <FileJson size={18} />
                        <span>{row.nombre}</span>
                      </div>
                    </td>
                    <td className="nowrap">{dateTime(row.fecha)}</td>
                    <td className="nowrap">{(row.bytes / 1024).toFixed(1)} KB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="catalog-footnote">
        <ShieldCheck size={14} />
        Las copias contienen hashes de contraseñas y datos de usuarios. Consérvalas en un lugar
        privado.
      </p>
    </>
  );
}
