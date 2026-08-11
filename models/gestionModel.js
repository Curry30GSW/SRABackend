
const pool = require('../config/mysqlConnection');

class Gestion {
   constructor(data = {}) {
        this.id_gestion = data.id_gestion || null;
        this.cedula = data.cedula || '';
        this.nombre = data.nombre || '';
        this.cuenta =  data.cuenta || '';
        this.gestion = data.gestion || '';
        this.fecha_gestion = data.fecha_gestion || new Date();
        this.usuario_gestion = data.usuario_gestion || ''   ;
       
   }

static async create (gestionData)  {
        const sql = `INSERT INTO gestion (cedula, nombre, cuenta, gestion, fecha_gestion, usuario_gestion) VALUES (?,?,?,?,NOW(),?)`;

        const params = [
            gestionData.cedula,
            gestionData.nombre,
            gestionData.cuenta,
            gestionData.gestion,
            // gestionData.fecha_gestion || new Date(),
            gestionData.usuario_gestion
            
        ]

        try {
            const [result] = await pool.query(sql, params)

             if (result.insertId) {
                const nuevaGestion = await Gestion.getById(result.insertId);
                return nuevaGestion;
            }
            return null;
        } catch (error) {
             console.error('Error en create Gestion:', error);
            throw error;
        }
}
static async getAll()  {
    const sql = `
            SELECT 
                id_gestion,
                cedula,
                nombre,
                cuenta,
                gestion,
                fecha_gestion,
                usuario_gestion  
            FROM gestion
            
        `;

        try {
            const[rows] = await pool.query(sql)
            return rows.map(row => new Gestion(row))

        } catch (error) {
            console.error('Error en create Gestion:', error);
            throw error;
        }
}

static async   getById(id_gestion)  {
       const sql = `
            SELECT 
                id_gestion,
                cedula,
                nombre,
                cuenta,
                gestion,
                fecha_gestion,
                usuario_gestion
            FROM gestion
            WHERE id_gestion = ?
        `;

    try {
        const [rows] = await pool.query(sql, [id_gestion])
         return rows.map(row => new Gestion(row));
    } catch (error) {
            console.error('Error en create Gestion:', error);
            throw error;
    }
}

static async getByCedula(cedula)  {
       const sql = `
            SELECT 
                id_gestion,
                cedula,
                nombre,
                cuenta,
                gestion,
                fecha_gestion,
                usuario_gestion
            FROM gestion
            WHERE cedula = ?
        `;

    try {
        const [rows] = await pool.query(sql, [cedula])
        return rows.map(row => new Gestion(row));
    } catch (error) {
            console.error('Error en create Gestion:', error);
            throw error;
    }
  }

//    static async findById(id_gestion)  {
//        const sql = `
//             SELECT 
//                 id_gestion,
//                 cedula,
//                 nombre,
//                 cuenta,
//                 gestion,
//                 fecha_gestion,
//                 usuario_gestion
//             FROM gestion
//             WHERE id_gestion = ?
//         `;

//     try {
//         const [rows] = await pool.query(sql, [id_gestion])
//         return rows.length > 0 ? new Gestion(rows[0]) : null;
//     } catch (error) {
//             console.error('Error en create Gestion:', error);
//             throw error;
//     }
//   }

}

module.exports = Gestion;