require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const odbc = require('odbc');

const connectionString = `DSN=${process.env.ODBC_DSN};UID=${process.env.ODBC_USER};PWD=${process.env.ODBC_PASSWORD};CCSID=1208`;


let connection;

const connectToDatabase = async () => {
    try {
        if (!connection) {
            connection = await odbc.connect(connectionString);
            console.log('Conexión establecida con AS400');
        }
        return connection;
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        throw error;
    }
};

const executeQuery = async (query, params = []) => {
    try {
        const conn = await connectToDatabase();
        return await conn.query(query, params);
    } catch (error) {
        console.error('❌ Error al ejecutar la consulta en AS400:', error);


        const esErrorConexion = (
            error.odbcErrors &&
            error.odbcErrors.some(e => e.state === '08S01' && e.code === 2013)
        );

        if (esErrorConexion) {
            console.log('🔁 Error crítico de conexión (AS400). Reiniciando el proceso...');
            process.exit(1);
        }

        if (error.message.includes('Connection') || error.message.includes('conexión')) {
            connection = null;
        }

        throw error;
    }
};

// const connectionStringPagares = `DSN=${process.env.ODBC_DSN_PAGARE};UID=${process.env.ODBC_USERPAGARE};PWD=${process.env.ODBC_PASSWORDPAGARE};CHARSET=UTF8;timeout=300`;

// let connectionPagares;

// const connectToPagares = async () => {
//     try {
//         if (!connectionPagares) {
//             connectionPagares = await odbc.connect(connectionStringPagares);
//             console.log('✅ Conexión establecida con Pagares');
//         }
//         return connectionPagares;
//     } catch (error) {
//         console.error('❌ Error al conectar con Pagares:', error);
//         throw error;
//     }
// };

// const executeQueryPagares = async (query, params = []) => {
//     try {
//         const conn = await connectToPagares();
//         return await conn.query(query, params);
//     } catch (error) {
//         console.error('❌ Error en consulta Pagares:', error);

//         const esErrorConexion = (
//             error.odbcErrors &&
//             error.odbcErrors.some(e => e.state === '08S01' && e.code === 2013)
//         );

//         if (esErrorConexion) {
//             console.log('🔁 Error crítico de conexión (PAGARES). Reiniciando el proceso...');
//             process.exit(1); // <-- importante para que PM2 lo levante
//         }

//         if (error.message.includes('Connection') || error.message.includes('conexión')) {
//             connectionPagares = null;
//         }

//         throw error;
//     }
// };

module.exports = {
    executeQuery,
    connectToDatabase,
    connection
    // executeQueryPagares,
    // connectToPagares
};
