const Student = require('../models/student');
const Loan = require('../models/loan');
const mongoose = require('mongoose');

// Obtener todos los estudiantes
const getStudents = async (req, res) => {
    try {
        const { page = 1, limit = 50, search, grade, isActive } = req.query;
        
        // Construir filtros
        let filters = {};
        
        if (search) {
            filters.$or = [
                { name: { $regex: search, $options: 'i' } },
                { idNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (grade) {
            filters.grade = grade;
        }
        
        if (isActive !== undefined) {
            filters.isActive = isActive === 'true';
        }
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { name: 1 }
        };
        
        const students = await Student.find(filters)
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit)
            .sort(options.sort);
            
        const total = await Student.countDocuments(filters);
        
        res.status(200).json({
            success: true,
            data: students,
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
            message: 'Error al obtener los estudiantes',
            error: error.message
        });
    }
};

// Obtener estudiante por ID
const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }
        
        // Obtener préstamos activos del estudiante
        const activeLoans = await Loan.findActiveLoansForStudent(student._id);
        
        res.status(200).json({
            success: true,
            data: {
                student,
                activeLoans: activeLoans.length,
                loans: activeLoans
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el estudiante',
            error: error.message
        });
    }
};

// Crear nuevo estudiante
const createStudent = async (req, res) => {
    try {
        const { name, idNumber, grade, contactInfo, notes } = req.body;
        
        // Validaciones básicas
        if (!name || !idNumber || !grade) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, número de identificación y grado son requeridos'
            });
        }
        
        // Verificar si ya existe un estudiante con ese ID
        const existingStudent = await Student.findByIdNumber(idNumber);
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un estudiante con ese número de identificación'
            });
        }
        
        const student = new Student({
            name,
            idNumber,
            grade,
            contactInfo,
            notes
        });
        
        await student.save();
        
        res.status(201).json({
            success: true,
            message: 'Estudiante creado exitosamente',
            data: student
        });
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'El número de identificación ya está registrado'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al crear el estudiante',
            error: error.message
        });
    }
};

// Actualizar estudiante
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remover campos que no se deben actualizar directamente
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;
        
        const student = await Student.findByIdAndUpdate(
            id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Estudiante actualizado exitosamente',
            data: student
        });
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'El número de identificación ya está registrado'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estudiante',
            error: error.message
        });
    }
};

// Desactivar estudiante (soft delete)
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el estudiante tiene préstamos activos
        const activeLoans = await Loan.findActiveLoansForStudent(id);
        
        if (activeLoans.length > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede desactivar el estudiante. Tiene ${activeLoans.length} préstamos activos`,
                data: { activeLoans: activeLoans.length }
            });
        }
        
        const student = await Student.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Estudiante desactivado exitosamente',
            data: student
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al desactivar el estudiante',
            error: error.message
        });
    }
};

// Obtener historial de préstamos de un estudiante
const getStudentLoanHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, status } = req.query;
        
        // Verificar que el estudiante existe
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }
        
        // Construir filtros
        let filters = { studentId: id };
        if (status) {
            filters.status = status;
        }
        
        const options = {
            page: parseInt(page),
            limit: parseInt(limit)
        };
        
        const loans = await Loan.find(filters)
            .populate('bookId', 'title author isbn')
            .sort({ createdAt: -1 })
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);
            
        const total = await Loan.countDocuments(filters);
        
        res.status(200).json({
            success: true,
            data: {
                student: student.getFormattedInfo(),
                loans
            },
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
            message: 'Error al obtener el historial de préstamos',
            error: error.message
        });
    }
};

// Obtener estadísticas de un estudiante
const getStudentStats = async (req, res) => {
    try {
        const { id } = req.params;
        
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }
        
        const stats = await Loan.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(id) } },
            {
                $group: {
                    _id: null,
                    totalLoans: { $sum: 1 },
                    currentLoans: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['prestado', 'atrasado']] },
                                1,
                                0
                            ]
                        }
                    },
                    returnedLoans: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'devuelto'] }, 1, 0]
                        }
                    },
                    overdueLoans: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'atrasado'] }, 1, 0]
                        }
                    }
                }
            }
        ]);
        
        const studentStats = stats.length > 0 ? stats[0] : {
            totalLoans: 0,
            currentLoans: 0,
            returnedLoans: 0,
            overdueLoans: 0
        };
        
        res.status(200).json({
            success: true,
            data: {
                student: student.getFormattedInfo(),
                stats: studentStats
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas del estudiante',
            error: error.message
        });
    }
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentLoanHistory,
    getStudentStats
};
