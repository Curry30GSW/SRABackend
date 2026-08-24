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

        const estadosValidos = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO'];
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
exports.cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, motivo } = req.body;
        const usuario = req.user?.nombre || req.cookies?.usuario || 'SISTEMA';

        if (!estado) {
            return res.status(400).json({
                success: false,
                message: 'El estado es requerido'
            });
        }

        const estadosValidos = [
            'PENDIENTE',
            'EN_REVISION',
            'APROBADO',
            'RECHAZADO',
            'DESISTIMIENTO',
            'CAPACIDAD_PAGO_NEGATIVA',
            'SCORE_BAJO',
            'EMBARGO',
            'EMPRESA_PRIVADA'
        ];

        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no válido. Estados permitidos: ' + estadosValidos.join(', ')
            });
        }

        const resultado = await vinculacion.cambiarEstado(id, estado, motivo, usuario);

        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Estado actualizado correctamente',
            data: { id, estado, motivo }
        });

    } catch (error) {
        console.error('Error en cambiarEstado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado',
            error: error.message
        });
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