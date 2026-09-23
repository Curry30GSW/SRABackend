const pool = require('../config/mysqlConnection');

class User {
    constructor(data = {}) {
        this.id_usuario = data.id_usuario || data.id_usuario || null;
        this.nombre = data.nombre || data.nombre || null;
        this.usuario = data.usuario || data.usuario || null;
        this.contraseña = data.contraseña || data.contraseña || null;
        this.rol = data.rol || data.rol || null;
        this.activo = data.activo || data.activo || null;
        this.fecha_creado = data.fecha_creado || null;

    }

    static async create(data) {

        const sql = `INSERT INTO users(nombre,usuario,contraseña,rol,activo) VALUES (?,?,?,?,?)`;

        const params = [
            data.nombre,
            data.usuario,
            data.contraseña,
            data.rol || 'usuario',
            data.activo !== undefined ? data.activo : 1
        ]

        try {
            const [result] = await pool.query(sql, params)

            if (result.insertId) {
                const nuevaGestion = await User.getById(result.insertId)
                return nuevaGestion;
            }
            return null;
        } catch (error) {
            console.error('Error en validateLogin:', error);
            throw error;
        }
    }

    static async getById(id_usuario) {
        const sql = `
            SELECT 
                id_usuario,
                nombre,
                usuario,
                contraseña,
                rol,
                activo
            FROM users
            WHERE id_usuario = ?
        `;

        try {
            const [rows] = await pool.query(sql, [id_usuario])

            return rows.length > 0 ? new User(rows[0]) : null;

        } catch (error) {
            console.error('Error en obtener usuarios x id:', error);
            throw error;
        }
    }

    static async getAll() {
        const sql = `
            SELECT 
                id_usuario,
                nombre,
                usuario,
                contraseña,
                rol,
                activo
            FROM users
            
        `;

        try {
            const [rows] = await pool.query(sql)
            return rows.map(row => new User(row))

        } catch (error) {
            console.error('Error en obtener usuarios:', error);
            throw error;
        }
    }

    static async updatePassword(nuevaContraseña, id_usuario) {
        const sql = `UPDATE users SET  contraseña = ?  WHERE usuario_id = ?`;
        try {
            const [result] = await pool.query(sql, [nuevaContraseña, id_usuario])

            return result.affectedRows > 0;

        } catch (error) {
            console.error('Error en obtener usuarios:', error);
            throw error;
        }
    }

    static async getEstadisticas() {
        const sql = `
          SELECT  COUNT(*) as total,
          sum(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos,
          sum(CASE WHEN activo = 0 THEN 1 ELSE 0 END) as inactivos 
          FROM users 
          
        `;


        try {
            const [rows] = await pool.query(sql);
            return rows[0];

        } catch (error) {
            console.error("Error en obtener Estadisticas", error)
            throw error;
        }

    }

}



module.exports = User;