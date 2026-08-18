const pool = require('../config/mysqlConnection');

async function registrarAuditoria(usuario, ip, accion, detalles = null) {
    let evento = accion;

    // Si hay detalles, agregarlos al evento
    if (detalles) {
        if (typeof detalles === 'object') {
            evento = `${accion} - ${JSON.stringify(detalles)}`;
        } else {
            evento = `${accion} - ${detalles}`;
        }
    }

    const query = `INSERT INTO auditoria (usuario, ip, evento, fecha) VALUES (?, ?, ?, NOW())`;
    await pool.execute(query, [usuario, ip, evento]);
}

// Función para obtener la IP del request
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        '0.0.0.0';
}

// Función para obtener el usuario del request
function getUsuarioFromRequest(req) {
    return req.user?.nombre || req.user?.usuario || req.cookies?.usuario || 'Sistema';
}

module.exports = {
    registrarAuditoria,
    getClientIp,
    getUsuarioFromRequest
};