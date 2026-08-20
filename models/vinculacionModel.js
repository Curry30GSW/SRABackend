const { executeQuery } = require('../config/db')
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

        this.telefonos = []

        //Link
        this.codigo_link = data.codigo_link || null;
        this.id_usuario_afiliador = data.id_usuario_afiliador || null;
    }

    static async create(data) {
        if (!data.central_riesgos || !data.tratamiento_datos || !data.apertura_coopserp) {
            throw new Error("Debe aceptar todos los terminos y condiciones")
        }
        if (data.tipo_trabajador === "PENSIONADO" && !data.pagaduria?.trim()) {
            throw new Error("Si se selecciona pensionado, debe haber pagaduria")
        }

        if (!data.telefonos || data.telefonos.length === 0) {
            throw new Error("Debe proporcionar al menos un número de teléfono");
        }

        for (const telefono of data.telefonos) {
            if (!telefono || telefono.trim() === '') {
                throw new Error("Todos los números de teléfono son obligatorios");
            }
            if (!/^\d+$/.test(telefono.trim())) {
                throw new Error("El número de teléfono solo debe contener dígitos");
            }
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

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const sql = `INSERT INTO fase1 ( tipo_documento, numero_documento, lugar_expedicion, fecha_expedicion,
                nombres, apellidos, fecha_nacimiento, lugar_nacimiento, 
                lugar_procedencia, ciudad_residencia, direccion_residencia,
                tipo_trabajador, pagaduria, empresa, sector_empresa, cargo, tiempo_cargo,
                direccion_correspondencia, ciudad_correspondencia, whatsapp, correo_electronico,
                central_riesgos, tratamiento_datos, apertura_coopserp,
                estado, activo, codigo_link, id_usuario_afiliador) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`;

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
                data.whatsapp || null,
                data.correo_electronico || null,
                data.central_riesgos ? 1 : 0,
                data.tratamiento_datos ? 1 : 0,
                data.apertura_coopserp ? 1 : 0,
                data.estado || 'PENDIENTE',
                1,
                data.codigo_link || null,
                data.id_usuario_afiliador || null
            ]

            const [result] = await connection.query(sql, params)
            const idVinculacion = result.insertId;

            // 2. Insertar teléfonos
            if (data.telefonos && data.telefonos.length > 0) {
                const telefonoSql = `
                    INSERT INTO vinculacion_telefonos 
                    (id_solicitante, numero) 
                    VALUES (?, ?)
                `;

                for (const telefono of data.telefonos) {
                    await connection.query(telefonoSql, [
                        idVinculacion,
                        telefono.trim()
                    ]);
                }
            }

            await connection.commit();
            connection.release();

            return await Vinculacion.findById(result.insertId)

        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Error en findAll Asociado:', error);
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
            if (rows.length === 0) return null;

            const vinculacion = new Vinculacion(rows[0]);

            const telefonosSql = `
            SELECT numero 
            FROM vinculacion_telefonos 
            WHERE id_solicitante = ? 
            ORDER BY id_telefono ASC
        `;
            const [telefonos] = await pool.query(telefonosSql, [id]);

            // 4. Asignar los teléfonos a la instancia
            vinculacion.telefonos = telefonos.map(t => t.numero);

            return vinculacion;


        } catch (error) {
            console.error('Error en findById Asociado:', error);
            throw error;
        }
    }

    static async findByDocumento(numero_documento) {
        const sql = "SELECT * FROM fase1 WHERE numero_documento = ? AND activo = 1";
        try {
            // 1. Traer datos principales
            const [rows] = await pool.query(sql, [numero_documento]);
            if (rows.length === 0) return null;

            // 2. Crear instancia con los datos
            const vinculacion = new Vinculacion(rows[0]);

            // 3. Traer los teléfonos usando el ID
            const telefonosSql = `
            SELECT numero 
            FROM vinculacion_telefonos 
            WHERE id_solicitante = ? 
            ORDER BY id_telefono ASC
        `;
            const [telefonos] = await pool.query(telefonosSql, [vinculacion.id_solicitante]);

            // 4. Asignar los teléfonos a la instancia
            vinculacion.telefonos = telefonos.map(t => t.numero);

            return vinculacion;
        } catch (error) {
            console.error('Error en findByDocumento Vinculacion:', error);
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

    static async getByUsuarioAfiliador(idUsuario) {
        const sql = `
            SELECT * FROM fase1 
            WHERE id_usuario_afiliador = ? 
            AND activo = 1 
            ORDER BY fecha_creacion DESC
        `;
        try {
            const [rows] = await pool.query(sql, [idUsuario]);
            return rows.map(row => new Vinculacion(row));
        } catch (error) {
            console.error('Error en getByUsuarioAfiliador:', error);
            throw error;
        }
    }

    static async getEstadisticasByUsuario(idUsuario) {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'APROBADO' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) as rechazados,
                SUM(CASE WHEN estado = 'EN_REVISION' THEN 1 ELSE 0 END) as en_revision
            FROM fase1 
            WHERE id_usuario_afiliador = ? 
            AND activo = 1
        `;
        try {
            const [rows] = await pool.query(sql, [idUsuario]);
            return rows[0];
        } catch (error) {
            console.error('Error en getEstadisticasByUsuario:', error);
            throw error;
        }
    }

    static async getByCodigoLink(codigoLink) {
        const sql = `
            SELECT * FROM fase1 
            WHERE codigo_link = ? 
            AND activo = 1 
            ORDER BY fecha_creacion DESC
        `;
        try {
            const [rows] = await pool.query(sql, [codigoLink]);
            return rows.map(row => new Vinculacion(row));
        } catch (error) {
            console.error('Error en getByCodigoLink:', error);
            throw error;
        }
    }

    static async getEstadisticasGenerales() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'APROBADO' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) as rechazados,
                SUM(CASE WHEN estado = 'EN_REVISION' THEN 1 ELSE 0 END) as en_revision,
                COUNT(DISTINCT id_usuario_afiliador) as total_afiliadores,
                SUM(CASE WHEN id_usuario_afiliador IS NOT NULL THEN 1 ELSE 0 END) as con_link,
                SUM(CASE WHEN id_usuario_afiliador IS NULL THEN 1 ELSE 0 END) as espontaneas
            FROM fase1 
            WHERE activo = 1
        `;
        try {
            const [rows] = await pool.query(sql);
            return rows[0];
        } catch (error) {
            console.error('Error en getEstadisticasGenerales:', error);
            throw error;
        }
    }

    static async validarDocumento(numero_documento) {
        try {
            const sql = `SELECT ACP05.NNIT05, ACP05.INDC05, ACP05.DESC05, ACP05.NCTA05, ACP04.DESC04, ACP05.DIST05, ACP03.DESC03
            FROM COLIB.ACP05 ACP05 
            INNER JOIN COLIB.ACP04 ACP04 ON ACP05.NOMI05 = ACP04.NOMI04 
            INNER JOIN COLIB.ACP03 ACP03 ON ACP05.DIST05 = ACP03.DIST03 
            WHERE  ACP05.NNIT05 = ? AND ACP05.EMPR05 = '01' `;
            const result = await executeQuery(sql, [numero_documento])

            // No existe
            if (!result || result.length === 0) {
                return {
                    existe: false,
                    puede_pasar: true,
                    tipo: 'NUEVO',
                    mensaje: 'Cédula no encontrada - Usuario nuevo'
                };
            }

            // Existe → verificar estado
            const data = result[0];
            const indc05 = parseInt(data.INDC05) || 0;


            // INDC05 = 0 → Activo (NO puede pasar)
            if (indc05 === 0) {
                return {
                    existe: true,
                    puede_pasar: false,
                    tipo: 'ACTIVO',
                    mensaje: 'Ya tiene una cuenta activa en la cooperativa',
                    data: {
                        nombre: data.DESC05?.trim() || '',
                        cuenta: data.NCTA05?.toString() || '',
                        estado: 'ACTIVO',
                        nomina: data.DESC04?.trim() || '',
                        agencia: `${data.DIST05} - ${data.DESC03}`
                    }
                };
            }

            // INDC05 = 2 → Retirado (Puede pasar)
            if (indc05 === 2) {
                return {
                    existe: true,
                    puede_pasar: true,
                    tipo: 'RETIRADO',
                    mensaje: 'Asociado retirado - Puede iniciar proceso de revinculación',
                    data: {
                        nombre: data.DESC05?.trim() || '',
                        cuenta: data.NCTA05?.toString() || '',
                        estado: 'RETIRADO',
                        nomina: data.DESC04?.trim() || '',
                        agencia: `${data.DIST05} - ${data.DESC03}`
                    }
                };
            }
            // Otros estados
            return {
                existe: true,
                puede_pasar: false,
                tipo: 'OTRO',
                mensaje: `Estado no permitido (INDC05 = ${indc05})`,
                data: {
                    nombre: data.DESC05?.trim() || '',
                    cuenta: data.NCTA05?.toString() || '',
                    estado: 'DESCONOCIDO',
                    nomina: data.DESC04?.trim() || '',
                    agencia: `${data.DIST05} - ${data.DESC03}`
                }
            };

        } catch (error) {
            console.error("Erro en el validate", error)
            throw error
        }
    }
}

module.exports = Vinculacion;