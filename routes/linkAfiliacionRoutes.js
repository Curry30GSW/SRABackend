const express = require('express');
const router = express.Router();
const linkAfiliacionController = require('../controllers/linkAfiliacionController');

// Rutas para links de afiliación
router.post('/', linkAfiliacionController.crearLink);
router.get('/usuario/:id_usuario', linkAfiliacionController.obtenerLinks);
router.get('/validar/:codigo', linkAfiliacionController.validarLink);
router.put('/desactivar/:codigo', linkAfiliacionController.desactivarLink);

module.exports = router;