const Score = require('../models/scoreModel')

exports.getScore = async (req, res) => {
    try {
        const { nit } = req.params;

        if (!nit) {
            return res.status(400).json({
                success: false,
                message: 'NIT requerido'
            });
        }

        const scoreInfo = await Score.getScoreByNit(nit);

        res.json({
            success: true,
            data: scoreInfo
        });
    } catch (error) {
        console.error('Error en getScore:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el score',
            error: error.message
        });
    }
};