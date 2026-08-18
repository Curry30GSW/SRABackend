const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// ✅ Rutas de autenticación
router.post('/login', loginController.login);
router.post('/logout', loginController.logout);
router.post('/refresh-token', loginController.refreshToken);
router.get('/me', loginController.getCurrentUser);
router.get('/check-auth', loginController.checkAuth);

// ✅ CRUD Usuarios (admin)
router.get('/usuarios', loginController.getUsuarios);
router.post('/usuarios', loginController.createUsuario);
router.put('/usuarios/:id', loginController.updateUsuario);

module.exports = router;