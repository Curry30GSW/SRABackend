const Gestion = require('../models/gestionModel')

exports.create = async (req, res) => {
    try {
        const { cedula, nombre, cuenta, gestion } = req.body;

        const usuario_gestion = req.body.usuario_gestion || 'SISTEMA';

        // Validaciones básicas
        if (!cedula || !nombre || !cuenta || !gestion) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: cedula, nombre, cuenta, gestion'
            });
        }

        const gestionData = {
            cedula,
            nombre,
            cuenta,
            gestion,
            usuario_gestion
        };

        const nuevaGestion = await Gestion.create(gestionData);

        res.status(201).json({
            success: true,
            data: nuevaGestion,
            message: 'Gestión creada exitosamente'
        });

    } catch (error) {
        console.error('Error en create gestion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la gestión',
            error: error.message
        });
    }
};

exports.getAll = async (req, res) => {
    try {

        const gestiones = await Gestion.getAll()

        res.status(200).json({
            success: true,
            data: gestiones,
            count: gestiones.length,

        });
    } catch (error) {
        console.error('Error en create gestion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la gestion por id',
            error: error.message
        });

    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID es requerido'
            });
        }

        const gestion = await Gestion.getById(id);

        if (gestion.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Gestión no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: gestion,
            message: 'Gestion encontrada',

        })

    } catch (error) {
        console.error('Error en create gestion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la gestion por id',
            error: error.message
        });
    }
};

exports.getByCedula = async (req, res) => {
    try {
        const { cedula } = req.params

        if (!cedula) {
            return res.status(404).json({
                success: false,
                message: 'Gestión no encontrada'
            });
        }

        const gestiones = await Gestion.getByCedula(cedula);


        if (gestiones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'la cedula no se encuentra'
            })
        }

        res.status(202).json({
            success: true,
            data: gestiones,
            count: gestiones.length,
            message: 'Gestion encontrada',

        });
    } catch (error) {
        console.error('Error en create gestion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la gestion por cuenta',
            error: error.message
        });
    }
};