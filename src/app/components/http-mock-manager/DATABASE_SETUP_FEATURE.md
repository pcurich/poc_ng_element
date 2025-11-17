# 🗃️ Database Setup Feature

## 📋 Descripción

Nueva funcionalidad que valida la existencia de la base de datos IndexedDB antes de mostrar los tabs de gestión. Si no existe la base de datos, se muestra un panel de configuración que permite al usuario crearla con los parámetros adecuados.

## 🔄 Flujo de Funcionamiento

### 1. **Inicialización del Componente**
```typescript
async initialize() {
  // 1. Verificar si la base de datos existe
  const dbStatus = await this.checkDatabaseExists();
  
  if (!dbStatus.exists) {
    // 2. Mostrar panel de configuración
    await this.loadDefaultDatabaseConfig();
    return;
  }
  
  // 3. Si existe, proceder con inicialización normal
  await this.initializeServices();
}
```

### 2. **Panel de Configuración de Base de Datos**
- **Se muestra cuando**: `shouldShowDatabaseSetup()` es `true`
- **Contiene**:
  - Nombre de la base de datos
  - Versión
  - Nombre del Object Store
  - Key Path
  - Botones para cargar configuración por defecto y crear DB

### 3. **Tabs de Gestión**
- **Se muestran cuando**: `shouldShowManagementTabs()` es `true`
- **Requiere**: Base de datos existente e inicializada

## 🛠️ Componentes Implementados

### **Interfaces Nuevas**
```typescript
interface DatabaseConfig {
  name: string;
  version: number;
  objectStoreName: string;
  keyPath: string;
  indexes: DatabaseIndex[];
}

interface DatabaseStatus {
  exists: boolean;
  isInitialized: boolean;
  config?: IDbConfig;
  error?: string;
}
```

### **Métodos del Presenter**
- `checkDatabaseExists()`: Verifica existencia sin crear
- `isDatabasePresent()`: Helper para IndexedDB
- `loadDefaultDatabaseConfig()`: Carga config por defecto
- `initializeServices()`: Inicializa servicios normalmente
- `handleCreateDatabase()`: Crea DB con configuración custom

### **Propiedades del Componente**
- `dbName`: Nombre de la base de datos
- `dbVersion`: Versión de la base de datos  
- `dbObjectStoreName`: Nombre del object store
- `dbKeyPath`: Key path para el object store

## 🎨 UI/UX

### **Panel de Configuración**
- **Diseño**: Gradiente sutil con borde punteado azul
- **Campos**: Inputs validados con placeholders descriptivos
- **Botones**: 
  - "📄 Cargar Configuración por Defecto" (gris)
  - "🚀 Crear Base de Datos" (azul, deshabilitado si faltan campos)
- **Estados**: Indicadores de carga, éxito y error

### **Transición Automática**
- Al crear la DB exitosamente, automáticamente se muestran los tabs
- Effect reactivo que carga configuración por defecto al mostrar panel

## 📊 Comportamiento Reactivo

### **Computed Properties**
```typescript
shouldShowDatabaseSetup = computed(() => !databaseStatus().exists);
shouldShowManagementTabs = computed(() => 
  databaseStatus().exists && databaseStatus().isInitialized
);
```

### **Estados Posibles**
1. **Base de datos no existe**: Muestra panel de configuración
2. **Base de datos existe pero no inicializada**: Muestra error
3. **Base de datos existe e inicializada**: Muestra tabs de gestión

## ⚡ Características Técnicas

### **Validación de IndexedDB**
- Usa `indexedDB.deleteDatabase()` para verificar existencia sin crear
- Manejo de errores robusto
- Compatibilidad con navegadores modernos

### **Configuración por Defecto**
- Basada en `ORMFactory.getDefaultHttpMocksConfig()`
- Mapeo automático de `IDbConfig` a `DatabaseConfig`
- Índices preconfigurados para optimización

### **Gestión de Estado**
- Angular Signals para reactividad
- Estado centralizado en el presenter
- Computed properties para UI condicional

## 🚀 Ejemplo de Uso

```html
<!-- El componente automáticamente detecta el estado -->
<http-mock-manager 
  (databaseCreatedEvent)="onDatabaseCreated()"
  [dbName]="'MyCustomDB'"
  [dbVersion]="2">
</http-mock-manager>
```

```typescript
onDatabaseCreated() {
  console.log('🎉 Database created successfully!');
  // Los tabs se mostrarán automáticamente
}
```

## 🔧 Configuración Técnica

### **Configuración por Defecto Aplicada**
```json
{
  "name": "HttpMocksDB",
  "version": 1,
  "objectStoreName": "httpMocks", 
  "keyPath": "id",
  "indexes": [
    { "name": "serviceCode", "keyPath": "serviceCode" },
    { "name": "url", "keyPath": "url" },
    { "name": "method", "keyPath": "method" },
    { "name": "httpCodeResponseValue", "keyPath": "httpCodeResponseValue" },
    { "name": "createdAt", "keyPath": "createdAt" },
    { "name": "updatedAt", "keyPath": "updatedAt" }
  ]
}
```

## ✅ Ventajas de la Implementación

1. **🛡️ Validación Previa**: Evita errores al intentar usar una DB inexistente
2. **🎯 UX Mejorada**: Guía al usuario en la configuración inicial
3. **⚙️ Flexibilidad**: Permite configuración custom o uso de defaults
4. **🔄 Reactivo**: UI se adapta automáticamente al estado de la DB
5. **🧹 Limpio**: Separación clara entre setup y gestión
6. **📱 Responsivo**: Panel adaptado para diferentes tamaños

## 🎉 Resultado Final

El usuario ahora tiene una experiencia fluida donde:
1. Se detecta automáticamente si la DB existe
2. Si no existe, se guía para crearla
3. Una vez creada, se muestran inmediatamente los tabs de gestión
4. Todo funciona de manera transparente y reactiva

---

**🗃️ Base de datos configurada y lista para gestionar HTTP Mocks**