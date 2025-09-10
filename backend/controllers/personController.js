const Person = require('../models/person');
const User = require('../models/user');
const Loan = require('../models/loan');
const mongoose = require('mongoose');

// @desc    Obtener todas las personas con filtros
// @route   GET /api/persons
// @access  Private (Admin/SuperAdmin)
const getPersons = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            search, 
            tipoPersona, 
            estado, 
            grado, 
            grupo,
            tieneCuenta 
        } = req.query;

        // Construir filtros
        let filters = {};

        if (search) {
            filters.$or = [
                { nombre1: { $regex: search, $options: 'i' } },
                { nombre2: { $regex: search, $options: 'i' } },
                { apellido1: { $regex: search, $options: 'i' } },
                { apellido2: { $regex: search, $options: 'i' } },
                { doc: { $regex: search, $options: 'i' } }
            ];
        }

        if (tipoPersona) filters.tipoPersona = tipoPersona;
        if (estado) filters.estado = estado;
        if (grado) filters.grado = grado;
        if (grupo) filters.grupo = grupo;
        if (tieneCuenta !== undefined) filters.tieneCuenta = tieneCuenta === 'true';

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { apellido1: 1, nombre1: 1 }
        };

        const persons = await Person.find(filters)
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit)
            .sort(options.sort);

        const total = await Person.countDocuments(filters);

        res.status(200).json({
            success: true,
            data: persons.map(person => person.getDetailedInfo()),
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
            message: 'Error al obtener personas',
            error: error.message
        });
    }
};

// @desc    Obtener persona por ID
// @route   GET /api/persons/:id
// @access  Private
const getPersonById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de persona inválido'
            });
        }

        const person = await Person.findById(id);

        if (!person) {
            return res.status(404).json({
                success: false,
                message: 'Persona no encontrada'
            });
        }

        // Obtener información del usuario asociado si existe
        const user = await User.findOne({ personRef: id }).select('-password');

        res.status(200).json({
            success: true,
            data: {
                person: person.getDetailedInfo(),
                user: user ? user.getUserInfo() : null
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener persona',
            error: error.message
        });
    }
};

// @desc    Crear nueva persona
// @route   POST /api/persons
// @access  Private (Admin/SuperAdmin)
const createPerson = async (req, res) => {
    try {
        const personData = req.body;

        // Validaciones básicas
        const requiredFields = ['doc', 'tipoDoc', 'apellido1', 'nombre1', 'genero', 'tipoPersona'];
        for (const field of requiredFields) {
            if (!personData[field]) {
                return res.status(400).json({
                    success: false,
                    message: `El campo ${field} es requerido`
                });
            }
        }

        // Verificar si ya existe una persona con ese documento
        const existingPerson = await Person.findByDoc(personData.doc);
        if (existingPerson) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una persona con ese número de documento'
            });
        }

        const person = await Person.create(personData);

        res.status(201).json({
            success: true,
            message: 'Persona creada exitosamente',
            data: person.getDetailedInfo()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear persona',
            error: error.message
        });
    }
};

// @desc    Crear múltiples personas (carga masiva)
// @route   POST /api/persons/bulk
// @access  Private (Admin/SuperAdmin)
const createPersonsBulk = async (req, res) => {
    try {
        const { persons, tipoPersona } = req.body;

        if (!Array.isArray(persons) || persons.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de personas'
            });
        }

        if (!tipoPersona) {
            return res.status(400).json({
                success: false,
                message: 'El tipo de persona es requerido para carga masiva'
            });
        }

        const createdPersons = [];
        const errors = [];

        // Procesar cada persona
        for (let i = 0; i < persons.length; i++) {
            try {
                const personData = { ...persons[i], tipoPersona };

                // Verificar duplicados
                const existingPerson = await Person.findByDoc(personData.doc);
                if (existingPerson) {
                    errors.push({
                        index: i + 1,
                        data: personData,
                        error: 'Ya existe una persona con ese documento'
                    });
                    continue;
                }

                const person = await Person.create(personData);
                createdPersons.push(person.getBasicInfo());

            } catch (personError) {
                errors.push({
                    index: i + 1,
                    data: persons[i],
                    error: personError.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `${createdPersons.length} personas creadas exitosamente`,
            data: {
                createdPersons,
                totalCreated: createdPersons.length,
                totalErrors: errors.length,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en carga masiva de personas',
            error: error.message
        });
    }
};

// @desc    Actualizar persona
// @route   PUT /api/persons/:id
// @access  Private (Admin/SuperAdmin)
const updatePerson = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de persona inválido'
            });
        }

        // Verificar que la persona existe
        const person = await Person.findById(id);
        if (!person) {
            return res.status(404).json({
                success: false,
                message: 'Persona no encontrada'
            });
        }

        // Si se está cambiando el documento, verificar que no exista
        if (updateData.doc && updateData.doc !== person.doc) {
            const existingPerson = await Person.findByDoc(updateData.doc);
            if (existingPerson) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una persona con ese número de documento'
                });
            }
        }

        const updatedPerson = await Person.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Persona actualizada exitosamente',
            data: updatedPerson.getDetailedInfo()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar persona',
            error: error.message
        });
    }
};

// @desc    Cambiar estado de persona
// @route   PUT /api/persons/:id/status
// @access  Private (Admin/SuperAdmin)
const changePersonStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, motivoEstado } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de persona inválido'
            });
        }

        const person = await Person.findById(id);
        if (!person) {
            return res.status(404).json({
                success: false,
                message: 'Persona no encontrada'
            });
        }

        // Validar estado
        const validStates = ['Activo', 'Suspendido', 'Vetado'];
        if (!validStates.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        // Si se está vetando, verificar préstamos activos
        if (estado === 'Vetado') {
            const activeLoans = await Loan.find({
                studentId: id, // Nota: Esto necesitará actualizarse cuando migremos Loan
                status: { $in: ['prestado', 'atrasado'] }
            });

            if (activeLoans.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `No se puede vetar a la persona. Tiene ${activeLoans.length} préstamos activos`
                });
            }

            // Si se veta, desactivar usuario asociado
            await User.findOneAndUpdate(
                { personRef: id },
                { isActive: false, tieneCuenta: false }
            );

            person.tieneCuenta = false;
        }

        person.estado = estado;
        if ((estado === 'Suspendido' || estado === 'Vetado') && motivoEstado) {
            person.motivoEstado = motivoEstado;
        }

        await person.save();

        res.status(200).json({
            success: true,
            message: `Estado cambiado a ${estado} exitosamente`,
            data: person.getBasicInfo()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado de persona',
            error: error.message
        });
    }
};

// @desc    Obtener personas por grado
// @route   GET /api/persons/by-grade/:grado
// @access  Private (Admin/SuperAdmin)
const getPersonsByGrade = async (req, res) => {
    try {
        const { grado } = req.params;
        const { grupo, withoutAccount } = req.query;

        let persons = await Person.findByGrado(grado, grupo);

        // Filtrar solo los que no tienen cuenta si se especifica
        if (withoutAccount === 'true') {
            persons = persons.filter(person => !person.tieneCuenta);
        }

        res.status(200).json({
            success: true,
            data: persons.map(person => person.getBasicInfo()),
            count: persons.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener personas por grado',
            error: error.message
        });
    }
};

// @desc    Buscar personas
// @route   GET /api/persons/search
// @access  Private
const searchPersons = async (req, res) => {
    try {
        const { query, tipoPersona, estado = 'Activo', limit = 20 } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query de búsqueda requerido'
            });
        }

        let filters = {
            estado: estado,
            $or: [
                { nombre1: { $regex: query, $options: 'i' } },
                { nombre2: { $regex: query, $options: 'i' } },
                { apellido1: { $regex: query, $options: 'i' } },
                { apellido2: { $regex: query, $options: 'i' } },
                { doc: { $regex: query, $options: 'i' } }
            ]
        };

        if (tipoPersona) {
            filters.tipoPersona = tipoPersona;
        }

        const persons = await Person.find(filters)
            .limit(parseInt(limit))
            .sort({ apellido1: 1, nombre1: 1 });

        res.status(200).json({
            success: true,
            data: persons.map(person => person.getBasicInfo()),
            count: persons.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en búsqueda de personas',
            error: error.message
        });
    }
};

// @desc    Obtener estadísticas de personas
// @route   GET /api/persons/stats
// @access  Private (Admin/SuperAdmin)
const getPersonsStats = async (req, res) => {
    try {
        const stats = await Person.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    activos: {
                        $sum: { $cond: [{ $eq: ['$estado', 'Activo'] }, 1, 0] }
                    },
                    suspendidos: {
                        $sum: { $cond: [{ $eq: ['$estado', 'Suspendido'] }, 1, 0] }
                    },
                    vetados: {
                        $sum: { $cond: [{ $eq: ['$estado', 'Vetado'] }, 1, 0] }
                    },
                    conCuenta: {
                        $sum: { $cond: [{ $eq: ['$tieneCuenta', true] }, 1, 0] }
                    },
                    estudiantes: {
                        $sum: { $cond: [{ $eq: ['$tipoPersona', 'Estudiante'] }, 1, 0] }
                    },
                    profesores: {
                        $sum: { $cond: [{ $eq: ['$tipoPersona', 'Profesor'] }, 1, 0] }
                    },
                    colaboradores: {
                        $sum: { $cond: [{ $eq: ['$tipoPersona', 'Colaborador'] }, 1, 0] }
                    },
                    publico: {
                        $sum: { $cond: [{ $eq: ['$tipoPersona', 'Publico'] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            total: 0,
            activos: 0,
            suspendidos: 0,
            vetados: 0,
            conCuenta: 0,
            estudiantes: 0,
            profesores: 0,
            colaboradores: 0,
            publico: 0
        };

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// @desc    Obtener personas sin cuenta de usuario
// @route   GET /api/persons/without-account
// @access  Private (Admin/SuperAdmin)
const getPersonsWithoutAccount = async (req, res) => {
    try {
        const { limit = 100, tipoPersona } = req.query;

        // Construir filtros
        let filters = {
            tieneCuenta: false,
            estado: { $ne: 'Vetado' },
            isActive: true
        };

        // Filtrar por tipo de persona si se especifica
        if (tipoPersona) {
            filters.tipoPersona = tipoPersona;
        }

        const persons = await Person.find(filters)
            .limit(parseInt(limit))
            .sort({ apellido1: 1, nombre1: 1 });

        res.status(200).json({
            success: true,
            data: persons.map(person => person.getBasicInfo()),
            count: persons.length,
            message: `${persons.length} personas sin cuenta encontradas`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener personas sin cuenta',
            error: error.message
        });
    }
};

module.exports = {
    getPersons,
    getPersonById,
    createPerson,
    createPersonsBulk,
    updatePerson,
    changePersonStatus,
    getPersonsByGrade,
    searchPersons,
    getPersonsStats,
    getPersonsWithoutAccount
};
