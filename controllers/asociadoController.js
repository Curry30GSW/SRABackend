const Asociado = require('../models/asociadoModel')

exports.getAll = async (req, res) => {
    try {
        const {
            search,
            limit,
            page,
            segmento,
            sortBy,
            sortOrder,
            salarioMin,
            salarioMax,
            motivo,
            distrito
        } = req.query;

        const filters = {};
        if (search) filters.search = search;
        if (limit) filters.limit = parseInt(limit);
        if (page) filters.page = parseInt(page);
        if (segmento) filters.segmento = segmento;
        if (sortBy) filters.sortBy = sortBy;
        if (sortOrder) filters.sortOrder = sortOrder;
        if (salarioMin) filters.salarioMin = salarioMin;
        if (salarioMax) filters.salarioMax = salarioMax;
        if (motivo && motivo !== '' && motivo !== 'todos') filters.motivo = motivo;
        if (distrito && distrito !== '' && distrito !== 'todos') filters.distrito = distrito;

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

exports.getEstadisticas = async (req, res) => {
    try {
        const filters = {
            search: req.query.search
        };

        const estadisticas = await Asociado.getEstadisticas(filters);

        res.json({
            success: true,
            ...estadisticas
        });
    } catch (error) {
        console.error('Error en getEstadisticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas',
            error: error.message
        });
    }
}