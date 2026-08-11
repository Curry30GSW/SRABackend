const express = require('express');
const router = express.Router();
const asociadoController = require('../controllers/asociadoController');



router.get('/cuenta/:numeroCuenta', asociadoController.getByCuenta)
router.get('/nit/:nit', asociadoController.getByNit)


router.get('/', asociadoController.getAll)
module.exports = router     