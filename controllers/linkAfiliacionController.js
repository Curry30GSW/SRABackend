const LinkAfiliacion = require('../models/LinkAfiliacionModel');

exports.crearLink = async (req, res) => {
    try {
        const { id_usuario, usuario, uso_maximo = 0, dias_expiracion = 30 } = req.body;

        if (!id_usuario || !usuario) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario y nombre de usuario son requeridos'
            });
        }

        const link = await LinkAfiliacion.crear(id_usuario, usuario, uso_maximo, dias_expiracion);

        if (!link) {
            return res.status(500).json({
                success: false,
                message: 'Error al crear el link de afiliación'
            });
        }

        // Construir URL completa
        const baseUrl = process.env.APP_URL || 'http://localhost:5173';
        const urlCompleta = `${baseUrl}/afiliacion/${link.codigo}`;

        res.status(201).json({
            success: true,
            data: {
                link,
                url: urlCompleta,
                codigo: link.codigo
            },
            message: 'Link de afiliación creado exitosamente'
        });

    } catch (error) {
        console.error('Error en crearLink:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el link de afiliación',
            error: error.message
        });
    }
};

exports.obtenerLinks = async (req, res) => {
    try {
        const { id_usuario } = req.params;

        if (!id_usuario) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario requerido'
            });
        }

        const links = await LinkAfiliacion.getByUsuario(id_usuario);
        const estadisticas = await LinkAfiliacion.getEstadisticas(id_usuario);

        res.json({
            success: true,
            data: links,
            estadisticas: estadisticas,
            count: links.length
        });

    } catch (error) {
        console.error('Error en obtenerLinks:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los links de afiliación',
            error: error.message
        });
    }
};

exports.validarLink = async (req, res) => {
    try {
        const { codigo } = req.params;

        if (!codigo) {
            return res.status(400).json({
                success: false,
                message: 'Código requerido'
            });
        }

        const resultado = await LinkAfiliacion.validarLink(codigo);

        if (!resultado.valido) {
            return res.status(400).json({
                success: false,
                message: resultado.message
            });
        }

        res.json({
            success: true,
            data: {
                codigo: resultado.link.codigo,
                usuario: resultado.link.usuario,
                fecha_expiracion: resultado.link.fecha_expiracion
            },
            message: 'Link válido'
        });

    } catch (error) {
        console.error('Error en validarLink:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar el link',
            error: error.message
        });
    }
};

exports.desactivarLink = async (req, res) => {
    try {
        const { codigo } = req.params;

        if (!codigo) {
            return res.status(400).json({
                success: false,
                message: 'Código requerido'
            });
        }

        await LinkAfiliacion.desactivar(codigo);

        res.json({
            success: true,
            message: 'Link desactivado exitosamente'
        });

    } catch (error) {
        console.error('Error en desactivarLink:', error);
        res.status(500).json({
            success: false,
            message: 'Error al desactivar el link',
            error: error.message
        });
    }
};