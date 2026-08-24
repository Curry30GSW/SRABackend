const express = require('express')
const router = express.Router()
const vinculacionController = require('../controllers/vinculacionController')

// ============================================================
// RUTAS EXISTENTES (SE MANTIENEN IGUALES)
// ============================================================

// Crear nueva vinculación
router.post('/', vinculacionController.create);

// Obtener todas (paginado)
router.get('/', vinculacionController.getAll);

// Obtener por ID
router.get('/:id', vinculacionController.getById);

// Obtener por documento
router.get('/documento/:numero_documento', vinculacionController.getByDocumento);

// Validar documento contra AS400
router.get('/validar/:numero_documento', vinculacionController.validarDocumento);

// Cambiar estado
router.put('/:id/estado', vinculacionController.updateEstado);

// Obtener por usuario afiliador
router.get('/usuario/:id_usuario', vinculacionController.getByUsuarioAfiliador);

// Estadísticas por usuario
router.get('/usuario/:id_usuario/estadisticas', vinculacionController.getEstadisticasByUsuario);

// Obtener por código de link
router.get('/link/:codigo', vinculacionController.getByCodigoLink);

// Estadísticas generales
router.get('/estadisticas/generales', vinculacionController.getEstadisticasGenerales);

// ============================================================
// NUEVAS RUTAS (OPCIONALES, PARA FUNCIONALIDADES EXTRA)
// ============================================================

// ✅ Obtener todas las postulaciones de un documento (historial de postulaciones)
router.get('/postulaciones/:numero_documento', vinculacionController.getPostulacionesByDocumento);

// ✅ Obtener historial de estados de una postulación
router.get('/historial/:id', vinculacionController.getHistorial);

// ✅ Verificar si puede postular
router.get('/puede-postular/:numero_documento', vinculacionController.puedePostular);

// ✅ Cambiar estado con motivo (versión mejorada)
router.put('/:id/cambiar-estado', vinculacionController.cambiarEstado);

// ✅ Actualizar datos del asociado
router.put('/:id', vinculacionController.update);

// ✅ Eliminar (soft delete)
router.delete('/:id', vinculacionController.delete);

module.exports = router;