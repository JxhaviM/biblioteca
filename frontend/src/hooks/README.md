# Hooks Reutilizables

## usePersonSearch

Hook reutilizable para búsqueda de personas con integración completa al backend.

### Características

- ✅ Búsqueda con debounce automático
- ✅ Estados de carga y error incluidos
- ✅ Soporte para personas con/sin cuenta de usuario
- ✅ Carga automática opcional
- ✅ Integración completa con APIs del backend

### Ejemplos de Uso

#### 1. Búsqueda básica de todas las personas

```tsx
import { usePersonSearch } from '../hooks/usePersonSearch';

const PersonsList = () => {
  const { persons, loading, error, searchPersons } = usePersonSearch({
    withoutAccount: false, // Todas las personas
    autoLoad: true
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar personas..."
        onChange={(e) => searchPersons(e.target.value)}
      />
      
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <div>
        {persons.map(person => (
          <div key={person._id}>{person.nombreCompleto}</div>
        ))}
      </div>
    </div>
  );
};
```

#### 2. Búsqueda solo personas sin cuenta (como en CreateUserModal)

```tsx
import { usePersonSearch } from '../hooks/usePersonSearch';

const CreateUserModal = () => {
  const { 
    persons, 
    loading, 
    error, 
    searchPersons, 
    resultCount 
  } = usePersonSearch({
    withoutAccount: true, // Solo personas sin cuenta
    debounceMs: 500,
    autoLoad: true
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    searchPersons(searchTerm);
  }, [searchTerm, searchPersons]);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar persona sin cuenta..."
      />
      
      {loading ? (
        <p>Buscando...</p>
      ) : (
        <p>Encontradas: {resultCount} personas</p>
      )}
      
      {error && <div className="text-red-500">{error}</div>}
      
      <select>
        <option value="">Seleccionar persona</option>
        {persons.map(person => (
          <option key={person._id} value={person._id}>
            {person.nombreCompleto} - {person.doc}
          </option>
        ))}
      </select>
    </div>
  );
};
```

#### 3. Búsqueda sin carga automática

```tsx
const ManualSearchComponent = () => {
  const { 
    persons, 
    loading, 
    loadPersons, 
    clearSearch 
  } = usePersonSearch({
    autoLoad: false // No cargar automáticamente
  });

  return (
    <div>
      <button onClick={() => loadPersons()}>
        Cargar Todas las Personas
      </button>
      
      <button onClick={clearSearch}>
        Limpiar Búsqueda
      </button>
      
      {loading && <p>Cargando...</p>}
      
      <div>
        {persons.map(person => (
          <div key={person._id}>{person.nombreCompleto}</div>
        ))}
      </div>
    </div>
  );
};
```

### Opciones de Configuración

```tsx
interface UsePersonSearchOptions {
  withoutAccount?: boolean; // true = solo personas sin cuenta, false = todas
  debounceMs?: number;      // Milliseconds para debounce (default: 300)
  autoLoad?: boolean;       // Cargar automáticamente al inicio (default: true)
}
```

### Valores de Retorno

```tsx
interface UsePersonSearchReturn {
  // Estados
  persons: Person[];        // Lista de personas encontradas
  loading: boolean;         // Estado de carga
  error: string | null;     // Error si ocurre alguno
  
  // Funciones
  searchPersons: (query: string) => void;  // Buscar con término
  loadPersons: () => void;                 // Recargar con último término
  clearSearch: () => void;                 // Limpiar búsqueda y error
  clearError: () => void;                  // Solo limpiar error
  
  // Información
  hasResults: boolean;      // true si hay resultados
  resultCount: number;      // Cantidad de resultados
}
```

### Integración con Backend

El hook se integra automáticamente con:

- `GET /api/persons` - Para todas las personas (con parámetro `search`)
- `GET /api/persons/without-account` - Para personas sin cuenta (con parámetro `search`)

Ambos endpoints soportan búsqueda híbrida que incluye:
- Búsqueda por palabras individuales
- Búsqueda por frases completas
- Coincidencias parciales
- Búsqueda en múltiples campos (nombre, apellidos, documento, email, etc.)

### Ventajas del Hook

1. **Reutilizable**: Un solo hook para todas las necesidades de búsqueda de personas
2. **Sin duplicación**: Elimina código repetido entre componentes
3. **Optimizado**: Debounce automático para evitar requests excesivos
4. **Flexible**: Configurable para diferentes casos de uso
5. **Robusto**: Manejo completo de errores y estados de carga
6. **Tipado**: Completamente tipado con TypeScript