const { performDatabaseMaintenance, generateAutomaticReports } = require('../middlewares/loanMiddleware');

class SchedulerService {
    constructor() {
        this.intervals = [];
        this.isRunning = false;
    }

    // Iniciar el programador
    start() {
        if (this.isRunning) {
            console.log('⏰ Programador ya está ejecutándose');
            return;
        }

        console.log('🚀 Iniciando programador de tareas...');
        
        // Mantenimiento de estados cada 30 minutos
        const maintenanceInterval = setInterval(async () => {
            try {
                console.log('🔧 Ejecutando mantenimiento automático...');
                await performDatabaseMaintenance();
            } catch (error) {
                console.error('❌ Error en mantenimiento automático:', error.message);
            }
        }, 30 * 60 * 1000); // 30 minutos

        // Reporte automático cada 24 horas
        const reportInterval = setInterval(async () => {
            try {
                console.log('📊 Generando reporte automático...');
                await generateAutomaticReports();
            } catch (error) {
                console.error('❌ Error en reporte automático:', error.message);
            }
        }, 24 * 60 * 60 * 1000); // 24 horas

        // Limpieza de logs cada semana (opcional)
        const cleanupInterval = setInterval(() => {
            try {
                console.log('🧹 Ejecutando limpieza semanal...');
                this.weeklyCleanup();
            } catch (error) {
                console.error('❌ Error en limpieza semanal:', error.message);
            }
        }, 7 * 24 * 60 * 60 * 1000); // 7 días

        this.intervals.push(maintenanceInterval, reportInterval, cleanupInterval);
        this.isRunning = true;
        
        console.log('✅ Programador iniciado exitosamente');
        console.log('   - Mantenimiento: cada 30 minutos');
        console.log('   - Reportes: cada 24 horas');
        console.log('   - Limpieza: cada 7 días');
    }

    // Detener el programador
    stop() {
        if (!this.isRunning) {
            console.log('⏰ Programador no está ejecutándose');
            return;
        }

        console.log('🛑 Deteniendo programador de tareas...');
        
        this.intervals.forEach(interval => {
            clearInterval(interval);
        });
        
        this.intervals = [];
        this.isRunning = false;
        
        console.log('✅ Programador detenido exitosamente');
    }

    // Limpieza semanal
    async weeklyCleanup() {
        try {
            // Aquí puedes agregar tareas de limpieza como:
            // - Limpiar logs antiguos
            // - Optimizar base de datos
            // - Generar respaldos
            
            console.log('🧹 Limpieza semanal completada');
            
            // Ejemplo: limpiar console.log si están siendo guardados
            if (process.env.NODE_ENV === 'production') {
                // Lógica de limpieza para producción
            }
            
            return true;
        } catch (error) {
            console.error('Error en limpieza semanal:', error);
            throw error;
        }
    }

    // Obtener estado del programador
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeIntervals: this.intervals.length,
            tasks: [
                {
                    name: 'Mantenimiento de Estados',
                    frequency: '30 minutos',
                    description: 'Actualiza estados de préstamos atrasados'
                },
                {
                    name: 'Reporte Automático',
                    frequency: '24 horas',
                    description: 'Genera reportes de actividad'
                },
                {
                    name: 'Limpieza Semanal',
                    frequency: '7 días',
                    description: 'Limpieza y optimización del sistema'
                }
            ]
        };
    }

    // Ejecutar tarea específica manualmente
    async runTask(taskName) {
        try {
            console.log(`🔧 Ejecutando tarea manual: ${taskName}`);
            
            switch (taskName) {
                case 'maintenance':
                    return await performDatabaseMaintenance();
                
                case 'reports':
                    return await generateAutomaticReports();
                
                case 'cleanup':
                    return await this.weeklyCleanup();
                
                default:
                    throw new Error(`Tarea '${taskName}' no reconocida`);
            }
        } catch (error) {
            console.error(`❌ Error ejecutando tarea ${taskName}:`, error.message);
            throw error;
        }
    }
}

// Crear instancia singleton
const schedulerService = new SchedulerService();

module.exports = schedulerService;
