const vinculacion = require('../models/vinculacionModel');
const LinkAfiliacion = require('../models/LinkAfiliacionModel');

// ============================================================
// CREAR NUEVA POSTULACIÓN
// ============================================================
exports.create = async (req, res) => {
    try {
        const data = req.body;
        const { codigo_link } = req.query;

        if (!data.numero_documento) {
            return res.status(400).json({
                success: false,
                message: 'El número de documento es requerido'
            });
        }

        if (!data.nombres || !data.apellidos) {
            return res.status(400).json({
                success: false,
                message: 'Nombres y apellidos son requeridos'
            });
        }

        // ✅ Verificar si existe una postulación activa
        try {
            const puedePostular = await vinculacion.puedePostular(data.numero_documento);
            if (!puedePostular.puede) {
                return res.status(400).json({
                    success: false,
                    message: puedePostular.mensaje
                });
            }
        } catch (error) {
            // Si el método no existe, continuar con validación tradicional
            const existente = await vinculacion.findByDocumento(data.numero_documento);
            if (existente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un proceso activo con esta cédula'
                });
            }
        }

        let idUsuarioAfiliador = null;
        let linkValido = false;

        if (codigo_link) {
            const resultado = await LinkAfiliacion.validarLink(codigo_link);
            if (!resultado.valido) {
                return res.status(400).json({
                    success: false,
                    message: resultado.message
                });
            }
            linkValido = true;
            idUsuarioAfiliador = resultado.link.id_usuario;
            await LinkAfiliacion.incrementarUso(codigo_link);
        }

        const vinculacionData = {
            ...data,
            codigo_link: codigo_link || null,
            id_usuario_afiliador: idUsuarioAfiliador
        };

        const resultado = await vinculacion.create(vinculacionData);

        res.status(201).json({
            success: true,
            message: linkValido
                ? 'Solicitud de vinculación creada exitosamente a través del link'
                : 'Solicitud de vinculación creada exitosamente',
            data: resultado,
            tipo: linkValido ? 'Con link' : 'Espontánea'
        });

    } catch (error) {
        console.error('Error en create Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al guardar los datos',
            error: error.message
        });
    }
};

// ============================================================
// OBTENER POR ID
// ============================================================
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await vinculacion.findById(id);

        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error en getById Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el registro',
            error: error.message
        });
    }
};

// ============================================================
// OBTENER POR DOCUMENTO
// ============================================================
exports.getByDocumento = async (req, res) => {
    try {
        const { numero_documento } = req.params;
        const resultado = await vinculacion.findByDocumento(numero_documento);

        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'No existe un registro con este documento'
            });
        }

        res.status(200).json({
            success: true,
            data: resultado,
            existe: !!resultado
        });
    } catch (error) {
        console.error('Error en getByDocumento Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar por documento',
            error: error.message
        });
    }
};

// ============================================================
// OBTENER TODAS LAS POSTULACIONES DE UN DOCUMENTO (NUEVO)
// ============================================================
exports.getPostulacionesByDocumento = async (req, res) => {
    try {
        const { numero_documento } = req.params;

        if (!numero_documento) {
            return res.status(400).json({
                success: false,
                message: 'Número de documento requerido'
            });
        }

        const resultado = await vinculacion.getPostulacionesByDocumento(numero_documento);

        res.status(200).json({
            success: true,
            data: resultado,
            count: resultado.length
        });
    } catch (error) {
        console.error('Error en getPostulacionesByDocumento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las postulaciones',
            error: error.message
        });
    }
};

// ============================================================
// OBTENER HISTORIAL DE UNA POSTULACIÓN (NUEVO)
// ============================================================
exports.getHistorial = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de postulación requerido'
            });
        }

        const historial = await vinculacion.getHistorial(id);

        res.status(200).json({
            success: true,
            data: historial,
            count: historial.length
        });
    } catch (error) {
        console.error('Error en getHistorial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial',
            error: error.message
        });
    }
};

// ============================================================
// LISTAR TODOS (Paginado)
// ============================================================
exports.getAll = async (req, res) => {
    try {
        const {
            estado,
            numero_documento,
            nombres,
            apellidos,
            page,
            limit
        } = req.query;

        const filters = {};
        if (estado) filters.estado = estado;
        if (numero_documento) filters.numero_documento = numero_documento;
        if (nombres) filters.nombres = nombres;
        if (apellidos) filters.apellidos = apellidos;
        if (page) filters.page = parseInt(page);
        if (limit) filters.limit = parseInt(limit);

        const resultado = await vinculacion.findAll(filters);

        res.status(200).json({
            success: true,
            data: resultado.data,
            pagination: resultado.pagination,
            filters
        });
    } catch (error) {
        console.error('Error en getAll Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los registros',
            error: error.message
        });
    }
};

// ============================================================
// ACTUALIZAR ESTADO (MANTIENE COMPATIBILIDAD CON FRONTEND)
// ============================================================
exports.updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const usuario = req.user?.nombre || req.cookies?.usuario || 'SISTEMA';

        if (!estado) {
            return res.status(400).json({
                success: false,
                message: 'El estado es requerido'
            });
        }

        // ✅ Actualizar con todos los estados disponibles
        const estadosValidos = [
            'PENDIENTE',
            'EN_REVISION',
            'APROBADO',
            'RECHAZADO',
            'DESISTIMIENTO',
            'CAPACIDAD_PAGO_NEGATIVA',
            'SCORE_BAJO',
            'EMBARGO',
            'EMPRESA_PRIVADA',
            'PENDIENTE_DATACREDITO',
            'EN_TRAMITE'
        ];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no válido. Estados permitidos: ' + estadosValidos.join(', ')
            });
        }

        const resultado = await vinculacion.cambiarEstado(id, estado, null, usuario);

        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Estado actualizado correctamente'
        });

    } catch (error) {
        console.error('Error en updateEstado Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado',
            error: error.message
        });
    }
};

// ============================================================
// CAMBIAR ESTADO CON MOTIVO (NUEVO, MÁS COMPLETO)
// ============================================================
exports.cambiarEstado = async (idPostulacion, nuevoEstado, motivo, usuario) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Verificar si la postulación existe
        const postulacion = await this.findById(idPostulacion);
        if (!postulacion) {
            throw new Error('Postulación no encontrada');
        }

        // ✅ Si ya está en el mismo estado, no hacer nada
        if (postulacion.estado === nuevoEstado) {
            await connection.commit();
            connection.release();
            return true;
        }

        // ✅ Validar que el estado sea válido
        const estadosValidos = [
            'PENDIENTE',
            'EN_REVISION',
            'APROBADO',
            'RECHAZADO',
            'DESISTIMIENTO',
            'CAPACIDAD_PAGO_NEGATIVA',
            'SCORE_BAJO',
            'EMBARGO',
            'EMPRESA_PRIVADA',
            'PENDIENTE_DATACREDITO',
            'EN_TRAMITE'
        ];

        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error(`Estado no válido: ${nuevoEstado}`);
        }

        // ✅ Si es EN_TRAMITE (Fase 2), validar que tenga score
        if (nuevoEstado === 'EN_TRAMITE') {
            // Verificar si tiene score
            const scoreInfo = await this.getScoreByNit(postulacion.numero_documento);

            if (!scoreInfo || !scoreInfo.tiene_score) {
                throw new Error('No se ha realizado la consulta de score para este asociado. No puede pasar a Fase 2.');
            }

            // Verificar que no esté en un estado que impida pasar a Fase 2
            const estadosInvalidos = ['RECHAZADO', 'DESISTIMIENTO', 'CAPACIDAD_PAGO_NEGATIVA', 'SCORE_BAJO', 'EMBARGO', 'EMPRESA_PRIVADA'];
            if (estadosInvalidos.includes(postulacion.estado)) {
                throw new Error(`No se puede pasar a Fase 2 porque la postulación está en estado "${postulacion.estado}"`);
            }
        }

        // ✅ Si es SCORE_BAJO, validar que tenga score y que sea menor a 650
        if (nuevoEstado === 'SCORE_BAJO') {
            const scoreInfo = await this.getScoreByNit(postulacion.numero_documento);

            if (!scoreInfo || !scoreInfo.tiene_score) {
                throw new Error('No se ha realizado la consulta de score para este asociado. Primero debe consultar el score.');
            }

            if (scoreInfo.score >= 650) {
                throw new Error(`El score del asociado es ${scoreInfo.score}, superior o igual a 650. No aplica para "Score bajo".`);
            }
        }

        // ✅ Actualizar el estado
        const sql = `
            UPDATE postulaciones 
            SET estado = ?, 
                motivo_rechazo = ?,
                fecha_actualizacion = NOW() 
            WHERE id_postulacion = ?
        `;
        await connection.query(sql, [nuevoEstado, motivo || null, idPostulacion]);

        // Registrar en historial
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
};

// ============================================================
// OBTENER POR USUARIO AFILIADOR
// ============================================================
exports.getByUsuarioAfiliador = async (req, res) => {
    try {
        const { id_usuario } = req.params;

        if (!id_usuario) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario requerido'
            });
        }

        const vinculaciones = await vinculacion.getByUsuarioAfiliador(id_usuario);
        const estadisticas = await vinculacion.getEstadisticasByUsuario(id_usuario);

        res.json({
            success: true,
            data: vinculaciones,
            estadisticas: estadisticas,
            count: vinculaciones.length
        });

    } catch (error) {
        console.error('Error en getByUsuarioAfiliador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las vinculaciones por usuario',
            error: error.message
        });
    }
};

// ============================================================
// OBTENER POR CÓDIGO DE LINK
// ============================================================
exports.getByCodigoLink = async (req, res) => {
    try {
        const { codigo } = req.params;

        if (!codigo) {
            return res.status(400).json({
                success: false,
                message: 'Código de link requerido'
            });
        }

        const vinculaciones = await vinculacion.getByCodigoLink(codigo);

        res.json({
            success: true,
            data: vinculaciones,
            count: vinculaciones.length
        });

    } catch (error) {
        console.error('Error en getByCodigoLink:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las vinculaciones por link',
            error: error.message
        });
    }
};

// ============================================================
// ESTADÍSTICAS GENERALES
// ============================================================
exports.getEstadisticasGenerales = async (req, res) => {
    try {
        const estadisticas = await vinculacion.getEstadisticasGenerales();

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('Error en getEstadisticasGenerales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas generales',
            error: error.message
        });
    }
};

// ============================================================
// ESTADÍSTICAS POR USUARIO
// ============================================================
exports.getEstadisticasByUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;

        if (!id_usuario) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario requerido'
            });
        }

        const estadisticas = await vinculacion.getEstadisticasByUsuario(id_usuario);

        res.json({
            success: true,
            data: estadisticas
        });

    } catch (error) {
        console.error('Error en getEstadisticasByUsuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas del usuario',
            error: error.message
        });
    }
};

// ============================================================
// VALIDAR DOCUMENTO (CONTRA AS400)
// ============================================================
exports.validarDocumento = async (req, res) => {
    try {
        const { numero_documento } = req.params;

        if (!numero_documento) {
            return res.status(400).json({
                success: false,
                message: 'El número de documento es requerido'
            });
        }

        const resultado = await vinculacion.validarDocumento(numero_documento);

        return res.status(200).json({
            success: true,
            ...resultado
        });

    } catch (error) {
        console.error('Error en validarDocumento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar el documento',
            error: error.message
        });
    }
};

// ============================================================
// VERIFICAR SI PUEDE POSTULAR (NUEVO)
// ============================================================
exports.puedePostular = async (req, res) => {
    try {
        const { numero_documento } = req.params;

        if (!numero_documento) {
            return res.status(400).json({
                success: false,
                message: 'Número de documento requerido'
            });
        }

        const resultado = await vinculacion.puedePostular(numero_documento);

        res.status(200).json({
            success: true,
            data: resultado
        });

    } catch (error) {
        console.error('Error en puedePostular:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar si puede postular',
            error: error.message
        });
    }
};

// ============================================================
// ACTUALIZAR POSTULACIÓN (NUEVO)
// ============================================================
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const existente = await vinculacion.findById(id);
        if (!existente) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        const resultado = await vinculacion.update(id, data);

        res.status(200).json({
            success: true,
            message: 'Registro actualizado correctamente',
            data: resultado
        });

    } catch (error) {
        console.error('Error en update Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el registro',
            error: error.message
        });
    }
};

// ============================================================
// ELIMINAR (SOFT DELETE) - NUEVO
// ============================================================
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const existente = await vinculacion.findById(id);
        if (!existente) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        const usuario = req.user?.nombre || req.cookies?.usuario || 'SISTEMA';
        await vinculacion.cambiarEstado(id, 'RECHAZADO', 'Eliminado por usuario', usuario);

        res.status(200).json({
            success: true,
            message: 'Registro desactivado correctamente'
        });

    } catch (error) {
        console.error('Error en delete Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el registro',
            error: error.message
        });
    }
};


exports.pasarFase2 = async (req, res) => {
    try {
        const { id } = req.params;
        const { score, fecha_score } = req.body;
        const usuario = req.user?.nombre || req.cookies?.usuario || 'SISTEMA';

        // Verificar que la postulación existe
        const postulacion = await vinculacion.findById(id);
        if (!postulacion) {
            return res.status(404).json({
                success: false,
                message: 'Postulación no encontrada'
            });
        }

        // ✅ Verificar que tiene score
        if (!score) {
            return res.status(400).json({
                success: false,
                message: 'Debe tener un score registrado para pasar a Fase 2'
            });
        }

        // ✅ Verificar que no esté ya en Fase 2
        if (postulacion.estado === 'EN_TRAMITE') {
            return res.status(400).json({
                success: false,
                message: 'La postulación ya está en Fase 2'
            });
        }

        // ✅ Verificar que no esté en un estado que impida pasar a Fase 2
        const estadosInvalidos = ['RECHAZADO', 'DESISTIMIENTO', 'CAPACIDAD_PAGO_NEGATIVA', 'SCORE_BAJO', 'EMBARGO', 'EMPRESA_PRIVADA'];
        if (estadosInvalidos.includes(postulacion.estado)) {
            return res.status(400).json({
                success: false,
                message: `No se puede pasar a Fase 2 porque la postulación está en estado "${postulacion.estado}"`
            });
        }

        // Crear registro en fase2
        const fase2Data = {
            id_postulacion: id,
            id_asociado: postulacion.id_asociado,
            score: score,
            fecha_score: fecha_score || new Date()
        };

        const fase2 = await vinculacion.crearFase2(fase2Data);

        // Cambiar estado a EN_TRAMITE
        await vinculacion.cambiarEstado(id, 'EN_TRAMITE', 'Paso a Fase 2', usuario);

        res.status(200).json({
            success: true,
            message: 'Postulación pasada a Fase 2 exitosamente',
            data: fase2
        });

    } catch (error) {
        console.error('Error en pasarFase2:', error);
        res.status(500).json({
            success: false,
            message: 'Error al pasar a Fase 2',
            error: error.message
        });
    }
};


exports.getFase2ByPostulacion = async (req, res) => {
    try {
        const { idPostulacion } = req.params;

        if (!idPostulacion) {
            return res.status(400).json({
                success: false,
                message: 'ID de postulación requerido'
            });
        }

        const fase2 = await vinculacion.getFase2ByPostulacion(idPostulacion);

        if (!fase2) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró información de Fase 2 para esta postulación'
            });
        }

        res.status(200).json({
            success: true,
            data: fase2
        });

    } catch (error) {
        console.error('Error en getFase2ByPostulacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la información de Fase 2',
            error: error.message
        });
    }
};

// ============================================================
// ACTUALIZAR FASE 2 CON REFERENCIAS
// ============================================================
exports.actualizarFase2 = async (req, res) => {
    try {
        const { idPostulacion } = req.params;
        const data = req.body;

        // Verificar que la postulación existe
        const postulacion = await vinculacion.findById(idPostulacion);
        if (!postulacion) {
            return res.status(404).json({
                success: false,
                message: 'Postulación no encontrada'
            });
        }

        // Verificar que esté en Fase 2
        if (postulacion.estado !== 'EN_TRAMITE') {
            return res.status(400).json({
                success: false,
                message: `La postulación no está en Fase 2. Estado actual: ${postulacion.estado}`
            });
        }

        // Validaciones básicas
        if (!data.familiar1_nombre || !data.familiar1_parentesco || !data.familiar1_telefono) {
            return res.status(400).json({
                success: false,
                message: 'La referencia familiar 1 es requerida (nombre, parentesco, teléfono)'
            });
        }

        if (!data.personal1_nombre || !data.personal1_telefono) {
            return res.status(400).json({
                success: false,
                message: 'La referencia personal 1 es requerida (nombre, teléfono)'
            });
        }

        const fase2Actualizado = await vinculacion.actualizarFase2(idPostulacion, data);

        if (!fase2Actualizado) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el registro de Fase 2 para actualizar'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Información de Fase 2 actualizada correctamente',
            data: fase2Actualizado
        });

    } catch (error) {
        console.error('Error en actualizarFase2:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la información de Fase 2',
            error: error.message
        });
    }
};

// ============================================================
// VERIFICAR SI UNA POSTULACIÓN TIENE FASE 2
// ============================================================
exports.tieneFase2 = async (req, res) => {
    try {
        const { idPostulacion } = req.params;

        if (!idPostulacion) {
            return res.status(400).json({
                success: false,
                message: 'ID de postulación requerido'
            });
        }

        const tiene = await vinculacion.tieneFase2(idPostulacion);

        res.status(200).json({
            success: true,
            data: {
                id_postulacion: parseInt(idPostulacion),
                tiene_fase2: tiene
            }
        });

    } catch (error) {
        console.error('Error en tieneFase2:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar Fase 2',
            error: error.message
        });
    }
};

exports.getFase2ById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID de Fase 2 requerido'
            });
        }

        const fase2 = await vinculacion.getFase2ById(id);

        if (!fase2) {
            return res.status(404).json({
                success: false,
                message: 'Registro de Fase 2 no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: fase2
        });

    } catch (error) {
        console.error('Error en getFase2ById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el registro de Fase 2',
            error: error.message
        });
    }
};

exports.getAllFase2 = async (req, res) => {
    try {
        const {
            page,
            limit,
            estado,
            numero_documento,
            nombres,
            apellidos
        } = req.query;

        const filters = {};
        if (page) filters.page = parseInt(page);
        if (limit) filters.limit = parseInt(limit);
        if (estado) filters.estado = estado;
        if (numero_documento) filters.numero_documento = numero_documento;
        if (nombres) filters.nombres = nombres;
        if (apellidos) filters.apellidos = apellidos;

        const resultado = await vinculacion.getAllFase2(filters);

        res.status(200).json({
            success: true,
            data: resultado.data,
            pagination: resultado.pagination,
            filters
        });

    } catch (error) {
        console.error('Error en getAllFase2:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las Fase 2',
            error: error.message
        });
    }
};
