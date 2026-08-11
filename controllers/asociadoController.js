const Asociado = require('../models/asociadoModel')

exports.getAll = async (req, res) => {
    try {
        const { distrito, auxiliar, search, limit, page } = req.query;

        const filters = {};
        if (distrito) filters.distrito = parseInt(distrito);
        if (auxiliar) filters.auxiliar = parseInt(auxiliar);
        if (search) filters.search = search;
        if (limit) filters.limit = parseInt(limit);
        if (page) filters.page = parseInt(page);

        // ✅ El método findAll ya devuelve { data, pagination }
        const result = await Asociado.findAll(filters);

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
            count: result.data.length,
            total: result.pagination.total,
            filters: filters
        });
    } catch (error) {
        console.error('Error en getAll asociados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los asociados',
            error: error.message
        });
    }
}

exports.getByNit = async (req, res) => {
    try {
        const { nit } = req.params;
        console.log(`🔍 Buscando asociado por NIT: ${nit}`);
        // cedula requerida
        if (!nit) {
            return res.status(404).json({
                success: false,
                message: 'NIT es requerido'
            })
        }

        const asociados = await Asociado.findByNit(nit);

        // cedula no existe
        if (asociados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'la cedula no existe o no esta retirado'
            })
        }

        res.json({
            success: true,
            data: asociados,
            count: asociados.length
        })

    } catch (error) {
        console.error('Error en getByNit asociados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los asociados por cedula',
            error: error.message
        });
    }
}

exports.getByCuenta = async (req, res) => {
    try {
        const { numeroCuenta } = req.params

        // cuenta es necesaria
        if (!numeroCuenta) {
            return res.status(400).json({
                success: false,
                message: 'Número de cuenta es requerido'
            });
        }

        const asociados = await Asociado.findByCuenta(numeroCuenta);

        // cuenta no se encuentra
        if (asociados.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No se encontró asociado con esta cuenta: ${numeroCuenta}`
            });
        }
        res.json({
            success: true,
            data: asociados,
            count: asociados.length
        })

    } catch (error) {
        console.error('Error en getByCuenta asociados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los asociados por cuenta',
            error: error.message
        });
    }
}