const { executeQuery } = require('../config/db');

class Score {
    constructor(data = {}) {
        this.score = data.score || data.SCORE || null;
        this.fec_score = data.fec_score || data.FEC_SCORE || null;
    }

    static async getScoreByNit(nit) {
        const sql = `
            SELECT 
                score,
                fec_score
            FROM COLIB.ACPSCORE 
            WHERE nit = ?
            ORDER BY fec_score DESC 
            LIMIT 1
        `;

        try {
            const result = await executeQuery(sql, [nit]);

            if (result && result.length > 0) {
                const row = result[0];
                return {
                    score: row.score || row.SCORE,
                    fec_score: row.fec_score || row.FEC_SCORE,
                    tiene_score: true
                };
            }
            return {
                score: null,
                fec_score: null,
                tiene_score: false
            };
        } catch (error) {
            console.error('Error obteniendo score:', error);
            return {
                score: null,
                fec_score: null,
                tiene_score: false
            };
        }
    }
}

module.exports = Score;