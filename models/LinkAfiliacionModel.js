const pool = require('../config/mysqlConnection');
const crypto = require('crypto');

class LinkAfiliacion {
    constructor(data = {}) {
        this.id_link = data.id_link || null;
        this.codigo = data.codigo || '';
        this.id_usuario = data.id_usuario || null;
        this.usuario = data.usuario || '';
        this.fecha_creacion = data.fecha_creacion || new Date();
        this.fecha_expiracion = data.fecha_expiracion || null;
        this.activo = data.activo !== undefined ? data.activo : 1;
        this.uso_maximo = data.uso_maximo || 0;
        this.usos_actuales = data.usos_actuales || 0;
    }

    // Generar código único
    static generarCodigo(usuario) {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(4).toString('hex');
        const userPart = usuario.substring(0, 4).toUpperCase();
        return `${userPart}${timestamp}${random}`.toUpperCase();
    }

    // Crear un nuevo link
    static async crear(usuarioId, usuarioNombre, usoMaximo = 0, diasExpiracion = 30) {
        const codigo = this.generarCodigo(usuarioNombre);
        const fechaExpiracion = new Date();
        fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion);

        const sql = `
            INSERT INTO links_afiliacion (codigo, id_usuario, usuario, fecha_expiracion, uso_maximo)
            VALUES (?, ?, ?, ?, ?)
        `;

        try {
            const [result] = await pool.query(sql, [
                codigo,
                usuarioId,
                usuarioNombre,
                fechaExpiracion,
                usoMaximo
            ]);

            if (result.insertId) {
                return await LinkAfiliacion.getById(result.insertId);
            }
            return null;
        } catch (error) {
            console.error('Error creando link de afiliación:', error);
            throw error;
        }
    }

    // Obtener link por ID
    static async getById(id) {
        const sql = 'SELECT * FROM links_afiliacion WHERE id_link = ?';
        try {
            const [rows] = await pool.query(sql, [id]);
            return rows.length > 0 ? new LinkAfiliacion(rows[0]) : null;
        } catch (error) {
            console.error('Error en getById LinkAfiliacion:', error);
            throw error;
        }
    }

    // Obtener link por código
    static async getByCodigo(codigo) {
        const sql = 'SELECT * FROM links_afiliacion WHERE codigo = ?';
        try {
            const [rows] = await pool.query(sql, [codigo]);
            return rows.length > 0 ? new LinkAfiliacion(rows[0]) : null;
        } catch (error) {
            console.error('Error en getByCodigo LinkAfiliacion:', error);
            throw error;
        }
    }

    // Obtener links por usuario
    static async getByUsuario(usuarioId) {
        const sql = 'SELECT * FROM links_afiliacion WHERE id_usuario = ? ORDER BY fecha_creacion DESC';
        try {
            const [rows] = await pool.query(sql, [usuarioId]);
            return rows.map(row => new LinkAfiliacion(row));
        } catch (error) {
            console.error('Error en getByUsuario LinkAfiliacion:', error);
            throw error;
        }
    }

    // Incrementar uso del link
    static async incrementarUso(codigo) {
        const sql = `
            UPDATE links_afiliacion 
            SET usos_actuales = usos_actuales + 1 
            WHERE codigo = ?
        `;
        try {
            await pool.query(sql, [codigo]);
            return true;
        } catch (error) {
            console.error('Error incrementando uso del link:', error);
            throw error;
        }
    }

    // Validar si el link es válido
    static async validarLink(codigo) {
        const link = await LinkAfiliacion.getByCodigo(codigo);
        if (!link) return { valido: false, message: 'Link no encontrado' };

        if (!link.activo) return { valido: false, message: 'Link inactivo' };

        if (link.fecha_expiracion && new Date() > new Date(link.fecha_expiracion)) {
            return { valido: false, message: 'Link expirado' };
        }

        if (link.uso_maximo > 0 && link.usos_actuales >= link.uso_maximo) {
            return { valido: false, message: 'Límite de usos alcanzado' };
        }

        return { valido: true, link };
    }

    // Desactivar link
    static async desactivar(codigo) {
        const sql = 'UPDATE links_afiliacion SET activo = 0 WHERE codigo = ?';
        try {
            await pool.query(sql, [codigo]);
            return true;
        } catch (error) {
            console.error('Error desactivando link:', error);
            throw error;
        }
    }

    // Obtener estadísticas de links por usuario
    static async getEstadisticas(usuarioId) {
        const sql = `
            SELECT 
                COUNT(*) as total_links,
                SUM(usos_actuales) as total_usos,
                AVG(usos_actuales) as promedio_usos,
                SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as links_activos
            FROM links_afiliacion 
            WHERE id_usuario = ?
        `;
        try {
            const [rows] = await pool.query(sql, [usuarioId]);
            return rows[0];
        } catch (error) {
            console.error('Error en getEstadisticas:', error);
            throw error;
        }
    }
}

module.exports = LinkAfiliacion;