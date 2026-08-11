const express = require('express')
const router = express.Router();
const gestionController = require('../controllers/gestionController');


router.post('/', gestionController.create)
// router.get('/:id')

// rutas para buscar
router.get('/', gestionController.getAll)
router.get('/id/:id', gestionController.getById )
router.get('/cedula/:cedula', gestionController.getByCedula)

module.exports = router