const pool = require('../config/mysqlConnection');
const { executeQuery } = require('../config/db');

class Asociado {
    constructor(data = {}) {
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
        this.DESC03 = data.DESC03 ? data.DESC03.trim() : '';
        this.FECN05 = data.FECN05 ? data.FECN05.toString().trim() : '';
    }

    static async findAll(filters = {}) {
        let sql = `
    SELECT 
        ACP05.DIST05,
        ACP05.NCTA05,
        ACP05.DESC05,
        ACP05.NNIT05,
        ACP05.CIUD05,
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
        ACP03.DESC03 
    FROM COLIB.ACP04 ACP04
    INNER JOIN COLIB.ACP05 ACP05 ON ACP05.NOMI05 = ACP04.NOMI04
    INNER JOIN COLIB.ACP054 ACP054 ON ACP054.EMPR05 = ACP05.EMPR05 AND ACP054.NCTA05 = ACP05.NCTA05
    INNER JOIN COLIB.ACP03 ACP03 ON ACP03.DIST03 = ACP05.DIST05  
    WHERE ACP05.DIST05 != 0
        AND ACP05.INDC05 = 2
        AND ACP05.AAUX05 NOT IN (60, 61)
        AND ACP05.NOMI05 NOT IN ('38', 'XS', 'TÑ', 'JK', 'LU')
        AND ACP05.EMPR05 = '01'
        AND ACP04.DESC04 != 'CUENTA INHABILITADA'
    `;

        const params = [];
        const countParams = [];

        let countSql = `
    SELECT COUNT(*) as total
    FROM COLIB.ACP04 ACP04
    INNER JOIN COLIB.ACP05 ACP05 ON ACP05.NOMI05 = ACP04.NOMI04
    INNER JOIN COLIB.ACP054 ACP054 ON ACP054.EMPR05 = ACP05.EMPR05 AND ACP054.NCTA05 = ACP05.NCTA05
    INNER JOIN COLIB.ACP03 ACP03 ON ACP03.DIST03 = ACP05.DIST05  
    WHERE ACP05.DIST05 != 0
        AND ACP05.INDC05 = 2
        AND ACP05.AAUX05 NOT IN (60, 61)
        AND ACP05.NOMI05 NOT IN ('38', 'XS', 'TÑ', 'JK', 'LU')
        AND ACP05.EMPR05 = '01'
        AND ACP04.DESC04 != 'CUENTA INHABILITADA'
    `;

        // ✅ 1. FILTRO POR BÚSQUEDA GLOBAL
        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            const searchCondition = ` AND (ACP05.DESC05 LIKE ? OR ACP05.NNIT05 LIKE ? OR ACP05.CIUD05 LIKE ?)`;
            sql += searchCondition;
            countSql += searchCondition;
            params.push(searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        // ✅ 2. FILTRO POR DISTRITO (AGENCIA)
        if (filters.distrito && filters.distrito !== '' && filters.distrito !== 'todos') {
            const distritoCondition = ` AND ACP05.DIST05 = ?`;
            sql += distritoCondition;
            countSql += distritoCondition;
            params.push(filters.distrito);
            countParams.push(filters.distrito);
        }

        // ✅ 3. FILTRO POR MOTIVO DE RETIRO
        if (filters.motivo && filters.motivo !== '' && filters.motivo !== 'todos') {
            const motivoCondition = ` AND ACP05.MORE05 = ?`;
            sql += motivoCondition;
            countSql += motivoCondition;
            params.push(filters.motivo);
            countParams.push(filters.motivo);
        }

        // ✅ 4. FILTRO POR RANGO DE SALARIO
        const baseField = `CAST(REPLACE(REPLACE(ACP05.BASE05, ',', ''), '.', '') AS DECIMAL(15,2))`;

        if (filters.salarioMin && filters.salarioMin !== '') {
            const salarioMinCondition = ` AND ${baseField} >= ?`;
            sql += salarioMinCondition;
            countSql += salarioMinCondition;
            params.push(parseFloat(filters.salarioMin));
            countParams.push(parseFloat(filters.salarioMin));
        }

        if (filters.salarioMax && filters.salarioMax !== '') {
            const salarioMaxCondition = ` AND ${baseField} <= ?`;
            sql += salarioMaxCondition;
            countSql += salarioMaxCondition;
            params.push(parseFloat(filters.salarioMax));
            countParams.push(parseFloat(filters.salarioMax));
        }

        // ✅ 5. FILTRO POR SEGMENTO
        if (filters.segmento && filters.segmento !== 'todos' && filters.segmento !== '') {
            let segmentCondition = '';
            if (filters.segmento === 'oro') {
                segmentCondition = ` AND ${baseField} >= 5000000`;
            } else if (filters.segmento === 'plata') {
                segmentCondition = ` AND ${baseField} >= 3500000 AND ${baseField} < 5000000`;
            } else if (filters.segmento === 'bronce') {
                segmentCondition = ` AND ${baseField} < 3500000`;
            }

            sql += segmentCondition;
            countSql += segmentCondition;
        }

        // ✅ 6. ORDENAMIENTO
        if (filters.sortBy) {
            const validSortFields = ['DESC05', 'NNIT05', 'CIUD05', 'FRDA05', 'DIST05'];
            let sortField = filters.sortBy;
            let sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';

            if (filters.sortBy === 'BASE05') {
                sortField = baseField;
            } else if (filters.sortBy === 'DIST05') {
                sortField = 'ACP05.DIST05';
            } else if (validSortFields.includes(filters.sortBy)) {
                sortField = filters.sortBy;
            } else {
                sortField = 'ACP05.DIST05';
            }

            sql += ` ORDER BY ${sortField} ${sortOrder}`;
        } else {
            sql += ` ORDER BY ACP05.DIST05 ASC`;
        }

        // ✅ 7. PAGINACIÓN
        const page = parseInt(filters.page) || 1;
        let limit = parseInt(filters.limit) || 20;
        const offset = (page - 1) * limit;

        try {
            const countResult = await executeQuery(countSql, countParams);
            const row = countResult[0] || {};
            const total = row.total ?? row.TOTAL ?? row.Total ?? 0;

            sql += ` LIMIT ? OFFSET ?`;
            const queryParams = [...params, limit, offset];


            const result = await executeQuery(sql, queryParams);
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
                AND ACP05.NOMI05 NOT IN ('38', 'XS', 'TÑ', 'JK', 'LU')
                AND ACP04.DESC04 != 'CUENTA INHABILITADA'
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
            ACP05.EMPR05,
            ACP05.FECN05,
            ACP03.DESC03 
        FROM COLIB.ACP04 ACP04
        INNER JOIN COLIB.ACP05 ACP05 ON ACP05.NOMI05 = ACP04.NOMI04
        INNER JOIN COLIB.ACP054 ACP054 ON ACP054.EMPR05 = ACP05.EMPR05 AND ACP054.NCTA05 = ACP05.NCTA05
        INNER JOIN COLIB.ACP03 ACP03 ON ACP03.DIST03 = ACP05.DIST05 
        WHERE 
            ACP05.NCTA05 = ?
            AND ACP05.DIST05 != 0
            AND ACP05.INDC05 = 2
            AND ACP05.AAUX05 NOT IN (60, 61)
            AND ACP05.NOMI05 NOT IN ('38', 'XS', 'TÑ', 'JK', 'LU')
            AND ACP05.EMPR05 = '01'
            AND ACP04.DESC04 != 'CUENTA INHABILITADA'
        ORDER BY ACP05.DESC05 ASC
    `;

        try {
            const result = await executeQuery(sql, [numeroCuenta]);
            return result.map(row => new Asociado(row));
        } catch (error) {
            console.error('Error en findByCuenta:', error);
            throw error;
        }
    }

    static async getEstadisticas(filters = {}) {
        let sql = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN CAST(ACP05.BASE05 AS DECIMAL(15,2)) >= 5000000 THEN 1 ELSE 0 END) as oro,
                    SUM(CASE WHEN CAST(ACP05.BASE05 AS DECIMAL(15,2)) >= 3500000 AND CAST(ACP05.BASE05 AS DECIMAL(15,2)) < 5000000 THEN 1 ELSE 0 END) as plata,
                    SUM(CASE WHEN CAST(ACP05.BASE05 AS DECIMAL(15,2)) < 3500000 THEN 1 ELSE 0 END) as bronce
                FROM COLIB.ACP04 ACP04
                INNER JOIN COLIB.ACP05 ACP05 ON ACP05.NOMI05 = ACP04.NOMI04
                INNER JOIN COLIB.ACP054 ACP054 ON ACP054.EMPR05 = ACP05.EMPR05 AND ACP054.NCTA05 = ACP05.NCTA05
                WHERE ACP05.DIST05 != 0
                    AND ACP05.INDC05 = 2
                    AND ACP05.AAUX05 NOT IN (60, 61)
                    AND ACP05.NOMI05 NOT IN ('38', 'XS', 'TÑ', 'JK', 'LU')
                    AND ACP05.EMPR05 = '01'
                    AND ACP04.DESC04 != 'CUENTA INHABILITADA'
                `;

        const params = [];

        // ✅ BÚSQUEDA
        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            sql += ` AND (ACP05.DESC05 LIKE ? OR ACP05.NNIT05 LIKE ? OR ACP05.CIUD05 LIKE ?)`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        try {
            const result = await executeQuery(sql, params);
            const row = result[0] || {};

            return {
                total: parseInt(row.TOTAL) || 0,
                oro: parseInt(row.ORO) || 0,
                plata: parseInt(row.PLATA) || 0,
                bronce: parseInt(row.BRONCE) || 0
            };
        } catch (error) {
            console.error('Error en getEstadisticas:', error);
            throw error;
        }
    }

    static async exportAll(filters = {}) {
        const exportFilters = { ...filters };
        delete exportFilters.page;
        delete exportFilters.limit;

        let sql = `
            SELECT 
                ACP05.DIST05,
                ACP05.NCTA05,
                ACP05.DESC05,
                ACP05.NNIT05,
                ACP05.CIUD05,
                ACP05.MORE05,
                ACP05.FRDA05,
                ACP05.BASE05,
                ACP05.FECN05,
                ACP054.MAIL05,
                ACP054.TCEL05,
                ACP054.TCE205,
                ACP054.TCE305,
                ACP054.WHA105,
                ACP054.WHA205,
                ACP054.WHA305,
                ACP04.DESC04,
                ACP03.DESC03 
            FROM COLIB.ACP04 ACP04
            INNER JOIN COLIB.ACP05 ACP05 ON ACP05.NOMI05 = ACP04.NOMI04
            INNER JOIN COLIB.ACP054 ACP054 ON ACP054.EMPR05 = ACP05.EMPR05 AND ACP054.NCTA05 = ACP05.NCTA05
            INNER JOIN COLIB.ACP03 ACP03 ON ACP03.DIST03 = ACP05.DIST05  
            WHERE ACP05.DIST05 != 0
                AND ACP05.INDC05 = 2
                AND ACP05.AAUX05 NOT IN (60, 61)
                AND ACP05.NOMI05 NOT IN ('38', 'XS', 'TÑ', 'JK', 'LU')
                AND ACP05.EMPR05 = '01'
                AND ACP04.DESC04 != 'CUENTA INHABILITADA'
            `;

        const params = [];

        // 1. FILTRO POR BÚSQUEDA GLOBAL
        if (exportFilters.search) {
            const searchTerm = `%${exportFilters.search}%`;
            sql += ` AND (ACP05.DESC05 LIKE ? OR ACP05.NNIT05 LIKE ? OR ACP05.CIUD05 LIKE ?)`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        //  2. FILTRO POR DISTRITO (AGENCIA)
        if (exportFilters.distrito && exportFilters.distrito !== '' && exportFilters.distrito !== 'todos') {
            sql += ` AND ACP05.DIST05 = ?`;
            params.push(exportFilters.distrito);
        }

        //  3. FILTRO POR MOTIVO DE RETIRO
        if (exportFilters.motivo && exportFilters.motivo !== '' && exportFilters.motivo !== 'todos') {
            sql += ` AND ACP05.MORE05 = ?`;
            params.push(exportFilters.motivo);
        }

        //  4. FILTRO POR RANGO DE SALARIO
        const baseField = `CAST(REPLACE(REPLACE(ACP05.BASE05, ',', ''), '.', '') AS DECIMAL(15,2))`;

        if (exportFilters.salarioMin && exportFilters.salarioMin !== '') {
            sql += ` AND ${baseField} >= ?`;
            params.push(parseFloat(exportFilters.salarioMin));
        }

        if (exportFilters.salarioMax && exportFilters.salarioMax !== '') {
            sql += ` AND ${baseField} <= ?`;
            params.push(parseFloat(exportFilters.salarioMax));
        }

        // 5. FILTRO POR SEGMENTO
        if (exportFilters.segmento && exportFilters.segmento !== 'todos' && exportFilters.segmento !== '') {
            if (exportFilters.segmento === 'oro') {
                sql += ` AND ${baseField} >= 5000000`;
            } else if (exportFilters.segmento === 'plata') {
                sql += ` AND ${baseField} >= 3500000 AND ${baseField} < 5000000`;
            } else if (exportFilters.segmento === 'bronce') {
                sql += ` AND ${baseField} < 3500000`;
            }
        }

        // 6. ORDENAMIENTO (opcional, pero útil para consistencia)
        if (exportFilters.sortBy) {
            const validSortFields = ['DESC05', 'NNIT05', 'CIUD05', 'FRDA05', 'DIST05'];
            let sortField = exportFilters.sortBy;
            let sortOrder = exportFilters.sortOrder === 'desc' ? 'DESC' : 'ASC';

            if (exportFilters.sortBy === 'BASE05') {
                sortField = baseField;
            } else if (exportFilters.sortBy === 'DIST05') {
                sortField = 'ACP05.DIST05';
            } else if (validSortFields.includes(exportFilters.sortBy)) {
                sortField = exportFilters.sortBy;
            } else {
                sortField = 'ACP05.DIST05';
            }

            sql += ` ORDER BY ${sortField} ${sortOrder}`;
        } else {
            sql += ` ORDER BY ACP05.DIST05 ASC`;
        }

        try {
            //  Ejecutar sin LIMIT ni paginación
            const result = await executeQuery(sql, params);
            const data = result.map(row => new Asociado(row));

            return {
                data,
                total: data.length,
                filters: exportFilters
            };
        } catch (error) {
            console.error('Error en exportAll Asociado:', error);
            throw error;
        }
    }
}

module.exports = Asociado;