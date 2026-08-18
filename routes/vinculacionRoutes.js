const express = require('express')
const router = express.Router()
const vinculacionController = require('../controllers/vinculacionController')

router.post('/', vinculacionController.create)


router.get('/', vinculacionController.getAll)
router.get('/:id', vinculacionController.getById)
router.get('/documento/:numero_documento', vinculacionController.getByDocumento)


module.exports = router