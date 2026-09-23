
const User = require('../models/userModel')
const bcrypt = require('bcrypt');

exports.create = async (req, res) => {
    try {
        const { nombre, usuario, contraseña, rol, activo } = req.body

        if (!nombre || !usuario || !contraseña) {
            return res.status(400).json({
                success: false,
                message: 'Datos  son requeridos'
            });

        }

        const saltRounds = 10;
        const contraseñaHasheada = await bcrypt.hash(contraseña, saltRounds);

        const nuevoUsuario = await User.create({
            nombre,
            usuario,
            contraseña: contraseñaHasheada,
            rol: rol || 'usuario',
            activo: activo !== undefined ? activo : 1
        });

        const { contraseña: _, ...usuarioSinContraseña } = nuevoUsuario;

        res.status(201).json({
            success: true,
            data: usuarioSinContraseña,
            message: 'usuario creado exitosamente'
        })

    } catch (error) {
        console.error('Error en create Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al guardar los datos',
            error: error.message
        });
    }

};

exports.getByID = async (req, res) => {
    try {
        const { id } = req.params;

        const buscarUsuario = await User.getById(id)

        if (!buscarUsuario) {
            return res.status(400).json({
                success: false,
                message: 'ID es requerido'
            });
        }

        res.status(200).json({
            success: true,

            data: buscarUsuario,

        });


    } catch (error) {
        console.error('Error en create Vinculacion:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al guardar los datos',
            error: error.message
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        const { rol, activo, search } = req.query;

        const filters = {};
        if (rol) filters.rol = rol;
        if (activo !== undefined) filters.activo = parseInt(activo);
        if (search) filters.search = search;

        const usuarios = await User.getAll(filters);

        //Remover contraseñas de la respuesta
        const usuariosSinContraseña = usuarios.map(({ contraseña, ...resto }) => resto);

        res.status(200).json({
            success: true,
            data: usuariosSinContraseña,
            total: usuariosSinContraseña.length,
            filters
        });

    } catch (error) {
        console.error('Error en getAll Users:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al obtener los usuarios',
            error: error.message
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { contraseñaActual, nuevaContraseña } = req.body;

        //  Validar
        if (!contraseñaActual || !nuevaContraseña) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva contraseña son requeridas'
            });
        }

        //  Obtener usuario con contraseña
        const usuario = await User.getById(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //  Verificar contraseña actual
        const contraseñaValida = await bcrypt.compare(contraseñaActual, usuario.contraseña);
        if (!contraseñaValida) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        //  Hashear nueva contraseña
        const saltRounds = 10;
        const nuevaContraseñaHasheada = await bcrypt.hash(nuevaContraseña, saltRounds);

        const actualizado = await User.updatePassword(id, nuevaContraseñaHasheada);

        if (!actualizado) {
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar la contraseña'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error en changePassword User:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al cambiar la contraseña',
            error: error.message
        });
    }
};

exports.getEstadisticas = async (req, res) => {
    try {

        const estadisticas = await User.getEstadisticas()

        res.json({
            success: true,
            data: {
                total: estadisticas.total || 0,
                activos: estadisticas.activos || 0,
                inactivos: estadisticas.inactivos || 0,
            }
        })


    } catch (error) {
        console.error("Error en getEstadisticas", error)
        res.status(500).json({
            success: false,
            message: error.message || 'Error al getEstadisticas',
            error: error.message
        })
    }
};
