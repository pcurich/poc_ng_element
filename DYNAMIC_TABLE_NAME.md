## Implementación de Nombre de Tabla Dinámico

### Problema Solucionado
El método `getAllServiceCodes()` estaba usando el nombre de tabla hardcodeado `'httpMocks'` en lugar de obtener dinámicamente el nombre de la tabla desde la configuración de la base de datos.

### Solución Implementada

#### 1. Método Helper `getDynamicTableName()`
```typescript
private async getDynamicTableName(): Promise<string> {
  // 1. Usar el tableName del BaseRepository (configurado en constructor)
  if (this.tableName && this.tableName.trim() !== '') {
    return this.tableName;
  }
  
  // 2. Fallback: obtener el primer objectStore de la base de datos
  try {
    const db = await this.dbContext.getDB();
    if (db.objectStoreNames.length > 0) {
      return db.objectStoreNames[0];
    }
  } catch (error) {
    console.error('Error getting database object stores:', error);
  }
  
  // 3. Último fallback: usar nombre por defecto
  return 'httpMocks';
}
```

#### 2. Uso en `getAllServiceCodes()`
```typescript
async getAllServiceCodes(): Promise<string[]> {
  const dynamicTableName = await this.getDynamicTableName();
  
  // Usar transacción con nombre dinámico
  await this.dbContext.runTransaction(dynamicTableName, 'readonly', (store: IDBObjectStore) => {
    // ... lógica del cursor e índice
  });
}
```

### Beneficios

1. **Flexibilidad**: Funciona con cualquier configuración de base de datos
2. **Robustez**: Múltiples niveles de fallback
3. **Mantenibilidad**: No hay nombres hardcodeados
4. **Escalabilidad**: Se adapta a cambios en la configuración

### Niveles de Fallback

1. **Primario**: `this.tableName` (configurado en BaseRepository constructor)
2. **Secundario**: `db.objectStoreNames[0]` (primer objectStore disponible) 
3. **Terciario**: `'httpMocks'` (valor por defecto como último recurso)

### Consideraciones

- El proyecto siempre maneja 1 sola tabla como se especificó
- La implementación es compatible con configuraciones custom de base de datos
- Mantiene compatibilidad con el método `getDefaultHttpMocksConfig()`