const vinculacion = require('../models/vinculacionModel')
const LinkAfiliacion = require('../models/LinkAfiliacionModel')

exports.create = async (req, res) => {
    try {
        const data = req.body;
        const { codigo_link } = req.query;

        // Validaciones básicas
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

        // Verificar si ya existe un proceso con esta cédula
        const existente = await vinculacion.findByDocumento(data.numero_documento);

        if (existente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un proceso con esta cédula'
            });
        }

        // Si viene un código de link, validarlo
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

exports.getByDocumento = async (req, res) => {
    try {
        const { numero_documento } = req.params;
        const resultado = await vinculacion.findByDocumento(numero_documento);


        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'No Documento no existe'
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

exports.getByCuenta = async (req, res) => {
    try {
        const { cuenta } = req.params;
        const resultado = await Vinculacion.findByCuenta(cuenta);

        res.status(200).json({
            success: true,
            data: resultado,
            count: resultado.length
        });
    } catch (error) {
        console.error('Error en getByCuenta Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar por cuenta',
            error: error.message
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        const {
            estado,
            numero_documento,
            nombres,
            apellidos,
            cuenta_asociado,
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

exports.updateEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado) {
            return res.status(400).json({
                success: false,
                message: 'El estado es requerido'
            });
        }

        const resultado = await vinculacion.updateEstado(id, estado);

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