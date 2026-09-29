import { HttpError } from '../utils/errors.js';

const columns = {
  usuarios: ['nombre', 'correo', 'password', 'rol', 'activo'],
  productos_servicios: ['nombre', 'descripcion', 'tipo', 'precio', 'activo'],
};

function tableName(table) {
  if (!Object.hasOwn(columns, table)) throw new Error('Tabla no permitida.');
  return `\`${table}\``;
}

export function createSqlStore(pool) {
  const store = {
    async list(table) {
      const [rows] = await pool.execute(`SELECT * FROM ${tableName(table)} ORDER BY id DESC`);
      return rows;
    },
    async find(table, id) {
      const [rows] = await pool.execute(`SELECT * FROM ${tableName(table)} WHERE id = ?`, [id]);
      return rows[0] || null;
    },
    async findByEmail(correo) {
      const [rows] = await pool.execute('SELECT * FROM usuarios WHERE correo = ?', [correo]);
      return rows[0] || null;
    },
    async create(table, data) {
      const name = tableName(table);
      const fields = columns[table].filter((key) => Object.hasOwn(data, key));
      const [result] = await pool.execute(
        `INSERT INTO ${name} (${fields.map((key) => `\`${key}\``).join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
        fields.map((key) => data[key]),
      );
      return store.find(table, result.insertId);
    },
    async update(table, id, data) {
      const name = tableName(table);
      const fields = columns[table].filter((key) => Object.hasOwn(data, key));
      await pool.execute(
        `UPDATE ${name} SET ${fields.map((key) => `\`${key}\` = ?`).join(',')} WHERE id = ?`,
        [...fields.map((key) => data[key]), id],
      );
      const row = await store.find(table, id);
      if (!row) throw new HttpError(404, 'Registro no encontrado.');
      return row;
    },
    async remove(table, id) {
      const [result] = await pool.execute(`DELETE FROM ${tableName(table)} WHERE id = ?`, [id]);
      if (!result.affectedRows) throw new HttpError(404, 'Registro no encontrado.');
    },
    async snapshot() {
      const connection = await pool.getConnection();
      try {
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.beginTransaction();
        const [usuarios] = await connection.execute('SELECT * FROM usuarios ORDER BY id');
        const [productos_servicios] = await connection.execute(
          'SELECT * FROM productos_servicios ORDER BY id',
        );
        await connection.commit();
        return { usuarios, productos_servicios };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
  return store;
}
