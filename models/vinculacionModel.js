
const pool = require('../config/mysqlConnection')

class Vinculacion {
    constructor(data = {}) {
        this.id_solicitante = data.id_solicitante || null;
        this.tipo_documento = data.tipo_documento || 'CC';
        this.numero_documento = data.numero_documento || '';
        this.lugar_expedicion = data.lugar_expedicion || null;
        this.fecha_expedicion = data.fecha_expedicion || null;

        // Datos Personales
        this.nombres = data.nombres || '';
        this.apellidos = data.apellidos || '';
        this.fecha_nacimiento = data.fecha_nacimiento || null;
        this.lugar_nacimiento = data.lugar_nacimiento || null;
        this.lugar_procedencia = data.lugar_procedencia || null;
        this.ciudad_residencia = data.ciudad_residencia || null;
        this.direccion_residencia = data.direccion_residencia || null;

        // Información Laboral
        this.tipo_trabajador = data.tipo_trabajador || null;
        this.pagaduria = data.pagaduria || null;
        this.empresa = data.empresa || null;
        this.sector_empresa = data.sector_empresa || null;
        this.cargo = data.cargo || null;
        this.tiempo_cargo = data.tiempo_cargo || null;

        // Información Adicional
        this.direccion_correspondencia = data.direccion_correspondencia || null;
        this.ciudad_correspondencia = data.ciudad_correspondencia || null;
        this.telefonos = data.telefonos || [];
        this.whatsapp = data.whatsapp || null;
        this.correo_electronico = data.correo_electronico || null;

        // Autorizaciones
        this.central_riesgos = data.central_riesgos || false;
        this.tratamiento_datos = data.tratamiento_datos || false;
        this.apertura_coopserp = data.apertura_coopserp || false;


        // Auditoría
        this.estado = data.estado || 'PENDIENTE';
        this.fecha_creacion = data.fecha_creacion || new Date();
        this.fecha_actualizacion = data.fecha_actualizacion || null;
        this.activo = data.activo !== undefined ? data.activo : 1;


    }

    static async create(data) {
        if (!data.central_riesgos || !data.tratamiento_datos || !data.apertura_coopserp) {
            throw new Error("Debe aceptar todos los terminos y condiciones")
        }
        if (data.tipo_trabajador === "PENSIONADO" && !data.pagaduria?.trim()) {
            throw new Error("Si se selecciona pensionado, debe haber pagaduria")
        }
        if (data.tipo_trabajador === "EMPLEADO") {
            if (!data.empresa?.trim()) {
                throw new Error('Para empleados, la empresa es obligatoria');
            }
            if (!data.sector_empresa?.trim()) {
                throw new Error('Para empleados, el sector de empresa es obligatoria');
            }
            if (!data.cargo?.trim()) {
                throw new Error('Para empleados, el cargo es obligatoria');
            }
            if (!data.tiempo_cargo?.trim()) {
                throw new Error('Para empleados, el tiempo de cargo es obligatoria');
            }
        }

        const sql = `INSERT INTO fase1 ( tipo_documento, numero_documento, lugar_expedicion, fecha_expedicion,
                nombres, apellidos, fecha_nacimiento, lugar_nacimiento, 
                lugar_procedencia, ciudad_residencia, direccion_residencia,
                tipo_trabajador, pagaduria, empresa, sector_empresa, cargo, tiempo_cargo,
                direccion_correspondencia, ciudad_correspondencia, telefonos, whatsapp, correo_electronico,
                central_riesgos, tratamiento_datos, apertura_coopserp,
                 estado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`;

        const params = [
            data.tipo_documento || 'CC',
            data.numero_documento,
            data.lugar_expedicion || null,
            data.fecha_expedicion || null,
            data.nombres,
            data.apellidos,
            data.fecha_nacimiento || null,
            data.lugar_nacimiento || null,
            data.lugar_procedencia || null,
            data.ciudad_residencia || null,
            data.direccion_residencia || null,
            data.tipo_trabajador || null,
            data.pagaduria || null,
            data.empresa || null,
            data.sector_empresa || null,
            data.cargo || null,
            data.tiempo_cargo || null,
            data.direccion_correspondencia || null,
            data.ciudad_correspondencia || null,
            JSON.stringify(data.telefonos || []),
            data.whatsapp || null,
            data.correo_electronico || null,
            data.central_riesgos ? 1 : 0,
            data.tratamiento_datos ? 1 : 0,
            data.apertura_coopserp ? 1 : 0,
            data.estado || 'PENDIENTE',
            1
        ]

        try {
            const [result] = await pool.query(sql, params)
            return await Vinculacion.findById(result.insertId)
        } catch (error) {
            // ✅ Manejo específico para cédula duplicada (numero_documento tiene índice único)
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ya existe una solicitud registrada con este número de documento');
            }
            console.error('Error en create Vinculacion:', error);
            throw error;
        }
    }

    static async update(id) {
        const sql = `UPDATE fase1 SET  
                tipo_documento  =?,
                lugar_expedicion = ?,
                fecha_expedicion = ?,
                nombres = ?,
                apellidos = ?,
                fecha_nacimiento = ?,
                lugar_nacimiento = ?,
                lugar_procedencia = ?,
                ciudad_residencia = ?,
                direccion_residencia = ?,
                tipo_trabajador = ?,
                pagaduria = ?,
                empresa = ?,
                sector_empresa = ?,
                cargo = ?,
                tiempo_cargo = ?,
                direccion_correspondencia = ?,
                ciudad_correspondencia = ?,
                telefonos = ?,
                whatsapp = ?,
                correo_electronico = ?,
                centrar_riesgos = ?,
                tratameinto_datos = ?,
                apertura_coopserp = ?,
                fecha_actualizacion = NOW()
                 WHERE id_solicitante = ? and activo= 1`;

        const params = [
            data.tipo_documento || 'CC',
            data.lugar_expedicion || null,
            data.fecha_expedicion || null,
            data.nombres,
            data.apellidos,
            data.fecha_nacimiento || null,
            data.lugar_nacimiento || null,
            data.lugar_procedencia || null,
            data.ciudad_residencia || null,
            data.direccion_residencia || null,
            data.tipo_trabajador || null,
            data.pagaduria || null,
            data.empresa || null,
            data.sector_empresa || null,
            data.cargo || null,
            data.tiempo_cargo || null,
            data.direccion_correspondencia || null,
            data.ciudad_correspondencia || null,
            JSON.stringify(data.telefonos || []),
            data.whatsapp || null,
            data.correo_electronico || null,
            data.centrar_riesgos ? 1 : 0,
            data.tratameinto_datos ? 1 : 0,
            data.apertura_coopserp ? 1 : 0,

            id
        ];

        try {
            const [result] = await pool.query(sql, params);
            if (result.affectedRows === 0) {
                return null;

            }
            return await Vinculacion.findById(id)
        } catch (error) {
            console.error('Error en findAll Asociado:', error);
            throw error;
        }
    }

    static async findById(id) {
        const sql = "SELECT * from fase1 where id_solicitante =? and activo = 1";
        try {
            const [rows] = await pool.query(sql, [id])
            return rows.length > 0 ? new Vinculacion(rows[0]) : null;

        } catch (error) {
            console.error('Error en findAll Asociado:', error);
            throw error;
        }
    }

    static async findByDocumento(numero_documento) {
        const sql = "SELECT * from fase1 where numero_documento = ? and activo = 1";
        try {
            const [rows] = await pool.query(sql, [numero_documento])
            return rows.length > 0 ? new Vinculacion(rows[0]) : null;

        } catch (error) {
            console.error('Error en findAll Asociado:', error);
            throw error;
        }
    }

    static async findAll(filters = {}) {
        let sql = `SELECT * FROM fase1 WHERE activo = 1`;
        const params = [];

        if (filters.estado) {
            sql += ` AND estado = ?`;
            params.push(filters.estado);
        }

        if (filters.numero_documento) {
            sql += ` AND numero_documento LIKE ?`;
            params.push(`%${filters.numero_documento}%`);
        }

        if (filters.nombres) {
            sql += ` AND nombres LIKE ?`;
            params.push(`%${filters.nombres}%`);
        }

        if (filters.apellidos) {
            sql += ` AND apellidos LIKE ?`;
            params.push(`%${filters.apellidos}%`);
        }

        if (filters.cuenta_asociado) {
            sql += ` AND cuenta_asociado = ?`;
            params.push(filters.cuenta_asociado);
        }

        sql += ` ORDER BY fecha_creacion DESC`;

        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 20;
        const offset = (page - 1) * limit;

        try {
            let countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
            const [countResult] = await pool.query(countSql, params);
            const total = countResult[0]?.total || 0;

            sql += ` LIMIT ? OFFSET ?`;
            const [rows] = await pool.query(sql, [...params, limit, offset]);

            return {
                data: rows.map(row => new Vinculacion(row)),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Error en findAll Vinculacion:', error);
            throw error;
        }
    }

}

module.exports = Vinculacion;