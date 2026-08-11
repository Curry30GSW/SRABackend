const pool = require('../config/mysqlConnection');
const { executeQuery } = require('../config/db')

class Asociado {
    constructor(data = {}) {
        // Mantener los nombres originales de AS400 y aplicar trim
        this.DIST05 = data.DIST05 ? data.DIST05.toString().trim() : '';
        this.AAUX05 = data.AAUX05 ? data.AAUX05.toString().trim() : '';
        this.NCTA05 = data.NCTA05 ? data.NCTA05.toString().trim() : '';
        this.DESC05 = data.DESC05 ? data.DESC05.trim() : '';
        this.NNIT05 = data.NNIT05 ? data.NNIT05.trim() : '';
        this.DIRE05 = data.DIRE05 ? data.DIRE05.trim() : '';
        this.CIUD05 = data.CIUD05 ? data.CIUD05.trim() : '';
        this.CORE05 = data.CORE05 ? data.CORE05.trim() : '';
        this.MORE05 = data.MORE05 ? data.MORE05.trim() : '';
        this.FRDA05 = data.FRDA05 ? data.FRDA05.toString().trim() : '';
        this.BASE05 = data.BASE05 ? data.BASE05.toString().trim() : '';
        this.MAIL05 = data.MAIL05 ? data.MAIL05.trim() : '';
        this.TCEL05 = data.TCEL05 ? data.TCEL05.trim() : '';
        this.TCE205 = data.TCE205 ? data.TCE205.trim() : '';
        this.TCE305 = data.TCE305 ? data.TCE305.trim() : '';
        this.WHA105 = data.WHA105 ? data.WHA105.trim() : '';
        this.WHA205 = data.WHA205 ? data.WHA205.trim() : '';
        this.WHA305 = data.WHA305 ? data.WHA305.trim() : '';
        this.DESC04 = data.DESC04 ? data.DESC04.trim() : '';
        this.INDC05 = data.INDC05 ? data.INDC05.toString().trim() : '';
        this.EMPR05 = data.EMPR05 ? data.EMPR05.trim() : '01';
    }

    // Obtener todos los asociados activos
    static async findAll(filters = {}) {
        let sql = `
        SELECT 
            ACP05.DIST05,
            ACP05.AAUX05,
            ACP05.NCTA05,
            ACP05.DESC05,
            ACP05.NNIT05,
            ACP05.DIRE05,
            ACP05.CIUD05,
            ACP05.CORE05,
            ACP05.MORE05,
            ACP05.FRDA05,
            ACP05.BASE05,
            ACP054.MAIL05,
            ACP054.TCEL05,
            ACP054.TCE205,
            ACP054.TCE305,
            ACP054.WHA105,
            ACP054.WHA205,
            ACP054.WHA305,
            ACP04.DESC04,
            ACP05.INDC05,
            ACP05.EMPR05
        FROM COLIB.ACP04 ACP04
        INNER JOIN COLIB.ACP05 ACP05 ON ACP05.NOMI05 = ACP04.NOMI04
        INNER JOIN COLIB.ACP054 ACP054 ON ACP054.EMPR05 = ACP05.EMPR05 AND ACP054.NCTA05 = ACP05.NCTA05
        WHERE ACP05.DIST05 != 0
            AND ACP05.INDC05 = 2
            AND ACP05.AAUX05 NOT IN (60, 61)
            AND ACP05.EMPR05 = '01'
    `;

        const params = [];

        // ✅ Construir la consulta de conteo con los mismos filtros
        let countSql = `
        SELECT COUNT(*) as total
        FROM COLIB.ACP04 ACP04
        INNER JOIN COLIB.ACP05 ACP05 ON ACP05.NOMI05 = ACP04.NOMI04
        INNER JOIN COLIB.ACP054 ACP054 ON ACP054.EMPR05 = ACP05.EMPR05 AND ACP054.NCTA05 = ACP05.NCTA05
        WHERE ACP05.DIST05 != 0
            AND ACP05.INDC05 = 2
            AND ACP05.AAUX05 NOT IN (60, 61)
            AND ACP05.EMPR05 = '01'
    `;

        // ✅ Aplicar los mismos filtros a la consulta de conteo
        if (filters.search) {
            countSql += ` AND (ACP05.DESC05 LIKE ? OR ACP05.NNIT05 LIKE ? OR ACP05.CIUD05 LIKE ?)`;
        }

        // ✅ Ordenar
        sql += ` ORDER BY ACP05.DIST05, ACP05.DESC05`;

        // ✅ Paginación
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 20;
        const offset = (page - 1) * limit;

        try {
            // ✅ Obtener total de registros (con los mismos filtros)
            const countParams = [...params]; // Clonar params
            const countResult = await executeQuery(countSql, countParams);
            const row = countResult[0] || {};
            const total = row.total ?? row.TOTAL ?? row.Total ?? 0;

            // ✅ Agregar LIMIT y OFFSET a la consulta principal
            sql += ` LIMIT ? OFFSET ?`;
            const queryParams = [...params, limit, offset];

            // ✅ Ejecutar consulta principal
            const result = await executeQuery(sql, queryParams);

            // Mapear resultados
            const data = result.map(row => new Asociado(row));

            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Error en findAll Asociado:', error);
            throw error;
        }
    }

    static async findByNit(nit) {
        const sql = `
            SELECT 
                ACP05.DIST05,
                ACP05.AAUX05,
                ACP05.NCTA05,
                ACP05.DESC05,
                ACP05.NNIT05,
                ACP05.DIRE05,
                ACP05.CIUD05,
                ACP05.CORE05,
                ACP05.MORE05,
                ACP05.FRDA05,
                ACP05.BASE05,
                ACP054.MAIL05,
                ACP054.TCEL05,
                ACP054.TCE205,
                ACP054.TCE305,
                ACP054.WHA105,
                ACP054.WHA205,
                ACP054.WHA305,
                ACP04.DESC04,
                ACP05.INDC05,
                ACP05.EMPR05
            FROM COLIB.ACP04 ACP04
            INNER JOIN COLIB.ACP05 ACP05 ON ACP05.NOMI05 = ACP04.NOMI04
            INNER JOIN COLIB.ACP054 ACP054 ON ACP054.EMPR05 = ACP05.EMPR05 AND ACP054.NCTA05 = ACP05.NCTA05
            WHERE 
                 ACP05.NNIT05 = ?
                AND ACP05.DIST05 != 0
                AND ACP05.INDC05 = 2
               
                AND ACP05.AAUX05 NOT IN (60, 61)
                AND ACP05.EMPR05 = '01'
                ORDER BY ACP05.DESC05 ASC
        `;

        try {
            const result = await executeQuery(sql, [nit])
            return result.map(row => new Asociado(row))
        } catch (error) {
            console.error('Error en findAll Asociado:', error);
            throw error;
        }
    }

    static async findByCuenta(numeroCuenta) {
        const sql = `
            SELECT 
                ACP05.DIST05,
                ACP05.AAUX05,
                ACP05.NCTA05,
                ACP05.DESC05,
                ACP05.NNIT05,
                ACP05.DIRE05,
                ACP05.CIUD05,
                ACP05.CORE05,
                ACP05.MORE05,
                ACP05.FRDA05,
                ACP05.BASE05,
                ACP054.MAIL05,
                ACP054.TCEL05,
                ACP054.TCE205,
                ACP054.TCE305,
                ACP054.WHA105,
                ACP054.WHA205,
                ACP054.WHA305,
                ACP04.DESC04,
                ACP05.INDC05,
                ACP05.EMPR05
            FROM COLIB.ACP04 ACP04
            INNER JOIN COLIB.ACP05 ACP05 ON ACP05.NOMI05 = ACP04.NOMI04
            INNER JOIN COLIB.ACP054 ACP054 ON ACP054.EMPR05 = ACP05.EMPR05 AND ACP054.NCTA05 = ACP05.NCTA05
            WHERE 
                ACP05.NCTA05 = ?
                AND ACP05.DIST05 != 0
                AND ACP05.INDC05 = 2
                AND ACP05.AAUX05 NOT IN (60, 61)
                AND ACP05.EMPR05 = '01'
                ORDER BY ACP05.DESC05 ASC
        `;

        try {
            console.log(`🔍 Buscando por número de cuenta: ${numeroCuenta}`);
            const result = await executeQuery(sql, [numeroCuenta]);
            // return result.length > 0 ? new Asociado(result[0]) : null;
            return result.map(row => new Asociado(row))
        } catch (error) {
            console.error('Error en cuenta Asociado:', error);
            throw error;
        }
    }
}

module.exports = Asociado;