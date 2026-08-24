const { executeQuery } = require('../config/db');

class Score {
    constructor(data = {}) {
        this.SCORE = data.SCORE ? data.SCORE.toString() : '';
        this.FEC_SCORE = data.FEC_SCORE ? data.FEC_SCORE.toString().trim() : '';
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
                return {
                    score: result[0].score,
                    fec_score: result[0].fec_score,
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