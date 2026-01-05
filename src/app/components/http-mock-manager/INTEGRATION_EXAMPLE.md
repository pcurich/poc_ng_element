# Integration Example - Uso de Componentes Modularizados

## 1. Importar Componentes Shared

```typescript
// En http-mock-manager.component.ts
import {
  TabsComponent,
  SubTabsComponent,
  SectionHeaderComponent,
  EmptyStateComponent,
  ConfirmationDialogComponent
} from './shared';

import { DataManagementComponent } from './features/data-management/data-management.component';
import { HttpDefinitionComponent } from './features/http-definition/http-definition.component';
import { PersistenceComponent } from './features/persistence/persistence.component';
import { FloatingBubbleComponent } from './components/floating-bubble/floating-bubble.component';

@Component({
  selector: 'app-http-mock-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsComponent,
    SubTabsComponent,
    SectionHeaderComponent,
    EmptyStateComponent,
    ConfirmationDialogComponent,
    DataManagementComponent,
    HttpDefinitionComponent,
    PersistenceComponent,
    FloatingBubbleComponent
  ],
  // ... resto de la configuración
})
```

## 2. Actualizar Template Principal

### Antes (Monolítico):
```html
<div class="tab-navigation">
  <button 
    *ngFor="let group of groups" 
    [class.active]="selectedGroup === group.id"
    (click)="selectGroup(group.id)">
    <i [class]="'fas fa-' + group.icon"></i>
    {{ group.name }}
  </button>
</div>
```

### Después (Modular con TabsComponent):
```html
<app-tabs
  [tabs]="mainTabs"
  [activeTab]="selectedGroup"
  (tabChange)="selectGroup($event)">
</app-tabs>
```

## 3. Definir Datos en TypeScript

```typescript
export class HttpMockManagerComponent {
  // Tabs principales
  mainTabs: Tab[] = [
    { id: 'data', label: 'Data Management', icon: 'database' },
    { id: 'definition', label: 'HTTP Definition', icon: 'code' },
    { id: 'persistence', label: 'Persistence', icon: 'save' }
  ];

  selectedGroup = signal<string>('data');

  selectGroup(groupId: string): void {
    this.selectedGroup.set(groupId);
  }
}
```

## 4. Uso de Feature Components

### Data Management Feature:
```html
<app-data-management
  *ngIf="selectedGroup() === 'data'"
  [selectedContext]="selectedContext()"
  [contextOptions]="contextOptions"
  [databaseStatus]="databaseStatus"
  [databaseConfig]="databaseConfig"
  [statistics]="statistics()"
  (contextChange)="onContextChange($event)"
  (refreshStats)="refreshStatistics()"
  (reinitializeDb)="reinitializeDatabase()"
  (deleteDb)="deleteDatabase()">
</app-data-management>
```

### HTTP Definition Feature:
```html
<app-http-definition
  *ngIf="selectedGroup() === 'definition'"
  [serviceCode]="serviceCode()"
  [contexts]="contextOptions"
  [selectedMock]="selectedMock()"
  [mockForm]="mockForm"
  (serviceCodeChange)="updateServiceCode($event)"
  (editMock)="onEditMock($event)"
  (deleteMock)="onDeleteMock($event)"
  (saveContext)="saveToContext()"
  (headerAdd)="addHeader()"
  (headerRemove)="removeHeader($event)">
</app-http-definition>
```

### Persistence Feature:
```html
<app-persistence
  *ngIf="selectedGroup() === 'persistence'"
  (export)="onExport()"
  (fileSelected)="onFileSelected($event)">
</app-persistence>
```

## 5. Uso de Floating Bubble (Estado Minimizado)

```html
<app-floating-bubble
  *ngIf="isMinimized()"
  [mockCount]="totalMocks()"
  (expand)="toggleMinimize()"
  (dragStart)="onDragStart($event)">
</app-floating-bubble>
```

## 6. Uso de Empty State

```html
<app-empty-state
  *ngIf="mocks().length === 0"
  icon="file-code"
  message="No mocks available"
  hint="Create your first HTTP mock to get started">
</app-empty-state>
```

## 7. Uso de Confirmation Dialog

```typescript
// En el componente TypeScript
showDeleteConfirmation = signal<boolean>(false);

deleteDatabase(): void {
  this.showDeleteConfirmation.set(true);
}

onConfirmDelete(): void {
  // Lógica de eliminación
  this.dbContext.deleteDatabase();
  this.showDeleteConfirmation.set(false);
}

onCancelDelete(): void {
  this.showDeleteConfirmation.set(false);
}
```

```html
<!-- En el template -->
<app-confirmation-dialog
  *ngIf="showDeleteConfirmation()"
  title="Delete Database"
  message="Are you sure you want to delete all data? This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  confirmIcon="trash"
  [isDanger]="true"
  (confirm)="onConfirmDelete()"
  (cancel)="onCancelDelete()">
</app-confirmation-dialog>
```

## 8. Uso de Section Header

```html
<app-section-header
  title="Database Settings"
  subtitle="Configure storage and persistence"
  icon="cog"
  [showAction]="true"
  actionLabel="Reset"
  actionIcon="undo"
  (action)="resetDatabaseSettings()">
</app-section-header>
```

## 9. Ventajas de la Modularización

### ✅ Reutilización:
- Componentes shared pueden usarse en múltiples features
- Tabs reutilizables en diferentes secciones
- Empty states consistentes en toda la app

### ✅ Mantenibilidad:
- Cambios en el diseño de tabs se hacen en un solo lugar
- Estilos centralizados y consistentes
- Fácil de testear componentes individuales

### ✅ SOLID Principles:
- **Single Responsibility**: Cada componente tiene una única función
- **Open/Closed**: Abierto para extensión (nuevos tabs), cerrado para modificación
- **Liskov Substitution**: Los feature components son intercambiables
- **Interface Segregation**: Interfaces específicas para cada componente
- **Dependency Inversion**: Componentes dependen de abstracciones (interfaces)

### ✅ Extensibilidad:
- Fácil agregar nuevos protocolos (gRPC, WebSocket)
- Nuevo feature = nuevo componente en features/
- Componentes shared funcionan con cualquier feature

## 10. Testing Individual

```typescript
// tabs.component.spec.ts
describe('TabsComponent', () => {
  it('should emit tabChange when tab is clicked', () => {
    const fixture = TestBed.createComponent(TabsComponent);
    const component = fixture.componentInstance;
    
    component.tabs = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' }
    ];
    
    spyOn(component.tabChange, 'emit');
    
    component.selectTab('tab2');
    
    expect(component.tabChange.emit).toHaveBeenCalledWith('tab2');
  });
});
```

## 11. Próximos Pasos

1. ✅ Shared components creados
2. ⏳ Actualizar http-mock-manager.component.ts para usar los nuevos componentes
3. ⏳ Migrar lógica de negocio a los feature components
4. ⏳ Actualizar tests para componentes individuales
5. ⏳ Documentar propiedades @Input/@Output en cada componente
