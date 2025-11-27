const Person = require('../models/person');
const User = require('../models/user');
const Loan = require('../models/loan');
const mongoose = require('mongoose');
const { buildPersonSearchQuery } = require('../utils/searchHelpers');

// @desc    Obtener todas las personas con filtros
// @route   GET /api/persons
// @access  Private (Admin/SuperAdmin)
const getPersons = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit, // No default limit - if not provided, load all
            search, 
            tipoPersona, 
            estado, 
            grado, 
            grupo,
            tieneCuenta 
        } = req.query;

        // Log incoming query params for debugging
        console.debug('[personController] getPersons req.query:', JSON.stringify(req.query));
        // Log a masked version of the Authorization header (do NOT print the full token)
        try {
            const auth = req.headers && req.headers.authorization;
            if (auth) {
                const last4 = auth.slice(-4);
                console.debug('[personController] getPersons auth (masked):', auth.length > 8 ? `${auth.slice(0,7)}***${last4}` : `***${last4}`);
            } else {
                console.debug('[personController] getPersons auth: <none>');
            }
        } catch (e) {
            console.debug('[personController] getPersons auth: <error masking>');
        }
        
        let baseFilters;
        
        // Si el usuario es admin, no mostrar superadmins
        if (req.user.role === 'admin') {
            // Obtener IDs de usuarios con rol 'superadmin' para excluirlos
            const superadminUsers = await User.find({ role: 'superadmin', isActive: true }).select('_id');
            const superadminIds = superadminUsers.map(u => u._id);
            
            baseFilters = {
                isActive: true,
                estado: { $ne: 'Vetado' },
                _id: { $nin: superadminIds },
                // Asegurarse de que no se muestren usuarios con rol de superadmin
                $or: [
                    { userRef: { $exists: false } },
                    { userRef: { $nin: superadminIds } }
                ]
            };
        } else {
            baseFilters = {
                isActive: true,
                estado: { $ne: 'Vetado' }
            };
        }
        
        // Aplicar filtros adicionales
        if (tipoPersona) baseFilters.tipoPersona = tipoPersona;
        if (estado) baseFilters.estado = estado;
        if (grado) baseFilters.grado = grado;
        if (grupo) baseFilters.grupo = grupo;
        // Solo filtrar por tieneCuenta si se pasa explícitamente
        if (typeof tieneCuenta !== 'undefined') baseFilters.tieneCuenta = tieneCuenta === 'true';

    // Aplicar búsqueda híbrida usando helper reutilizable
    const filters = buildPersonSearchQuery(search, baseFilters);
    console.debug('[personController] getPersons filters:', JSON.stringify(filters));

        let persons;
        let total;
        // Si hay término de búsqueda, ignorar paginación y devolver hasta 500 resultados
        if (search && search.trim()) {
            persons = await Person.find(filters)
                .limit(500)
                .sort({ apellido1: 1, nombre1: 1 });
            total = persons.length;
        } else {
            // Si no hay limit, cargar todas las personas sin paginación
            if (!limit) {
                persons = await Person.find(filters)
                    .sort({ apellido1: 1, nombre1: 1 });
                total = persons.length;
            } else {
                const options = {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    sort: { apellido1: 1, nombre1: 1 }
                };
                persons = await Person.find(filters)
                    .limit(options.limit * 1)
                    .skip((options.page - 1) * options.limit)
                    .sort(options.sort);
                total = await Person.countDocuments(filters);
            }
        }

        // Obtener información detallada (necesaria para el frontend)
        const personsWithDetails = await Promise.all(
            persons.map(async (person) => await person.getDetailedInfo())
        );

        // MOVER PERSONA DEL USUARIO LOGUEADO AL PRINCIPIO
        let orderedPersons = [...personsWithDetails];
        
        // Buscar la persona asociada al usuario logueado
        const loggedInUser = await User.findById(req.user.id).select('personRef');
        if (loggedInUser && loggedInUser.personRef) {
            const loggedInPersonIndex = orderedPersons.findIndex(person => 
                person._id.toString() === loggedInUser.personRef.toString()
            );
            
            if (loggedInPersonIndex > 0) {
                const loggedInPerson = orderedPersons.splice(loggedInPersonIndex, 1)[0];
                orderedPersons.unshift(loggedInPerson);
            }
        }

        res.status(200).json({
            success: true,
            data: orderedPersons,
            pagination: {
                page: search && search.trim() ? 1 : (!limit ? 1 : parseInt(page)),
                limit: search && search.trim() ? 500 : (!limit ? total : parseInt(limit)),
                total,
                pages: search && search.trim() ? 1 : (!limit ? 1 : Math.ceil(total / parseInt(limit)))
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
        const { role: userRole } = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de persona inválido'
            });
        }

        // Si el usuario es admin, verificar que no esté intentando acceder a un superadmin
        if (userRole === 'admin') {
            // Buscar si la persona tiene un usuario asociado con rol 'superadmin'
            const superadminUser = await User.findOne({ 
                personRef: id, 
                role: 'superadmin',
                isActive: true 
            });
            
            if (superadminUser) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver esta información'
                });
            }
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

        // Si el usuario es admin y el usuario asociado es admin o superadmin, no mostrar
        if (userRole === 'admin' && user && ['admin', 'superadmin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver esta información'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                person: await person.getDetailedInfo(),
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
            data: await person.getDetailedInfo()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear persona',
            error: error.message
        });
    }
};

// @desc    Crear múltiples personas (carga masiva) - ahora encola job para procesamiento
// @route   POST /api/persons/bulk
// @access  Private (Admin/SuperAdmin)
const createPersonsBulk = async (req, res) => {
    try {
        // Se espera multipart/form-data con file y tipoPersona
        const file = req.file;
        const { tipoPersona } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, message: 'Archivo CSV requerido' });
        }

        if (!tipoPersona) {
            return res.status(400).json({ success: false, message: 'El tipo de persona es requerido' });
        }

        const BulkJob = require('../models/bulkJob');
        const { initAgenda } = require('../jobs/agenda');

        // Crear registro de job
        const bulk = await BulkJob.create({
            filename: file.filename,
            originalName: file.originalname,
            tipoPersona,
            status: 'queued',
            createdBy: req.user ? req.user._id : undefined
        });

        // Inicializar agenda y programar job
        const agenda = await initAgenda();
        await agenda.now('process-bulk-file', { filename: file.filename, originalName: file.originalname, tipoPersona, userId: req.user?._id, bulkJobId: bulk._id });

        return res.status(202).json({ success: true, message: 'Carga encolada', jobId: bulk._id });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al encolar carga masiva', error: error.message });
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
            data: await updatedPerson.getDetailedInfo()
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
                    activos: { $sum: { $cond: [{ $eq: ['$estado', 'Activo'] }, 1, 0] } },
                    suspendidos: { $sum: { $cond: [{ $eq: ['$estado', 'Suspendido'] }, 1, 0] } },
                    vetados: { $sum: { $cond: [{ $eq: ['$estado', 'Vetado'] }, 1, 0] } },
                    conCuenta: { $sum: { $cond: [{ $eq: ['$tieneCuenta', true] }, 1, 0] } },
                    estudiantes: { $sum: { $cond: [{ $eq: ['$tipoPersona', 'Estudiante'] }, 1, 0] } },
                    profesores: { $sum: { $cond: [{ $eq: ['$tipoPersona', 'Profesor'] }, 1, 0] } },
                    colaboradores: { $sum: { $cond: [{ $eq: ['$tipoPersona', 'Colaborador'] }, 1, 0] } },
                    publico: { $sum: { $cond: [{ $eq: ['$tipoPersona', 'Publico'] }, 1, 0] } }
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
const getPersonsWithAccount = async (req, res) => {
    try {
        const { limit = 500, tipoPersona, search } = req.query;

        // Construir filtros base para personas con cuenta
        let baseFilters = {
            tieneCuenta: true,
            estado: { $ne: 'Vetado' },
            isActive: true
        };

        // Agregar filtro de tipo de persona
        if (tipoPersona) {
            baseFilters.tipoPersona = tipoPersona;
        }

        // Log incoming query params for debugging
        console.debug('[personController] getPersonsWithAccount req.query:', JSON.stringify(req.query));
        
        // Aplicar búsqueda híbrida usando helper reutilizable
        const filters = buildPersonSearchQuery(search, baseFilters);
        console.debug('[personController] getPersonsWithAccount filters:', JSON.stringify(filters));

        const persons = await Person.find(filters)
            .limit(parseInt(limit))
            .sort({ 
                tipoPersona: 1,
                apellido1: 1, 
                nombre1: 1 
            });
        console.debug('[personController] getPersonsWithAccount raw count:', persons.length);

        // Obtener información detallada
        const personsWithDetails = await Promise.all(
            persons.map(async (person) => await person.getDetailedInfo())
        );

        res.status(200).json({
            success: true,
            data: personsWithDetails,
            count: personsWithDetails.length,
            message: `${personsWithDetails.length} personas con cuenta encontradas`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener personas con cuenta',
            error: error.message
        });
    }
};

const getPersonsWithoutAccount = async (req, res) => {
    try {
        const { limit = 500, tipoPersona, search } = req.query;

        // Construir filtros base para personas sin cuenta
        let baseFilters = {
            tieneCuenta: false,
            estado: { $ne: 'Vetado' },
            isActive: true
        };

        // Agregar filtro de tipo de persona
        if (tipoPersona) {
            baseFilters.tipoPersona = tipoPersona;
        }

        // Log incoming query params for debugging (compare with getPersons)
        console.debug('[personController] getPersonsWithoutAccount req.query:', JSON.stringify(req.query));
        // Log a masked version of the Authorization header (do NOT print the full token)
        try {
            const auth = req.headers && req.headers.authorization;
            if (auth) {
                const last4 = auth.slice(-4);
                console.debug('[personController] getPersonsWithoutAccount auth (masked):', auth.length > 8 ? `${auth.slice(0,7)}***${last4}` : `***${last4}`);
            } else {
                console.debug('[personController] getPersonsWithoutAccount auth: <none>');
            }
        } catch (e) {
            console.debug('[personController] getPersonsWithoutAccount auth: <error masking>');
        }
    // Aplicar búsqueda híbrida usando helper reutilizable
    const filters = buildPersonSearchQuery(search, baseFilters);
    console.debug('[personController] getPersonsWithoutAccount filters:', JSON.stringify(filters));

        const persons = await Person.find(filters)
            .limit(parseInt(limit))
            .sort({ 
                tipoPersona: 1,
                apellido1: 1, 
                nombre1: 1 
            });
        console.debug('[personController] getPersonsWithoutAccount raw count:', persons.length);

        // Obtener información detallada (consistente con getPersons)
        const personsWithDetails = await Promise.all(
            persons.map(async (person) => await person.getDetailedInfo())
        );

        res.status(200).json({
            success: true,
            data: personsWithDetails,
            count: personsWithDetails.length,
            message: `${personsWithDetails.length} personas sin cuenta encontradas`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener personas sin cuenta',
            error: error.message
        });
    }
};

// @desc    Obtener estado de un bulk job
// @route   GET /api/persons/bulk/:id/status
// @access  Private (Admin/SuperAdmin)
const getBulkJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const BulkJob = require('../models/bulkJob');

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'ID de job inválido' });
        }

        const job = await BulkJob.findById(id).lean();
        if (!job) return res.status(404).json({ success: false, message: 'Job no encontrado' });

        res.status(200).json({ success: true, data: job });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener estado del job', error: error.message });
    }
};

// @desc    Descargar reporte de errores generado por el bulk job
// @route   GET /api/persons/bulk/:id/report
// @access  Private (Admin/SuperAdmin)
const downloadBulkJobReport = async (req, res) => {
    try {
        const { id } = req.params;
        const BulkJob = require('../models/bulkJob');
        const path = require('path');

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'ID de job inválido' });
        }

        const job = await BulkJob.findById(id).lean();
        if (!job) return res.status(404).json({ success: false, message: 'Job no encontrado' });

        if (!job.errorFile) {
            return res.status(404).json({ success: false, message: 'No hay reporte de errores para este job' });
        }

        const reportPath = path.join(__dirname, '..', 'uploads', job.errorFile);
        return res.download(reportPath, job.errorFile);

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al descargar reporte', error: error.message });
    }
};

module.exports = {
    getPersons,
    getPersonById,
    createPerson,
    createPersonsBulk,
    getBulkJobStatus,
    downloadBulkJobReport,
    updatePerson,
    changePersonStatus,
    getPersonsByGrade,
    searchPersons,
    getPersonsStats,
    getPersonsWithAccount,
    getPersonsWithoutAccount
};
