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
            person: personId,
            checkOutTime: null
        });

        if (activeAttendance) {
            return res.status(400).json({
                success: false,
                message: 'La persona ya tiene una entrada activa sin salida registrada',
                data: {
                    activeEntry: {
                        fecha: activeAttendance.checkInTime,
                        notes: activeAttendance.notes
                    }
                }
            });
        }

        // Crear nueva entrada
        const attendance = await Attendance.create({
            person: personId,
            notes: observaciones,
            registeredBy: req.user.id
        });

        // Poblar datos de la persona
        await attendance.populate('person', 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona grado grupo');

        res.status(201).json({
            success: true,
            message: 'Entrada registrada exitosamente',
            data: {
                id: attendance._id,
                persona: attendance.person.getNombreCompleto(),
                checkInTime: attendance.checkInTime,
                notes: attendance.notes
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
                person: personId,
                checkOutTime: null
            }).sort({ checkInTime: -1 });

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

        if (attendance.checkOutTime) {
            return res.status(400).json({
                success: false,
                message: 'Esta entrada ya tiene salida registrada'
            });
        }

        // Marcar salida
        attendance = await attendance.markCheckOut(req.user.id, observacionesSalida);
        await attendance.populate('person', 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona');

        const stayDuration = attendance.getStayDuration();

        res.status(200).json({
            success: true,
            message: 'Salida registrada exitosamente',
            data: {
                id: attendance._id,
                persona: attendance.person.getNombreCompleto(),
                checkInTime: attendance.checkInTime,
                checkOutTime: attendance.checkOutTime,
                stayDuration: stayDuration,
                notes: attendance.notes
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
            checkInTime: {
                $gte: today,
                $lt: tomorrow
            }
        };

        if (activeOnly === 'true') {
            filters.checkOutTime = null;
        }

        const attendances = await Attendance.find(filters)
            .populate('person', 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona grado grupo')
            .sort({ checkInTime: -1 });

        const processedAttendances = attendances.map(attendance => ({
            id: attendance._id,
            persona: {
                id: attendance.person._id,
                nombre: attendance.person.getNombreCompleto(),
                doc: attendance.person.doc,
                tipo: attendance.person.tipoPersona,
                grado: attendance.person.grado,
                grupo: attendance.person.grupo
            },
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            notes: attendance.notes,
            stayDuration: attendance.checkOutTime ? attendance.getStayDuration() : null,
            estado: attendance.checkOutTime ? 'Finalizada' : 'Activa'
        }));

        res.status(200).json({
            success: true,
            data: processedAttendances,
            stats: {
                total: attendances.length,
                activas: attendances.filter(a => !a.checkOutTime).length,
                finalizadas: attendances.filter(a => a.checkOutTime).length
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
            filters.person = personId;
        }

        if (fechaInicio || fechaFin) {
            filters.checkInTime = {};
            if (fechaInicio) {
                filters.checkInTime.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
                filters.checkInTime.$lte = endDate;
            }
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { checkInTime: -1 }
        };

        let query = Attendance.find(filters)
            .populate('person', 'doc apellido1 apellido2 nombre1 nombre2 tipoPersona grado grupo')
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit)
            .sort(options.sort);

        const attendances = await query;

        // Filtrar por tipo de persona si se especifica
        let filteredAttendances = attendances;
        if (tipoPersona) {
            filteredAttendances = attendances.filter(a => 
                a.person && a.person.tipoPersona === tipoPersona
            );
        }

        const total = await Attendance.countDocuments(filters);

        const processedAttendances = filteredAttendances.map(attendance => ({
            id: attendance._id,
            persona: {
                id: attendance.person._id,
                nombre: attendance.person.getNombreCompleto(),
                doc: attendance.person.doc,
                tipo: attendance.person.tipoPersona,
                grado: attendance.person.grado,
                grupo: attendance.person.grupo
            },
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            notes: attendance.notes,
            stayDuration: attendance.checkOutTime ? attendance.getStayDuration() : null
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
            dateFilter.checkInTime = {};
            if (fechaInicio) {
                dateFilter.checkInTime.$gte = new Date(fechaInicio);
            }
            if (fechaFin) {
                const endDate = new Date(fechaFin);
                endDate.setHours(23, 59, 59, 999);
                dateFilter.checkInTime.$lte = endDate;
            }
        }

        // Estadísticas básicas
        const totalVisitas = await Attendance.countDocuments(dateFilter);
        const visitasActivas = await Attendance.countDocuments({
            ...dateFilter,
            checkOutTime: null
        });

        // Eliminado: visitasPorTipo ya que no hay campo tipoVisita en el nuevo modelo

        // Estadísticas por tipo de persona (requiere populate)
        const visitasPorTipoPersona = await Attendance.aggregate([
            { $match: dateFilter },
            {
                $lookup: {
                    from: 'people',
                    localField: 'person',
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
                    checkOutTime: { $ne: null }
                }
            },
            {
                $addFields: {
                    tiempoEstancia: {
                        $subtract: ['$checkOutTime', '$checkInTime']
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
                id: attendance.person._id,
                nombre: attendance.person.getNombreCompleto(),
                doc: attendance.person.doc,
                tipo: attendance.person.tipoPersona,
                grado: attendance.person.grado,
                grupo: attendance.person.grupo
            },
            checkInTime: attendance.checkInTime,
            notes: attendance.notes,
            tiempoTranscurrido: Math.round((Date.now() - attendance.checkInTime.getTime()) / (1000 * 60)) // minutos
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

// @desc    Obtener estudiantes de un grupo
// @route   GET /api/attendance/group/:grado/:grupo
// @access  Private
const getStudentsByGroup = async (req, res) => {
    try {
        const { grado, grupo } = req.params;
        const { date } = req.query;
        
        console.log('\n========== GET STUDENTS BY GROUP ==========');
        console.log('📅 Fecha solicitada:', date);
        console.log('🏫 Grado:', grado, 'Grupo:', grupo);
        
        // Obtener estudiantes del grupo
        const students = await Person.find({
            tipoPersona: 'Estudiante',
            grado: grado,
            grupo: grupo,
            estado: 'Activo',
            isActive: true
        }).sort({ apellido1: 1, nombre1: 1 });
        
        console.log('👥 Total estudiantes encontrados:', students.length);
        console.log('👥 IDs de estudiantes:', students.map(s => s._id.toString()).slice(0, 5));
        
        // Si se proporciona fecha, obtener asistencias de ese día
        let attendances = [];
        if (date) {
            // Parsear la fecha en zona horaria de Colombia (GMT-5)
            const [year, month, day] = date.split('-').map(Number);
            const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
            const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
            
            console.log('📅 Rango de búsqueda (hora local Colombia):');
            console.log('   Inicio:', startOfDay);
            console.log('   Fin:', endOfDay);
            console.log('   Inicio UTC:', startOfDay.toISOString());
            console.log('   Fin UTC:', endOfDay.toISOString());
            
            attendances = await Attendance.find({
                checkInTime: { $gte: startOfDay, $lte: endOfDay },
                person: { $in: students.map(s => s._id) }
            }).populate('person');
            
            console.log('✅ Total asistencias encontradas:', attendances.length);
            if (attendances.length > 0) {
                console.log('✅ Detalles de asistencias encontradas:');
                attendances.forEach((att, idx) => {
                    console.log(`   ${idx + 1}. Persona ID: ${att.person._id}`);
                    console.log(`      Nombre: ${att.person.getNombreCompleto()}`);
                    console.log(`      CheckIn: ${att.checkInTime}`);
                    console.log(`      CheckOut: ${att.checkOutTime || 'NO'}`);
                });
            } else {
                console.log('❌ NO SE ENCONTRARON ASISTENCIAS para estos estudiantes en esta fecha');
            }
        }
        
        // Mapear estudiantes con estado de asistencia
        const studentsWithAttendance = students.map(student => {
            const attendance = attendances.find(a => 
                a.person && a.person._id.toString() === student._id.toString()
            );
            
            const result = {
                _id: student._id,
                name: student.getNombreCompleto(),
                idNumber: student.doc,
                grado: student.grado,
                grupo: student.grupo,
                attendance: attendance ? {
                    _id: attendance._id,
                    checkInTime: attendance.checkInTime,
                    checkOutTime: attendance.checkOutTime,
                    hasCheckedIn: true,
                    hasCheckedOut: !!attendance.checkOutTime
                } : {
                    hasCheckedIn: false,
                    hasCheckedOut: false
                }
            };
            
            return result;
        });
        
        const conAsistencia = studentsWithAttendance.filter(s => s.attendance.hasCheckedIn);
        console.log('\n📊 RESUMEN FINAL:');
        console.log('   Total estudiantes:', studentsWithAttendance.length);
        console.log('   Con asistencia:', conAsistencia.length);
        console.log('   Sin asistencia:', studentsWithAttendance.length - conAsistencia.length);
        if (conAsistencia.length > 0) {
            console.log('\n👉 Estudiantes CON asistencia que se envían al frontend:');
            conAsistencia.forEach(s => {
                console.log(`   - ${s.name} (${s.idNumber}) - CheckIn: ${s.attendance.checkInTime}`);
            });
        }
        console.log('========================================\n');
        
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.status(200).json({
            success: true,
            data: studentsWithAttendance,
            total: studentsWithAttendance.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estudiantes del grupo',
            error: error.message
        });
    }
};

// @desc    Marcar asistencia masiva para un grupo
// @route   POST /api/attendance/bulk-checkin
// @access  Private
const bulkCheckIn = async (req, res) => {
    try {
        const { personIds, notes } = req.body;
        
        console.log('\n========== BULK CHECK-IN ==========');
        console.log('📝 Intentando marcar asistencia a:', personIds.length, 'estudiantes');
        console.log('📝 IDs recibidos:', personIds);
        
        if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de IDs de personas'
            });
        }
        
        const results = {
            success: [],
            failed: [],
            skipped: []
        };
        
        for (const personId of personIds) {
            try {
                // Verificar si ya tiene entrada activa
                const existingAttendance = await Attendance.findOne({
                    person: personId,
                    checkOutTime: null
                });
                
                if (existingAttendance) {
                    results.skipped.push({
                        personId,
                        reason: 'Ya tiene entrada activa'
                    });
                    continue;
                }
                
                // Verificar que la persona existe
                const personExists = await Person.findById(personId);
                if (!personExists) {
                    results.failed.push({
                        personId,
                        error: 'Persona no encontrada'
                    });
                    continue;
                }
                
                // Crear asistencia
                const attendance = await Attendance.create({
                    person: personId,
                    notes: notes || '',
                    registeredBy: req.user.id
                });
                
                console.log(`✅ Asistencia creada para ${personExists.getNombreCompleto()}:`);
                console.log(`   ID Attendance: ${attendance._id}`);
                console.log(`   Person ID: ${personId}`);
                console.log(`   CheckInTime: ${attendance.checkInTime}`);
                console.log(`   CheckOutTime: ${attendance.checkOutTime}`);
                
                results.success.push({
                    personId,
                    attendanceId: attendance._id,
                    checkInTime: attendance.checkInTime
                });
                
            } catch (error) {
                results.failed.push({
                    personId,
                    error: error.message
                });
            }
        }
        
        console.log('\n🎯 RESULTADO FINAL:');
        console.log(`   ✅ Exitosas: ${results.success.length}`);
        console.log(`   ⚠️ Omitidas: ${results.skipped.length}`);
        console.log(`   ❌ Fallidas: ${results.failed.length}`);
        console.log('===================================\n');
        
        res.status(201).json({
            success: true,
            message: `Asistencia registrada: ${results.success.length} exitosas, ${results.skipped.length} omitidas, ${results.failed.length} fallidas`,
            data: results
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al registrar asistencia masiva',
            error: error.message
        });
    }
};

// @desc    Marcar salida masiva
// @route   POST /api/attendance/bulk-checkout
// @access  Private
const bulkCheckOut = async (req, res) => {
    try {
        const { personIds, notes } = req.body;
        
        if (!personIds || !Array.isArray(personIds) || personIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de IDs de personas'
            });
        }
        
        const results = {
            success: [],
            failed: [],
            notFound: []
        };
        
        for (const personId of personIds) {
            try {
                // Buscar entrada activa
                const attendance = await Attendance.findOne({
                    person: personId,
                    checkOutTime: null
                });
                
                if (!attendance) {
                    results.notFound.push({
                        personId,
                        reason: 'No tiene entrada activa'
                    });
                    continue;
                }
                
                // Marcar salida
                attendance.checkOutTime = new Date();
                attendance.checkOutRegisteredBy = req.user.id;
                if (notes) {
                    attendance.notes = attendance.notes ? `${attendance.notes}. Salida: ${notes}` : `Salida: ${notes}`;
                }
                await attendance.save();
                
                results.success.push({
                    personId,
                    attendanceId: attendance._id,
                    checkOutTime: attendance.checkOutTime
                });
                
            } catch (error) {
                results.failed.push({
                    personId,
                    error: error.message
                });
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Salida registrada: ${results.success.length} exitosas, ${results.notFound.length} sin entrada, ${results.failed.length} fallidas`,
            data: results
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al registrar salida masiva',
            error: error.message
        });
    }
};

// @desc    Obtener todos los estudiantes presentes de un grado (todos los grupos)
// @route   GET /api/attendance/present-by-grade/:grado
// @access  Private
const getPresentByGrade = async (req, res) => {
    try {
        const { grado } = req.params;
        const { date } = req.query;
        
        // Obtener estudiantes del grado completo
        const students = await Person.find({
            tipoPersona: 'Estudiante',
            grado: grado,
            estado: 'Activo',
            isActive: true
        }).sort({ grupo: 1, apellido1: 1, nombre1: 1 });
        
        // Obtener asistencias activas (sin salida) de ese grado
        let attendances = [];
        if (date) {
            // Parsear la fecha en zona horaria de Colombia (GMT-5)
            const [year, month, day] = date.split('-').map(Number);
            const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
            const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
            
            attendances = await Attendance.find({
                checkInTime: { $gte: startOfDay, $lte: endOfDay },
                checkOutTime: null, // Solo los que NO han salido
                person: { $in: students.map(s => s._id) }
            }).populate('person');
        } else {
            // Si no hay fecha, obtener asistencias activas de hoy (hora local)
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            
            attendances = await Attendance.find({
                checkInTime: { $gte: startOfToday, $lte: endOfToday },
                checkOutTime: null,
                person: { $in: students.map(s => s._id) }
            }).populate('person');
        }
        
        // Filtrar solo estudiantes que tienen asistencia activa
        const presentStudents = students
            .map(student => {
                const attendance = attendances.find(a => 
                    a.person && a.person._id.toString() === student._id.toString()
                );
                
                if (!attendance) return null;
                
                return {
                    _id: student._id,
                    name: student.getNombreCompleto(),
                    idNumber: student.doc,
                    grado: student.grado,
                    grupo: student.grupo,
                    attendance: {
                        _id: attendance._id,
                        checkInTime: attendance.checkInTime,
                        checkOutTime: attendance.checkOutTime,
                        hasCheckedIn: true,
                        hasCheckedOut: false
                    }
                };
            })
            .filter(s => s !== null);
        
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.status(200).json({
            success: true,
            data: presentStudents,
            total: presentStudents.length
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estudiantes presentes del grado',
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
    getActiveAttendances,
    getStudentsByGroup,
    getPresentByGrade,
    bulkCheckIn,
    bulkCheckOut
};
