const express = require('express')
const router = express.Router()
const vinculacionController = require('../controllers/vinculacionController')

router.post('/', vinculacionController.create);
router.get('/', vinculacionController.getAll);
router.get('/:id', vinculacionController.getById);
router.get('/documento/:numero_documento', vinculacionController.getByDocumento);
router.get('/validar/:numero_documento', vinculacionController.validarDocumento);
router.put('/:id/estado', vinculacionController.updateEstado);


router.get('/usuario/:id_usuario', vinculacionController.getByUsuarioAfiliador);
router.get('/usuario/:id_usuario/estadisticas', vinculacionController.getEstadisticasByUsuario);
router.get('/link/:codigo', vinculacionController.getByCodigoLink);
router.get('/estadisticas/generales', vinculacionController.getEstadisticasGenerales);

module.exports = router