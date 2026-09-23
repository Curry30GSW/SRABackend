const express = require('express')

const router = express.Router();
const userController = require('../controllers/userController')

router.get('/estadisticas', userController.getEstadisticas)


router.post('/', userController.create)

router.get('/', userController.getAll)

router.get('/id/:id', userController.getByID)


router.put('/:id/contraseña', userController.changePassword)




module.exports = router