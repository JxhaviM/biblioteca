const Attendance = require('../models/attendance');
const Person = require('../models/person');
const User = require('../models/user');
const mongoose = require('mongoose');

// @desc    Marcar entrada a la biblioteca
// @route   POST /api/attendance/checkin
// @access  Private
const checkIn = async (req, res) => {
    try {
        const { personId, tipoVisita = 'Consulta', observaciones } = req.body;

        if (!personId) {
            return res.status(400).json({
                success: false,
                message: 'ID de persona requerido'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(personId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de persona inválido'
            });
        }

        // Verificar que la persona existe y está activa
        const person = await Person.findById(personId);
        if (!person) {
            return res.status(404).json({
                success: false,
                message: 'Persona no encontrada'
            });
        }

        if (person.estado !== 'Activo') {
            return res.status(400).json({
                success: false,
                message: `No se puede marcar entrada. Estado de la persona: ${person.estado}`
            });
        }

        // Verificar si ya tiene una entrada activa (sin salida)
        const activeAttendance = await Attendance.findOne({
            personId: personId,
            fechaSalida: null
        });

        if (activeAttendance) {
            return res.status(400).json({
                success: false,
                message: 'La persona ya tiene una entrada activa sin salida registrada',
                data: {
                    activeEntry: {
                        fecha: activeAttendance.fechaEntrada,
                        tipoVisita: activeAttendance.tipoVisita
                    }
                }
            });
        }

        // Crear nueva entrada
        const attendance = await Attendance.create({
            personId,
            tipoVisita,
            observaciones,
            registradoPor: req.user.id
        });

        // Poblar datos de la persona
        await attendance.populate('personId', 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona grado grupo');

        res.status(201).json({
            success: true,
            message: 'Entrada registrada exitosamente',
            data: {
                id: attendance._id,
                persona: attendance.personId.getNombreCompleto(),
                fechaEntrada: attendance.fechaEntrada,
                tipoVisita: attendance.tipoVisita
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al registrar entrada',
            error: error.message
        });
    }
};

// @desc    Marcar salida de la biblioteca
// @route   POST /api/attendance/checkout
// @access  Private
const checkOut = async (req, res) => {
    try {
        const { personId, attendanceId, observacionesSalida } = req.body;

        let attendance;

        if (attendanceId) {
            // Buscar por ID específico de attendance
            attendance = await Attendance.findById(attendanceId);
            if (!attendance) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro de asistencia no encontrado'
                });
            }
        } else if (personId) {
            // Buscar la entrada activa más reciente de la persona
            attendance = await Attendance.findOne({
                personId: personId,
                fechaSalida: null
            }).sort({ fechaEntrada: -1 });

            if (!attendance) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró una entrada activa para esta persona'
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Se requiere personId o attendanceId'
            });
        }

        if (attendance.fechaSalida) {
            return res.status(400).json({
                success: false,
                message: 'Esta entrada ya tiene salida registrada'
            });
        }

        // Marcar salida
        attendance = await attendance.markCheckOut(req.user.id, observacionesSalida);
        await attendance.populate('personId', 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona');

        const stayDuration = attendance.getStayDuration();

        res.status(200).json({
            success: true,
            message: 'Salida registrada exitosamente',
            data: {
                id: attendance._id,
                persona: attendance.personId.getNombreCompleto(),
                fechaEntrada: attendance.fechaEntrada,
                fechaSalida: attendance.fechaSalida,
                tiempoEstancia: stayDuration,
                tipoVisita: attendance.tipoVisita
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al registrar salida',
            error: error.message
        });
    }
};

// @desc    Obtener asistencias del día
// @route   GET /api/attendance/today
// @access  Private
const getTodayAttendances = async (req, res) => {
    try {
        const { activeOnly = false } = req.query;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let filters = {
            fechaEntrada: {
                $gte: today,
                $lt: tomorrow
            }
        };

        if (activeOnly === 'true') {
            filters.fechaSalida = null;
        }

        const attendances = await Attendance.find(filters)
            .populate('personId', 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona grado grupo')
            .sort({ fechaEntrada: -1 });

        const processedAttendances = attendances.map(attendance => ({
            id: attendance._id,
            persona: {
                id: attendance.personId._id,
                nombre: attendance.personId.getNombreCompleto(),
                doc: attendance.personId.doc,
                tipo: attendance.personId.tipoPersona,
                grado: attendance.personId.grado,
                grupo: attendance.personId.grupo
            },
            fechaEntrada: attendance.fechaEntrada,
            fechaSalida: attendance.fechaSalida,
            tipoVisita: attendance.tipoVisita,
            tiempoEstancia: attendance.fechaSalida ? attendance.getStayDuration() : null,
            estado: attendance.fechaSalida ? 'Finalizada' : 'Activa'
        }));

        res.status(200).json({
            success: true,
            data: processedAttendances,
            stats: {
                total: attendances.length,
                activas: attendances.filter(a => !a.fechaSalida).length,
                finalizadas: attendances.filter(a => a.fechaSalida).length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener asistencias del día',
            error: error.message
        });
    }
};

// @desc    Obtener historial de asistencias
// @route   GET /api/attendance/history
// @access  Private (Admin/SuperAdmin)
const getAttendanceHistory = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            personId, 
            tipoVisita,
            fechaInicio, 
            fechaFin,
            tipoPersona 
        } = req.query;

        let filters = {};

        if (personId) {
            filters.personId = personId;
        }

        if (tipoVisita) {
            filters.tipoVisita = tipoVisita;
        }

        if (fechaInicio || fechaFin) {
            filters.fechaEntrada = {};
            if (fechaInicio) {
                filters.fechaEntrada.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
                filters.fechaEntrada.$lte = endDate;
            }
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { fechaEntrada: -1 }
        };

        let query = Attendance.find(filters)
            .populate('personId', 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona grado grupo')
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit)
            .sort(options.sort);

        const attendances = await query;

        // Filtrar por tipo de persona si se especifica
        let filteredAttendances = attendances;
        if (tipoPersona) {
            filteredAttendances = attendances.filter(a => 
                a.personId && a.personId.tipoPersona === tipoPersona
            );
        }

        const total = await Attendance.countDocuments(filters);

        const processedAttendances = filteredAttendances.map(attendance => ({
            id: attendance._id,
            persona: {
                id: attendance.personId._id,
                nombre: attendance.personId.getNombreCompleto(),
                doc: attendance.personId.doc,
                tipo: attendance.personId.tipoPersona,
                grado: attendance.personId.grado,
                grupo: attendance.personId.grupo
            },
            fechaEntrada: attendance.fechaEntrada,
            fechaSalida: attendance.fechaSalida,
            tipoVisita: attendance.tipoVisita,
            tiempoEstancia: attendance.fechaSalida ? attendance.getStayDuration() : null,
            observaciones: attendance.observaciones,
            observacionesSalida: attendance.observacionesSalida
        }));

        res.status(200).json({
            success: true,
            data: processedAttendances,
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
            message: 'Error al obtener historial de asistencias',
            error: error.message
        });
    }
};

// @desc    Obtener estadísticas de asistencia
// @route   GET /api/attendance/stats
// @access  Private (Admin/SuperAdmin)
const getAttendanceStats = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        let dateFilter = {};
        if (fechaInicio || fechaFin) {
            dateFilter.fechaEntrada = {};
            if (fechaInicio) {
                dateFilter.fechaEntrada.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.fechaEntrada.$lte = endDate;
            }
        }

        // Estadísticas básicas
        const totalVisitas = await Attendance.countDocuments(dateFilter);
        const visitasActivas = await Attendance.countDocuments({
            ...dateFilter,
            fechaSalida: null
        });

        // Estadísticas por tipo de visita
        const visitasPorTipo = await Attendance.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: '$tipoVisita',
                    total: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Estadísticas por tipo de persona (requiere populate)
        const visitasPorTipoPersona = await Attendance.aggregate([
            { $match: dateFilter },
            {
                $lookup: {
                    from: 'persons',
                    localField: 'personId',
                    foreignField: '_id',
                    as: 'persona'
                }
            },
            { $unwind: '$persona' },
            {
                $group: {
                    _id: '$persona.tipoPersona',
                    total: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Tiempo promedio de estancia
        const tiempoPromedio = await Attendance.aggregate([
            { 
                $match: { 
                    ...dateFilter,
                    fechaSalida: { $ne: null }
                }
            },
            {
                $addFields: {
                    tiempoEstancia: {
                        $subtract: ['$fechaSalida', '$fechaEntrada']
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    tiempoPromedioMs: { $avg: '$tiempoEstancia' },
                    tiempoMinimoMs: { $min: '$tiempoEstancia' },
                    tiempoMaximoMs: { $max: '$tiempoEstancia' }
                }
            }
        ]);

        const promedio = tiempoPromedio[0] || {};

        res.status(200).json({
            success: true,
            data: {
                resumen: {
                    totalVisitas,
                    visitasActivas,
                    visitasFinalizadas: totalVisitas - visitasActivas
                },
                porTipoVisita: visitasPorTipo.map(item => ({
                    tipo: item._id,
                    cantidad: item.total
                })),
                porTipoPersona: visitasPorTipoPersona.map(item => ({
                    tipo: item._id,
                    cantidad: item.total
                })),
                tiemposEstancia: {
                    promedioMinutos: promedio.tiempoPromedioMs ? Math.round(promedio.tiempoPromedioMs / (1000 * 60)) : 0,
                    minimoMinutos: promedio.tiempoMinimoMs ? Math.round(promedio.tiempoMinimoMs / (1000 * 60)) : 0,
                    maximoMinutos: promedio.tiempoMaximoMs ? Math.round(promedio.tiempoMaximoMs / (1000 * 60)) : 0
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// @desc    Obtener entradas activas
// @route   GET /api/attendance/active
// @access  Private
const getActiveAttendances = async (req, res) => {
    try {
        const activeAttendances = await Attendance.findActiveAttendances();

        const processedAttendances = activeAttendances.map(attendance => ({
            id: attendance._id,
            persona: {
                id: attendance.personId._id,
                nombre: attendance.personId.getNombreCompleto(),
                doc: attendance.personId.doc,
                tipo: attendance.personId.tipoPersona,
                grado: attendance.personId.grado,
                grupo: attendance.personId.grupo
            },
            fechaEntrada: attendance.fechaEntrada,
            tipoVisita: attendance.tipoVisita,
            tiempoTranscurrido: Math.round((Date.now() - attendance.fechaEntrada.getTime()) / (1000 * 60)) // minutos
        }));

        res.status(200).json({
            success: true,
            data: processedAttendances,
            count: processedAttendances.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener entradas activas',
            error: error.message
        });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getTodayAttendances,
    getAttendanceHistory,
    getAttendanceStats,
    getActiveAttendances
};
