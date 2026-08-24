const { executeQuery } = require('../config/db');
const pool = require('../config/mysqlConnection');
const { Score } = require('../models/scoreModel.js')

class Vinculacion {
    constructor(data = {}) {
        this.id_solicitante = data.id_solicitante || data.id_postulacion || null;
        this.id_asociado = data.id_asociado || null;
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

        this.telefonos = data.telefonos || [];

        this.nivel_educativo = data.nivel_educativo || null;
        this.estado_civil = data.estado_civil || null;
        this.tiene_vivienda = data.tiene_vivienda || false;
        this.tiene_vehiculo = data.tiene_vehiculo || false;
        this.placa_vehiculo = data.placa_vehiculo || null;

        this.afiliador_nombre = data.afiliador_nombre || null;
        this.afiliador_usuario = data.afiliador_usuario || null;


        // Link
        this.codigo_link = data.codigo_link || null;
        this.id_usuario_afiliador = data.id_usuario_afiliador || null;

        // Reactivación
        this.es_reactivacion = data.es_reactivacion || 0;
        this.id_solicitud_original = data.id_solicitud_original || null;
        this.motivo_rechazo = data.motivo_rechazo || null;
    }

    // ============================================================
    // MÉTODOS PRINCIPALES
    // ============================================================

    // ✅ Crear nueva vinculación (asociado + postulación)
    static async create(data) {
        // Validaciones existentes...
        if (!data.central_riesgos || !data.tratamiento_datos || !data.apertura_coopserp) {
            throw new Error("Debe aceptar todos los términos y condiciones");
        }
        if (data.tipo_trabajador === "PENSIONADO" && !data.pagaduria?.trim()) {
            throw new Error("Si se selecciona pensionado, debe haber pagaduría");
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
            if (!data.empresa?.trim()) throw new Error('Para empleados, la empresa es obligatoria');
            if (!data.sector_empresa?.trim()) throw new Error('Para empleados, el sector de empresa es obligatorio');
            if (!data.cargo?.trim()) throw new Error('Para empleados, el cargo es obligatorio');
            if (!data.tiempo_cargo?.trim()) throw new Error('Para empleados, el tiempo de cargo es obligatorio');
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Buscar o crear el asociado
            let idAsociado = await this.findOrCreateAsociado(connection, data);

            // 2. Verificar si puede postular
            const puede = await this.puedePostular(connection, data.numero_documento);
            if (!puede.puede) {
                throw new Error(puede.mensaje);
            }

            // 3. Desactivar postulaciones anteriores del mismo asociado
            await this.desactivarPostulacionesAnteriores(connection, idAsociado);

            // 4. Crear la postulación
            const idPostulacion = await this.crearPostulacion(connection, idAsociado, data);

            // 5. Insertar teléfonos
            await this.insertarTelefonos(connection, idPostulacion, data.telefonos);

            await connection.commit();
            connection.release();

            return await this.findById(idPostulacion);

        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Error en create Vinculacion:', error);
            throw error;
        }
    }

    // ✅ Buscar o crear asociado
    static async findOrCreateAsociado(connection, data) {
        // Buscar por documento
        const sqlFind = `SELECT id_asociado FROM asociados WHERE numero_documento = ?`;
        const [rows] = await connection.query(sqlFind, [data.numero_documento]);

        if (rows.length > 0) {
            const idAsociado = rows[0].id_asociado;
            await this.updateAsociado(connection, idAsociado, data);
            return idAsociado;
        }

        const sqlInsert = `
        INSERT INTO asociados (
            tipo_documento, numero_documento, lugar_expedicion, fecha_expedicion,
            nombres, apellidos, fecha_nacimiento, lugar_nacimiento, lugar_procedencia,
            ciudad_residencia, direccion_residencia, tipo_trabajador, pagaduria,
            empresa, sector_empresa, cargo, tiempo_cargo,
            direccion_correspondencia, ciudad_correspondencia,
            whatsapp, correo_electronico,
            nivel_educativo, estado_civil, tiene_vivienda, tiene_vehiculo, placa_vehiculo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

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
            data.nivel_educativo || null,
            data.estado_civil || null,
            data.tiene_vivienda ? 1 : 0,
            data.tiene_vehiculo ? 1 : 0,
            data.placa_vehiculo || null
        ];

        const [result] = await connection.query(sqlInsert, params);
        return result.insertId;
    }

    // ✅ Actualizar asociado
    static async updateAsociado(connection, idAsociado, data) {
        const sql = `
        UPDATE asociados SET
            tipo_documento = ?,
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
            whatsapp = ?,
            correo_electronico = ?,
            nivel_educativo = ?,
            estado_civil = ?,
            tiene_vivienda = ?,
            tiene_vehiculo = ?,
            placa_vehiculo = ?,
            fecha_actualizacion = NOW()
        WHERE id_asociado = ?
    `;

        await connection.query(sql, [
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
            data.whatsapp || null,
            data.correo_electronico || null,
            data.nivel_educativo || null,
            data.estado_civil || null,
            data.tiene_vivienda ? 1 : 0,
            data.tiene_vehiculo ? 1 : 0,
            data.placa_vehiculo || null,
            idAsociado
        ]);
    }

    // ✅ Verificar si puede postular
    static async puedePostular(connection, numeroDocumento) {
        const sql = `
            SELECT p.* 
            FROM postulaciones p
            INNER JOIN asociados a ON p.id_asociado = a.id_asociado
            WHERE a.numero_documento = ? 
            AND p.estado IN ('PENDIENTE', 'EN_REVISION', 'APROBADO')
            AND p.activo = 1
            ORDER BY p.fecha_creacion DESC
            LIMIT 1
        `;
        const [rows] = await connection.query(sql, [numeroDocumento]);

        if (rows.length === 0) {
            return { puede: true, mensaje: 'Puede postular' };
        }

        const postulacion = rows[0];

        if (postulacion.estado === 'PENDIENTE' || postulacion.estado === 'EN_REVISION') {
            return {
                puede: false,
                mensaje: `Ya tiene una postulación en estado ${postulacion.estado}. Espere a que sea procesada.`
            };
        }

        if (postulacion.estado === 'APROBADO') {
            return {
                puede: false,
                mensaje: 'Ya tiene una postulación aprobada. No puede realizar otra.'
            };
        }

        return { puede: true, mensaje: 'Puede postular' };
    }

    // ✅ Desactivar postulaciones anteriores
    static async desactivarPostulacionesAnteriores(connection, idAsociado) {
        const sql = `
            UPDATE postulaciones 
            SET activo = 0, 
                fecha_actualizacion = NOW() 
            WHERE id_asociado = ? AND activo = 1
        `;
        await connection.query(sql, [idAsociado]);
    }

    // ✅ Crear postulación
    static async crearPostulacion(connection, idAsociado, data) {
        const sql = `
        INSERT INTO postulaciones (
            id_asociado, estado, codigo_link, id_usuario_afiliador,
            central_riesgos, tratamiento_datos, apertura_coopserp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        const [result] = await connection.query(sql, [
            idAsociado,
            data.estado || 'PENDIENTE',
            data.codigo_link || null,
            data.id_usuario_afiliador || null,
            data.central_riesgos ? 1 : 0,
            data.tratamiento_datos ? 1 : 0,
            data.apertura_coopserp ? 1 : 0
        ]);

        const idPostulacion = result.insertId;

        // Registrar en historial
        await this.registrarHistorial(connection, idPostulacion, 'PENDIENTE', 'NUEVA_POSTULACION', null);

        return idPostulacion;
    }

    // ✅ Insertar teléfonos
    static async insertarTelefonos(connection, idPostulacion, telefonos) {
        if (telefonos && telefonos.length > 0) {
            const telefonoSql = `
                INSERT INTO vinculacion_telefonos 
                (id_solicitante, numero) 
                VALUES (?, ?)
            `;
            for (const telefono of telefonos) {
                await connection.query(telefonoSql, [idPostulacion, telefono.trim()]);
            }
        }
    }

    // ✅ Registrar historial
    static async registrarHistorial(connection, idPostulacion, nuevoEstado, tipo, motivo) {
        const sql = `
            INSERT INTO historial_postulaciones (
                id_postulacion, estado_nuevo, motivo, observaciones
            ) VALUES (?, ?, ?, ?)
        `;
        await connection.query(sql, [
            idPostulacion,
            nuevoEstado,
            motivo || null,
            `Cambio de estado por: ${tipo}`
        ]);
    }

    // ============================================================
    // MÉTODOS DE CONSULTA
    // ============================================================

    // ✅ Buscar por ID (compatible con el frontend)
    static async findById(id) {
        const sql = `
        SELECT 
            p.id_postulacion AS id_solicitante,
            p.estado,
            p.codigo_link,
            p.id_usuario_afiliador,
            p.fecha_creacion,
            p.fecha_actualizacion,
            p.activo,
            p.central_riesgos,
            p.tratamiento_datos,
            p.apertura_coopserp,
            a.*,
            u.nombre AS afiliador_nombre,
            u.usuario AS afiliador_usuario
        FROM postulaciones p
        INNER JOIN asociados a ON p.id_asociado = a.id_asociado
        LEFT JOIN users u ON p.id_usuario_afiliador = u.id_usuario
        WHERE p.id_postulacion = ?
    `;

        try {
            const [rows] = await pool.query(sql, [id]);
            if (rows.length === 0) return null;

            const vinculacion = new Vinculacion(rows[0]);

            // Traer teléfonos
            const telefonosSql = `
            SELECT numero 
            FROM vinculacion_telefonos 
            WHERE id_solicitante = ? 
            ORDER BY id_telefono ASC
        `;
            const [telefonos] = await pool.query(telefonosSql, [id]);
            vinculacion.telefonos = telefonos.map(t => t.numero);

            return vinculacion;
        } catch (error) {
            console.error('Error en findById Vinculacion:', error);
            throw error;
        }
    }

    // ✅ Buscar por documento (compatible con el frontend)
    static async findByDocumento(numero_documento) {
        const sql = `
        SELECT 
            p.id_postulacion AS id_solicitante,
            p.estado,
            p.codigo_link,
            p.id_usuario_afiliador,
            p.fecha_creacion,
            p.fecha_actualizacion,
            p.activo,
            p.central_riesgos,
            p.tratamiento_datos,
            p.apertura_coopserp,
            a.*,
            u.nombre AS afiliador_nombre,
            u.usuario AS afiliador_usuario
         FROM postulaciones p
        INNER JOIN asociados a ON p.id_asociado = a.id_asociado
        LEFT JOIN users u ON p.id_usuario_afiliador = u.id_usuario
        WHERE a.numero_documento = ?
        AND p.activo = 1
        ORDER BY p.fecha_creacion DESC
        LIMIT 1
    `;

        try {
            const [rows] = await pool.query(sql, [numero_documento]);
            if (rows.length === 0) return null;

            const vinculacion = new Vinculacion(rows[0]);

            const telefonosSql = `
            SELECT numero 
            FROM vinculacion_telefonos 
            WHERE id_solicitante = ? 
            ORDER BY id_telefono ASC
        `;
            const [telefonos] = await pool.query(telefonosSql, [vinculacion.id_solicitante]);
            vinculacion.telefonos = telefonos.map(t => t.numero);

            return vinculacion;
        } catch (error) {
            console.error('Error en findByDocumento Vinculacion:', error);
            throw error;
        }
    }

    // ✅ Obtener todas las postulaciones de un asociado
    static async getPostulacionesByDocumento(numero_documento) {
        const sql = `
            SELECT 
                p.id_postulacion AS id_solicitante,
                p.estado,
                p.codigo_link,
                p.id_usuario_afiliador,
                p.fecha_creacion,
                p.fecha_actualizacion,
                p.activo,
                p.motivo_rechazo,
                a.*,
                u.nombre AS afiliador_nombre,
                u.usuario AS afiliador_usuario
            FROM postulaciones p
            INNER JOIN asociados a ON p.id_asociado = a.id_asociado
            LEFT JOIN users u ON p.id_usuario_afiliador = u.id_usuario
            WHERE a.numero_documento = ?
            ORDER BY p.fecha_creacion DESC
        `;

        try {
            const [rows] = await pool.query(sql, [numero_documento]);
            return rows.map(row => new Vinculacion(row));
        } catch (error) {
            console.error('Error en getPostulacionesByDocumento:', error);
            throw error;
        }
    }

    // ✅ Obtener historial de una postulación
    static async getHistorial(idPostulacion) {
        const sql = `
            SELECT 
                h.*,
                u.nombre AS usuario_nombre
            FROM historial_postulaciones h
            LEFT JOIN users u ON h.usuario_modifica = u.usuario
            WHERE h.id_postulacion = ?
            ORDER BY h.fecha_cambio DESC
        `;
        try {
            const [rows] = await pool.query(sql, [idPostulacion]);
            return rows;
        } catch (error) {
            console.error('Error en getHistorial:', error);
            throw error;
        }
    }


    static async cambiarEstado(idPostulacion, nuevoEstado, motivo, usuario) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            if (nuevoEstado === 'SCORE_BAJO') {
                const vinculacion = await this.findById(idPostulacion);
                const scoreInfo = await Score.getScoreByNit(vinculacion.numero_documento);

                if (!scoreInfo.tiene_score) {
                    throw new Error('No se ha realizado la consulta de score para este asociado');
                }

                if (scoreInfo.score >= 650) {
                    throw new Error(`El score del asociado es ${scoreInfo.score}, superior a 650. No aplica para "Score bajo".`);
                }
            }

            const sql = `
            UPDATE postulaciones 
            SET estado = ?, 
                motivo_rechazo = ?,
                fecha_actualizacion = NOW() 
            WHERE id_postulacion = ?
        `;
            await connection.query(sql, [nuevoEstado, motivo || null, idPostulacion]);

            await this.registrarHistorial(connection, idPostulacion, nuevoEstado, 'CAMBIO_ESTADO', motivo);

            await connection.commit();
            connection.release();
            return true;
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Error en cambiarEstado:', error);
            throw error;
        }
    }

    // ============================================================
    // MÉTODOS EXISTENTES (adaptados)
    // ============================================================

    // ✅ findAll - Listar todas las postulaciones
    static async findAll(filters = {}) {
        let sql = `
        SELECT 
            p.id_postulacion AS id_solicitante,
            p.estado,
            p.codigo_link,
            p.id_usuario_afiliador,
            p.fecha_creacion,
            p.fecha_actualizacion,
            p.activo,
            p.central_riesgos,
            p.tratamiento_datos,
            p.apertura_coopserp,
            a.id_asociado,
            a.tipo_documento,
            a.numero_documento,
            a.lugar_expedicion,
            a.fecha_expedicion,
            a.nombres,
            a.apellidos,
            a.fecha_nacimiento,
            a.lugar_nacimiento,
            a.lugar_procedencia,
            a.ciudad_residencia,
            a.direccion_residencia,
            a.tipo_trabajador,
            a.pagaduria,
            a.empresa,
            a.sector_empresa,
            a.cargo,
            a.tiempo_cargo,
            a.direccion_correspondencia,
            a.ciudad_correspondencia,
            a.whatsapp,
            a.correo_electronico,
            a.nivel_educativo,
            a.estado_civil,
            a.tiene_vivienda,
            a.tiene_vehiculo,
            a.placa_vehiculo,
            u.nombre AS afiliador_nombre,
            u.usuario AS afiliador_usuario
        FROM postulaciones p
        INNER JOIN asociados a ON p.id_asociado = a.id_asociado
        LEFT JOIN users u ON p.id_usuario_afiliador = u.id_usuario
        WHERE p.activo = 1
    `;
        const params = [];

        if (filters.estado) {
            sql += ` AND p.estado = ?`;
            params.push(filters.estado);
        }

        if (filters.numero_documento) {
            sql += ` AND a.numero_documento LIKE ?`;
            params.push(`%${filters.numero_documento}%`);
        }

        if (filters.nombres) {
            sql += ` AND a.nombres LIKE ?`;
            params.push(`%${filters.nombres}%`);
        }

        if (filters.apellidos) {
            sql += ` AND a.apellidos LIKE ?`;
            params.push(`%${filters.apellidos}%`);
        }

        sql += ` ORDER BY p.fecha_creacion DESC`;

        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 20;
        const offset = (page - 1) * limit;

        try {
            let countSql = sql.replace(
                /SELECT .* FROM postulaciones p INNER JOIN asociados a ON p.id_asociado = a.id_asociado LEFT JOIN users u ON p.id_usuario_afiliador = u.id_usuario/,
                'SELECT COUNT(*) as total FROM postulaciones p INNER JOIN asociados a ON p.id_asociado = a.id_asociado LEFT JOIN users u ON p.id_usuario_afiliador = u.id_usuario'
            );
            const [countResult] = await pool.query(countSql, params);
            const total = countResult[0]?.total || 0;

            sql += ` LIMIT ? OFFSET ?`;
            const [rows] = await pool.query(sql, [...params, limit, offset]);

            // ✅ Obtener todos los IDs de solicitud para traer teléfonos en una sola consulta
            const ids = rows.map(row => row.id_solicitante);

            let telefonosMap = {};

            if (ids.length > 0) {
                const telefonosSql = `
                SELECT id_solicitante, numero 
                FROM vinculacion_telefonos 
                WHERE id_solicitante IN (?) 
                ORDER BY id_telefono ASC
            `;
                const [telefonos] = await pool.query(telefonosSql, [ids]);

                // Agrupar teléfonos por id_solicitante
                telefonosMap = telefonos.reduce((acc, telefono) => {
                    if (!acc[telefono.id_solicitante]) {
                        acc[telefono.id_solicitante] = [];
                    }
                    acc[telefono.id_solicitante].push(telefono.numero);
                    return acc;
                }, {});
            }


            const data = rows.map(row => {
                const vinculacion = new Vinculacion(row);
                vinculacion.telefonos = telefonosMap[row.id_solicitante] || [];
                return vinculacion;
            });

            return {
                data,
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

    // ✅ getByUsuarioAfiliador - Postulaciones por usuario afiliador
    static async getByUsuarioAfiliador(idUsuario) {
        const sql = `
            SELECT 
                p.id_postulacion AS id_solicitante,
                p.estado,
                p.codigo_link,
                p.id_usuario_afiliador,
                p.fecha_creacion,
                p.fecha_actualizacion,
                a.*,
                u.nombre AS afiliador_nombre,
                u.usuario AS afiliador_usuario
            FROM postulaciones p
                INNER JOIN asociados a ON p.id_asociado = a.id_asociado
                LEFT JOIN users u ON p.id_usuario_afiliador = u.id_usuario
                WHERE p.id_usuario_afiliador = ? 
                AND p.activo = 1 
                ORDER BY p.fecha_creacion DESC
        `;
        try {
            const [rows] = await pool.query(sql, [idUsuario]);
            return rows.map(row => new Vinculacion(row));
        } catch (error) {
            console.error('Error en getByUsuarioAfiliador:', error);
            throw error;
        }
    }

    // ✅ getEstadisticasByUsuario - Estadísticas por usuario afiliador
    static async getEstadisticasByUsuario(idUsuario) {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'APROBADO' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) as rechazados,
                SUM(CASE WHEN estado = 'EN_REVISION' THEN 1 ELSE 0 END) as en_revision
            FROM postulaciones 
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

    // ✅ getByCodigoLink - Postulaciones por código de link
    static async getByCodigoLink(codigoLink) {
        const sql = `
            SELECT 
                p.id_postulacion AS id_solicitante,
                p.estado,
                p.codigo_link,
                p.id_usuario_afiliador,
                p.fecha_creacion,
                p.fecha_actualizacion,
                a.*,
                u.nombre AS afiliador_nombre,
                u.usuario AS afiliador_usuario
            FROM postulaciones p
            INNER JOIN asociados a ON p.id_asociado = a.id_asociado
            LEFT JOIN users u ON p.id_usuario_afiliador = u.id_usuario
            WHERE p.codigo_link = ? 
            AND p.activo = 1 
            ORDER BY p.fecha_creacion DESC
        `;
        try {
            const [rows] = await pool.query(sql, [codigoLink]);
            return rows.map(row => new Vinculacion(row));
        } catch (error) {
            console.error('Error en getByCodigoLink:', error);
            throw error;
        }
    }

    // ✅ getEstadisticasGenerales - Estadísticas generales
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
            FROM postulaciones 
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

    // ✅ validarDocumento - Validar documento contra AS400 (se mantiene igual)
    static async validarDocumento(numero_documento) {
        try {
            // ... (tu código existente)
            const sql = `SELECT ACP05.NNIT05, ACP05.INDC05, ACP05.DESC05, ACP05.NCTA05, ACP04.DESC04, ACP05.DIST05, ACP03.DESC03
            FROM COLIB.ACP05 ACP05 
            INNER JOIN COLIB.ACP04 ACP04 ON ACP05.NOMI05 = ACP04.NOMI04 
            INNER JOIN COLIB.ACP03 ACP03 ON ACP05.DIST05 = ACP03.DIST03 
            WHERE ACP05.NNIT05 = ? AND ACP05.EMPR05 = '01' `;
            const result = await executeQuery(sql, [numero_documento]);

            if (!result || result.length === 0) {
                return {
                    existe: false,
                    puede_pasar: true,
                    tipo: 'NUEVO',
                    mensaje: 'Cédula no encontrada - Usuario nuevo'
                };
            }

            const data = result[0];
            const indc05 = parseInt(data.INDC05) || 0;

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
            console.error("Error en el validate", error);
            throw error;
        }
    }

    // ✅ update - Actualizar postulación (compatible con frontend)
    static async update(id, data) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Actualizar asociado
            const sqlAsociado = `
                UPDATE asociados SET
                    tipo_documento = ?,
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
                    whatsapp = ?,
                    correo_electronico = ?,
                    fecha_actualizacion = NOW()
                WHERE id_asociado = (SELECT id_asociado FROM postulaciones WHERE id_postulacion = ?)
            `;
            await connection.query(sqlAsociado, [
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
                data.whatsapp || null,
                data.correo_electronico || null,
                id
            ]);

            // Actualizar teléfonos (borrar y reinsertar)
            await connection.query('DELETE FROM vinculacion_telefonos WHERE id_solicitante = ?', [id]);
            await this.insertarTelefonos(connection, id, data.telefonos || []);

            await connection.commit();
            connection.release();

            return await this.findById(id);
        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('Error en update Vinculacion:', error);
            throw error;
        }
    }


}

module.exports = Vinculacion;