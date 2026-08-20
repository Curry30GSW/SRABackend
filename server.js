const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

const app = express();

app.use(express.json({
    limit: '50mb',
    verify: (req, res, buf) => {
        const size = (buf.length / 1024 / 1024).toFixed(2);
    }
}));

app.use(express.urlencoded({
    extended: true,
    limit: '50mb'
}));

app.use(cookieParser());


// Cors Configuration
app.use(cors({
    origin: [
        "http://srv-bog-tes.coopserp.com",
        "http://190.66.10.148:10704",
        "http://localhost:5000",
        "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Content-Length"],
    credentials: true,
    maxAge: 86400
}));

// Middleware para manejar errores de payload muy grande
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            error: 'El archivo es demasiado grande. El límite es de 50MB.',
            details: err.message
        });
    }
    next(err);
});

// ============================================
// RUTAS - Solo asociados por ahora
// ============================================
app.use('/api/asociados', require('./routes/asociadoRoutes.js'));
app.use('/api/gestion', require('./routes/gestionRoutes.js'));
app.use('/api/auth', require('./routes/loginRoutes.js'));
app.use('/api/vinculacion', require('./routes/vinculacionRoutes.js'));
app.use('/api/links', require('./routes/linkAfiliacionRoutes.js'));


// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API CoopSerp - Asociados',
        version: '1.0.0',
        endpoints: {
            asociados: '/api/asociados'
        }
    });
});

// ============================================
// JOBS (Comentado por ahora)
// ============================================
// try {
//     require('./jobs');
//     console.log('✅ Jobs programados iniciados correctamente');
// } catch (error) {
//     console.error('❌ Error al iniciar jobs:', error);
// }

// ============================================
// ARCHIVOS ESTÁTICOS
// ============================================

// ============================================
// MANEJO DE ERRORES (Debe ir al final)
// ============================================
// app.use(require('./middlewares/errorHandler'));

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 Servidor iniciado correctamente');
    console.log(`📦 Cargando configuración desde: ${envFile}`);
    console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚪 Puerto: ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📋 API Asociados: http://localhost:${PORT}/api/asociados`);
    console.log('========================================');
});

module.exports = app;