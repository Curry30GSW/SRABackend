const path = require('path');
const { sendEmail, loadTemplate } = require('../config/email.config');

const logoAttachment = {
    filename: 'coopserp.png',
    path: path.join(__dirname, '../uploads/logo/coopserp.png'),
    cid: 'logo_coopserp',
    contentDisposition: 'inline',
    contentType: 'image/png',
};

const formatFecha = (fecha = new Date()) => {
    try {
        return new Date(fecha).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Bogota',
        });
    } catch {
        return '';
    }
};

/**
 * Envía el correo "Solicitud recibida" de vinculación.
 * No lanza excepción: si falla el correo, la vinculación ya quedó guardada.
 */
const enviarCorreoSolicitudVinculacion = async ({
    email,
    nombres,
    apellidos,
    documento,
    fechaSolicitud,
}) => {
    if (!email) {
        console.warn('⚠️ Vinculación sin email, no se envía correo de confirmación');
        return { success: false, error: 'Sin email' };
    }

    try {
        const html = loadTemplate('solicitudSuccess', {
            nombres: nombres || '',
            apellidos: apellidos || '',
            documento: documento || 'No especificado',
            fechaSolicitud: formatFecha(fechaSolicitud),
            year: new Date().getFullYear(),
            logoCid: 'logo_coopserp',
        });

        const info = await sendEmail(
            email,
            'Solicitud de asociación recibida — COOPSERP',
            html,
            [logoAttachment]
        );

        console.log('📧 Correo de vinculación enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error enviando correo de vinculación:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { enviarCorreoSolicitudVinculacion };