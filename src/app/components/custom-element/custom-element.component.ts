import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, signal, computed, effect } from '@angular/core';
import { ORMFactory, Task, TaskStatus, ITaskData, TaskService } from '../../../core/index';

@Component({
  selector: 'app-custom-element',
  standalone: true,
  templateUrl: './custom-element.component.html',
  styleUrls: ['./custom-element.component.scss']
})
export class CustomElementComponent implements OnInit, OnChanges, OnDestroy {
  @Input() name: string = 'Mundo';
  @Input() message: string = '¡Este es un custom element de Angular con IndexedDB ORM!';
  
  // Signals para el estado del componente
  clickCount = signal(0);
  angularVersion = signal('20');
  
  // 📋 ORM y Gestión de Tareas
  private taskService?: TaskService;
  tasksLoaded = signal(false);
  taskCount = signal(0);
  sampleTask = signal<Task | null>(null);
  
  // Signal computed para mostrar información dinámica
  displayInfo = computed(() => 
    `Info: ${this.name} - Clicks: ${this.clickCount()} - Tasks: ${this.taskCount()} - ${new Date().toLocaleTimeString()}`
  );
  
  // Computed para mostrar estado de la base de datos
  dbStatus = computed(() => {
    if (!this.tasksLoaded()) return '🔄 Inicializando base de datos...';
    if (this.taskCount() === 0) return '📝 No hay tareas. ¡Crea una!';
    return `✅ DB activa - ${this.taskCount()} tareas`;
  });

  constructor() {
    // Effect para reaccionar a cambios en clickCount
    effect(() => {
      const count = this.clickCount();
      if (count > 0) {
        console.log(`🎯 Signal effect triggered: Click count changed to ${count}`);
        
        // Ejemplo de reactividad con signals
        if (count === 5) {
          console.log('🎉 ¡Llegaste a 5 clicks! Los signals están funcionando perfectamente.');
        }
      }
    });
  }
  
  async ngOnInit(): Promise<void> {
    console.log('🚀 Custom element initialized:', { name: this.name, message: this.message });
    console.log('✅ Signals initialized without Zone.js');
    
    // 🗄️ Inicializar IndexedDB ORM
    await this.initializeDatabase();
  }
  
  ngOnDestroy(): void {
    console.log('🔚 Custom element destroyed');
    this.taskService = undefined;
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 Custom element properties changed:', changes);
  }
  
  // 🗄️ MÉTODOS DE INICIALIZACIÓN DE BASE DE DATOS
  
  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🗄️ Initializing IndexedDB ORM...');
      
      // Crear configuración de la base de datos
      const dbConfig = ORMFactory.getDefaultTasksConfig();
      console.log('📋 DB Config:', dbConfig);
      
      // Crear contexto de base de datos
      const dbContext = ORMFactory.createDbContext(dbConfig);
      await dbContext.open();
      console.log('✅ Database opened successfully');
      
      // Crear servicio de tareas (simulando inyección de dependencias)
      this.taskService = new TaskService();
      
      // Configurar el repositorio manualmente (ya que no tenemos DI real)
      const taskRepository = ORMFactory.createTaskRepository(dbContext);
      (this.taskService as any).repository = taskRepository;
      
      await this.taskService.initialize();
      
      // Actualizar signals con estado inicial
      this.tasksLoaded.set(true);
      const stats = this.taskService.statistics();
      this.taskCount.set(stats?.total || 0);
      
      console.log('📊 Task service initialized:', stats);
      
      // Crear una tarea de ejemplo si no existe ninguna
      if (this.taskCount() === 0) {
        await this.createSampleTask();
      } else {
        // Obtener una tarea existente para mostrar
        const tasks = this.taskService.tasks();
        if (tasks.length > 0) {
          this.sampleTask.set(tasks[0]);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
    }
  }
  
  private async createSampleTask(): Promise<void> {
    if (!this.taskService) return;
    
    try {
      const sampleTaskData: Omit<ITaskData, 'id'> = {
        title: `Tarea de ejemplo - ${this.name}`,
        description: 'Esta es una tarea creada automáticamente para demostrar el ORM de IndexedDB',
        status: TaskStatus.PENDING,
        priority: 1,
        tags: ['ejemplo', 'angular-elements', 'indexeddb'],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
      };
      
      const task = await this.taskService.createTask(sampleTaskData);
      this.sampleTask.set(task);
      this.taskCount.set(this.taskService.statistics()?.total || 1);
      
      console.log('✨ Sample task created:', task);
    } catch (error) {
      console.error('❌ Failed to create sample task:', error);
    }
  }

  // 🎯 MÉTODOS DE INTERACCIÓN

  onClick(): void {
    // Actualizar el signal de forma reactiva
    this.clickCount.update(count => count + 1);
    
    const currentCount = this.clickCount();
    console.log(`🎯 Button clicked! Count: ${currentCount}`);
    console.log(`📊 Display info: ${this.displayInfo()}`);
    
    // Crear nueva tarea cada 3 clicks
    if (currentCount % 3 === 0 && this.taskService) {
      this.createClickTask(currentCount);
    }
    
    // Emitir evento personalizado
    const customEvent = new CustomEvent('elementClicked', {
      detail: {
        name: this.name,
        message: this.message,
        clickCount: currentCount,
        taskCount: this.taskCount(),
        timestamp: new Date().toISOString(),
        signalsActive: true,
        zoneless: true,
        ormActive: this.tasksLoaded()
      },
      bubbles: true
    });
    
    // Despachar el evento desde el elemento host
    if (typeof window !== 'undefined') {
      const hostElement = document.querySelector('my-custom-element');
      if (hostElement) {
        hostElement.dispatchEvent(customEvent);
      }
    }
  }
  
  async createClickTask(clickNumber: number): Promise<void> {
    if (!this.taskService) return;
    
    try {
      const taskData: Omit<ITaskData, 'id'> = {
        title: `Tarea del Click #${clickNumber}`,
        description: `Tarea creada automáticamente después del click número ${clickNumber}`,
        status: TaskStatus.PENDING,
        priority: Math.min(Math.floor(clickNumber / 3), 5),
        tags: ['auto-generated', `click-${clickNumber}`]
      };
      
      const task = await this.taskService.createTask(taskData);
      this.taskCount.set(this.taskService.statistics()?.total || 0);
      
      console.log(`🆕 New task created on click ${clickNumber}:`, task);
    } catch (error) {
      console.error('❌ Failed to create click task:', error);
    }
  }
  
  async onCompleteTask(): Promise<void> {
    if (!this.taskService || !this.sampleTask()) return;
    
    try {
      const task = this.sampleTask()!;
      await this.taskService.completeTask(task.id!, 'user-demo');
      
      // Actualizar la tarea mostrada
      const updatedTask = await this.taskService.getTask(task.id!);
      this.sampleTask.set(updatedTask);
      
      console.log('✅ Task completed:', updatedTask);
    } catch (error) {
      console.error('❌ Failed to complete task:', error);
    }
  }
}