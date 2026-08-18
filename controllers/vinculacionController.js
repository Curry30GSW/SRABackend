const vinculacion = require('../models/vinculacionModel')

exports.create = async (req, res) => {
    try {
        const data = req.body;
        // const{numero_documento} = req.body

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

        const existente = await vinculacion.findByDocumento(data.numero_documento)

        if (existente) {
            return res.status(404).json({
                success: true,
                message: 'Ya existe un proceso con esta cedula'

            });
        }

        const resultado = await vinculacion.create(data)

        res.status(201).json({
            success: true,
            message: 'Datos guardados correctamente',
            data: resultado
        });
    } catch (error) {
        console.error('Error en  Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar los datos',
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
