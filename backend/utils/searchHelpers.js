/**
 * Helper para construir queries de búsqueda súper flexibles
 * Centraliza la lógica de búsqueda para evitar duplicación
 */

/**
 * Construye un query de MongoDB para búsqueda híbrida de personas
 * @param {string} searchTerm - Término de búsqueda
 * @param {object} baseFilters - Filtros base (estado, tipo, etc.)
 * @returns {object} Query object para MongoDB
 */
const buildPersonSearchQuery = (searchTerm, baseFilters = {}) => {
    console.debug('[searchHelpers] buildPersonSearchQuery called with:', { searchTerm, baseFilters });
    if (!searchTerm) {
        console.debug('[searchHelpers] No searchTerm provided, returning baseFilters');
        return baseFilters;
    }

    const searchQuery = searchTerm.trim();
    let searchConditions = {};

    // Búsqueda híbrida súper flexible
    if (searchQuery.includes(' ')) {
        // Si tiene espacios: dividir en palabras y buscar que TODAS estén presentes
        const words = searchQuery.split(/\s+/);
        const wordConditions = words.map(word => {
            const wordRegex = new RegExp(word, 'i');
            return {
                $or: [
                    // Buscar cada palabra en nombre completo
                    { $expr: { 
                        $regexMatch: { 
                            input: { 
                                $concat: [
                                    { $ifNull: ["$nombre1", ""] }, " ", 
                                    { $ifNull: ["$nombre2", ""] }, " ", 
                                    { $ifNull: ["$apellido1", ""] }, " ", 
                                    { $ifNull: ["$apellido2", ""] }
                                ] 
                            }, 
                            regex: wordRegex 
                        } 
                    }},
                    // También buscar en campos individuales
                    { nombre1: wordRegex },
                    { nombre2: wordRegex },
                    { apellido1: wordRegex },
                    { apellido2: wordRegex },
                    { doc: wordRegex },
                    { email: wordRegex }
                ]
            };
        });
        
        searchConditions = { $and: wordConditions }; // TODAS las palabras deben estar presentes
    } else {
        // Si es una sola palabra: búsqueda flexible por substring
        const searchRegex = new RegExp(searchQuery, 'i');
        
        searchConditions = {
            $or: [
                // Buscar en nombre completo concatenado
                { $expr: { 
                    $regexMatch: { 
                        input: { 
                            $concat: [
                                { $ifNull: ["$nombre1", ""] }, " ", 
                                { $ifNull: ["$nombre2", ""] }, " ", 
                                { $ifNull: ["$apellido1", ""] }, " ", 
                                { $ifNull: ["$apellido2", ""] }
                            ] 
                        }, 
                        regex: searchRegex 
                    } 
                }},
                // Buscar en campos individuales
                { nombre1: searchRegex },
                { nombre2: searchRegex },
                { apellido1: searchRegex },
                { apellido2: searchRegex },
                { doc: searchRegex },
                { email: searchRegex }
            ]
        };
    }

    // Combinar filtros base con condiciones de búsqueda
    const finalFilter = {
        ...baseFilters,
        ...searchConditions
    };
    console.debug('[searchHelpers] Final filter built:', JSON.stringify(finalFilter));
    return finalFilter;
};

module.exports = {
    buildPersonSearchQuery
};