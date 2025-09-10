const SpaceUsage = require('../models/spaceUsage');
const User = require('../models/user');
const mongoose = require('mongoose');

// @desc    Crear nueva reserva de espacio
// @route   POST /api/spaces/reserve
// @access  Private
const createReservation = async (req, res) => {
    try {
        const {
            espacioNombre,
            fechaInicio,
            fechaFin,
            proposito,
            numeroPersonas,
            observaciones
        } = req.body;

        // Validaciones básicas
        if (!espacioNombre || !fechaInicio || !fechaFin || !proposito) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos: espacioNombre, fechaInicio, fechaFin, proposito'
            });
        }

        const startDate = new Date(fechaInicio);
        const endDate = new Date(fechaFin);

        // Validar fechas
        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de fin debe ser posterior a la fecha de inicio'
            });
        }

        if (startDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'No se pueden hacer reservas en fechas pasadas'
            });
        }

        // Obtener información del usuario y persona
        const user = await User.findById(req.user.id).populate('personRef');
        if (!user || !user.personRef) {
            return res.status(400).json({
                success: false,
                message: 'Usuario no tiene persona asociada'
            });
        }

        // Verificar conflictos de horario
        const hasConflict = await SpaceUsage.checkTimeConflict(
            espacioNombre,
            startDate,
            endDate
        );

        if (hasConflict) {
            return res.status(400).json({
                success: false,
                message: 'El espacio ya está reservado en ese horario',
                data: {
                    espacio: espacioNombre,
                    fechaConflicto: {
                        inicio: fechaInicio,
                        fin: fechaFin
                    }
                }
            });
        }

        // Crear la reserva
        const reservation = await SpaceUsage.create({
            espacioNombre,
            usuarioId: req.user.id,
            fechaInicio: startDate,
            fechaFin: endDate,
            proposito,
            numeroPersonas: numeroPersonas || 1,
            observaciones
        });

        // Poblar datos del usuario y persona
        await reservation.populate({
            path: 'usuarioId',
            populate: {
                path: 'personRef',
                select: 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona grado grupo'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Reserva creada exitosamente',
            data: {
                id: reservation._id,
                espacio: reservation.espacioNombre,
                solicitante: reservation.usuarioId.personRef.getNombreCompleto(),
                fechaInicio: reservation.fechaInicio,
                fechaFin: reservation.fechaFin,
                proposito: reservation.proposito,
                estado: reservation.estado
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear reserva',
            error: error.message
        });
    }
};

// @desc    Obtener reservas del usuario actual
// @route   GET /api/spaces/my-reservations
// @access  Private
const getMyReservations = async (req, res) => {
    try {
        const { estado, fechaInicio, fechaFin } = req.query;

        let filters = { usuarioId: req.user.id };

        if (estado) {
            filters.estado = estado;
        }

        if (fechaInicio || fechaFin) {
            filters.fechaInicio = {};
            if (fechaInicio) {
                filters.fechaInicio.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
                filters.fechaInicio.$lte = endDate;
            }
        }

        const reservations = await SpaceUsage.find(filters)
            .populate({
                path: 'usuarioId',
                populate: {
                    path: 'personRef',
                    select: 'doc apellido1 apellido2 nombre1 nombre2'
                }
            })
            .sort({ fechaInicio: -1 });

        const processedReservations = reservations.map(reservation => ({
            id: reservation._id,
            espacio: reservation.espacioNombre,
            fechaInicio: reservation.fechaInicio,
            fechaFin: reservation.fechaFin,
            proposito: reservation.proposito,
            numeroPersonas: reservation.numeroPersonas,
            estado: reservation.estado,
            observaciones: reservation.observaciones,
            fechaCreacion: reservation.fechaCreacion
        }));

        res.status(200).json({
            success: true,
            data: processedReservations,
            count: processedReservations.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener mis reservas',
            error: error.message
        });
    }
};

// @desc    Obtener todas las reservas (Admin)
// @route   GET /api/spaces/reservations
// @access  Private (Admin/SuperAdmin)
const getAllReservations = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            espacio, 
            estado, 
            fechaInicio, 
            fechaFin,
            usuarioId 
        } = req.query;

        let filters = {};

        if (espacio) {
            filters.espacioNombre = { $regex: espacio, $options: 'i' };
        }

        if (estado) {
            filters.estado = estado;
        }

        if (usuarioId) {
            filters.usuarioId = usuarioId;
        }

        if (fechaInicio || fechaFin) {
            filters.fechaInicio = {};
            if (fechaInicio) {
                filters.fechaInicio.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
                filters.fechaInicio.$lte = endDate;
            }
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { fechaInicio: -1 }
        };

        const reservations = await SpaceUsage.find(filters)
            .populate({
                path: 'usuarioId',
                populate: {
                    path: 'personRef',
                    select: 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona grado grupo'
                }
            })
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit)
            .sort(options.sort);

        const total = await SpaceUsage.countDocuments(filters);

        const processedReservations = reservations.map(reservation => ({
            id: reservation._id,
            espacio: reservation.espacioNombre,
            solicitante: {
                id: reservation.usuarioId._id,
                nombre: reservation.usuarioId.personRef.getNombreCompleto(),
                doc: reservation.usuarioId.personRef.doc,
                tipo: reservation.usuarioId.personRef.tipoPersona,
                rol: reservation.usuarioId.role
            },
            fechaInicio: reservation.fechaInicio,
            fechaFin: reservation.fechaFin,
            proposito: reservation.proposito,
            numeroPersonas: reservation.numeroPersonas,
            estado: reservation.estado,
            observaciones: reservation.observaciones,
            fechaCreacion: reservation.fechaCreacion,
            fechaAprobacion: reservation.fechaAprobacion
        }));

        res.status(200).json({
            success: true,
            data: processedReservations,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                pages: Math.ceil(total / options.limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservas',
            error: error.message
        });
    }
};

// @desc    Aprobar/Rechazar reserva
// @route   PUT /api/spaces/reservations/:id/status
// @access  Private (Admin/SuperAdmin)
const updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, observacionesAdmin } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de reserva inválido'
            });
        }

        const validStates = ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada', 'Completada'];
        if (!validStates.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const reservation = await SpaceUsage.findById(id)
            .populate({
                path: 'usuarioId',
                populate: {
                    path: 'personRef',
                    select: 'apellido1 apellido2 nombre1 nombre2'
                }
            });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        // Solo se puede cambiar estado de reservas pendientes (excepto para cancelar)
        if (reservation.estado !== 'Pendiente' && estado !== 'Cancelada') {
            return res.status(400).json({
                success: false,
                message: `No se puede cambiar el estado de una reserva ${reservation.estado.toLowerCase()}`
            });
        }

        // Si se aprueba, verificar nuevamente conflictos
        if (estado === 'Aprobada') {
            const hasConflict = await SpaceUsage.checkTimeConflict(
                reservation.espacioNombre,
                reservation.fechaInicio,
                reservation.fechaFin,
                reservation._id // Excluir esta reserva de la verificación
            );

            if (hasConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede aprobar: conflicto de horario con otra reserva aprobada'
                });
            }
        }

        reservation.estado = estado;
        reservation.observacionesAdmin = observacionesAdmin;

        if (estado === 'Aprobada') {
            reservation.fechaAprobacion = new Date();
        }

        await reservation.save();

        res.status(200).json({
            success: true,
            message: `Reserva ${estado.toLowerCase()} exitosamente`,
            data: {
                id: reservation._id,
                espacio: reservation.espacioNombre,
                solicitante: reservation.usuarioId.personRef.getNombreCompleto(),
                estado: reservation.estado,
                fechaAprobacion: reservation.fechaAprobacion
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de reserva',
            error: error.message
        });
    }
};

// @desc    Cancelar reserva propia
// @route   DELETE /api/spaces/reservations/:id
// @access  Private
const cancelMyReservation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de reserva inválido'
            });
        }

        const reservation = await SpaceUsage.findById(id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        // Verificar que la reserva pertenece al usuario
        if (reservation.usuarioId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cancelar esta reserva'
            });
        }

        // Solo se pueden cancelar reservas pendientes o aprobadas
        if (!['Pendiente', 'Aprobada'].includes(reservation.estado)) {
            return res.status(400).json({
                success: false,
                message: `No se puede cancelar una reserva ${reservation.estado.toLowerCase()}`
            });
        }

        reservation.estado = 'Cancelada';
        await reservation.save();

        res.status(200).json({
            success: true,
            message: 'Reserva cancelada exitosamente',
            data: {
                id: reservation._id,
                espacio: reservation.espacioNombre,
                estado: reservation.estado
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cancelar reserva',
            error: error.message
        });
    }
};

// @desc    Obtener disponibilidad de espacios
// @route   GET /api/spaces/availability
// @access  Private
const getSpaceAvailability = async (req, res) => {
    try {
        const { espacio, fecha, duracionHoras = 1 } = req.query;

        if (!espacio || !fecha) {
            return res.status(400).json({
                success: false,
                message: 'Espacio y fecha son requeridos'
            });
        }

        const targetDate = new Date(fecha);
        const endDate = new Date(targetDate.getTime() + (parseInt(duracionHoras) * 60 * 60 * 1000));

        // Buscar reservas aprobadas que conflicten
        const conflicts = await SpaceUsage.find({
            espacioNombre: { $regex: espacio, $options: 'i' },
            estado: 'Aprobada',
            $or: [
                {
                    fechaInicio: { $lt: endDate },
                    fechaFin: { $gt: targetDate }
                }
            ]
        }).select('fechaInicio fechaFin proposito');

        const isAvailable = conflicts.length === 0;

        res.status(200).json({
            success: true,
            data: {
                espacio,
                fecha: targetDate,
                duracion: `${duracionHoras} hora(s)`,
                disponible: isAvailable,
                conflictos: conflicts.map(conflict => ({
                    inicio: conflict.fechaInicio,
                    fin: conflict.fechaFin,
                    proposito: conflict.proposito
                }))
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al verificar disponibilidad',
            error: error.message
        });
    }
};

// @desc    Obtener estadísticas de uso de espacios
// @route   GET /api/spaces/stats
// @access  Private (Admin/SuperAdmin)
const getSpaceUsageStats = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        let dateFilter = {};
        if (fechaInicio || fechaFin) {
            dateFilter.fechaInicio = {};
            if (fechaInicio) {
                dateFilter.fechaInicio.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.fechaInicio.$lte = endDate;
            }
        }

        // Estadísticas por espacio
        const espacioStats = await SpaceUsage.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$espacioNombre',
                    totalReservas: { $sum: 1 },
                    aprobadas: {
                        $sum: { $cond: [{ $eq: ['$estado', 'Aprobada'] }, 1, 0] }
                    },
                    completadas: {
                        $sum: { $cond: [{ $eq: ['$estado', 'Completada'] }, 1, 0] }
                    },
                    canceladas: {
                        $sum: { $cond: [{ $eq: ['$estado', 'Cancelada'] }, 1, 0] }
                    }
                }
            },
            { $sort: { totalReservas: -1 } }
        ]);

        // Estadísticas por estado
        const estadoStats = await SpaceUsage.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$estado',
                    total: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Propósitos más comunes
        const propositoStats = await SpaceUsage.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$proposito',
                    total: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                porEspacio: espacioStats.map(stat => ({
                    espacio: stat._id,
                    totalReservas: stat.totalReservas,
                    aprobadas: stat.aprobadas,
                    completadas: stat.completadas,
                    canceladas: stat.canceladas
                })),
                porEstado: estadoStats.map(stat => ({
                    estado: stat._id,
                    cantidad: stat.total
                })),
                propositosComunes: propositoStats.map(stat => ({
                    proposito: stat._id,
                    cantidad: stat.total
                }))
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de espacios',
            error: error.message
        });
    }
};

module.exports = {
    createReservation,
    getMyReservations,
    getAllReservations,
    updateReservationStatus,
    cancelMyReservation,
    getSpaceAvailability,
    getSpaceUsageStats
};
