/**
 * 📋 TaskService - Capa de lógica de negocio para tareas
 * 
 * Principios SOLID aplicados:
 * - S: Responsabilidad única - Lógica de negocio para tareas
 * - D: Dependency Inversion - Depende de abstracciones (IRepository)
 */

import { Injectable, computed, signal } from '@angular/core';
import { Task, TaskStatus, ITaskData } from '../models/Task.entity';
import { TaskRepository, ITaskStatistics, ITaskQueryOptions } from '../repositories/TaskRepository';
import { IDbContext } from '../context/IDbContext';
import { IPaginatedResult } from '../repositories/IRepository';

/**
 * 📊 Estado reactivo de las tareas
 */
export interface ITaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  statistics: ITaskStatistics | null;
}

/**
 * 📋 Servicio para gestión de tareas con Angular Signals
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private repository: TaskRepository;
  
  // 🔄 Estado reactivo usando Angular Signals
  private readonly _state = signal<ITaskState>({
    tasks: [],
    loading: false,
    error: null,
    statistics: null
  });

  // 📊 Computed signals para derivar estado
  public readonly tasks = computed(() => this._state().tasks);
  public readonly loading = computed(() => this._state().loading);
  public readonly error = computed(() => this._state().error);
  public readonly statistics = computed(() => this._state().statistics);
  
  // Filtros computados específicos
  public readonly pendingTasks = computed(() => 
    this.tasks().filter(task => task.status === TaskStatus.PENDING)
  );
  
  public readonly completedTasks = computed(() => 
    this.tasks().filter(task => task.status === TaskStatus.COMPLETED)
  );
  
  public readonly overdueTasks = computed(() => 
    this.tasks().filter(task => task.isOverdue())
  );
  
  public readonly highPriorityTasks = computed(() => 
    this.tasks().filter(task => task.priority >= 4)
  );

  constructor() {
    // TODO: Implementar inyección de dependencias adecuada
    // Por ahora, inicializaremos el repositorio después de crear el contexto
    this.repository = null as any; // Se inicializará en initialize()
  }

  // 🚀 INICIALIZACIÓN

  /**
   * Inicializa el servicio y carga las tareas
   */
  async initialize(): Promise<void> {
    try {
      this.setLoading(true);
      await this.loadAllTasks();
      await this.loadStatistics();
    } catch (error) {
      this.setError(`Failed to initialize TaskService: ${error}`);
    } finally {
      this.setLoading(false);
    }
  }

  // ✨ OPERACIONES CRUD

  /**
   * Crea una nueva tarea
   */
  async createTask(taskData: Omit<ITaskData, 'id'>): Promise<Task> {
    try {
      this.setLoading(true);
      this.clearError();
      
      // Crear instancia de Task desde los datos
      const task = new Task(taskData);
      const createdTask = await this.repository.create(task);
      
      // Actualizar estado reactivo
      this.updateTasksInState(tasks => [...tasks, createdTask]);
      await this.loadStatistics();
      
      return createdTask;
    } catch (error) {
      this.setError(`Failed to create task: ${error}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Actualiza una tarea existente
   */
  async updateTask(id: string, updates: Partial<ITaskData>): Promise<Task | null> {
    try {
      this.setLoading(true);
      this.clearError();
      
      const updatedTask = await this.repository.update(id, updates);
      
      if (updatedTask) {
        // Actualizar estado reactivo
        this.updateTasksInState(tasks => 
          tasks.map(task => task.id === id ? updatedTask : task)
        );
        await this.loadStatistics();
      }
      
      return updatedTask;
    } catch (error) {
      this.setError(`Failed to update task: ${error}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Elimina una tarea
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();
      
      const success = await this.repository.delete(id);
      
      if (success) {
        // Actualizar estado reactivo
        this.updateTasksInState(tasks => 
          tasks.filter(task => task.id !== id)
        );
        await this.loadStatistics();
      }
      
      return success;
    } catch (error) {
      this.setError(`Failed to delete task: ${error}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Obtiene una tarea por ID
   */
  async getTask(id: string): Promise<Task | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      this.setError(`Failed to get task: ${error}`);
      return null;
    }
  }

  // 📋 OPERACIONES DE NEGOCIO

  /**
   * Marca una tarea como completada
   */
  async completeTask(id: string, userId: string): Promise<Task | null> {
    try {
      const task = await this.repository.findById(id);
      if (!task) return null;

      task.markAsCompleted(userId);
      const updatedTask = await this.repository.save(task);
      
      // Actualizar estado reactivo
      this.updateTasksInState(tasks => 
        tasks.map(t => t.id === id ? updatedTask : t)
      );
      await this.loadStatistics();
      
      return updatedTask;
    } catch (error) {
      this.setError(`Failed to complete task: ${error}`);
      throw error;
    }
  }

  /**
   * Asigna una tarea a un usuario
   */
  async assignTask(id: string, assignedTo: string, assignedBy: string): Promise<Task | null> {
    try {
      const task = await this.repository.findById(id);
      if (!task) return null;

      task.assignTo(assignedTo, assignedBy);
      const updatedTask = await this.repository.save(task);
      
      // Actualizar estado reactivo
      this.updateTasksInState(tasks => 
        tasks.map(t => t.id === id ? updatedTask : t)
      );
      
      return updatedTask;
    } catch (error) {
      this.setError(`Failed to assign task: ${error}`);
      throw error;
    }
  }

  /**
   * Cambia la prioridad de una tarea
   */
  async changePriority(id: string, priority: number, userId: string): Promise<Task | null> {
    try {
      const task = await this.repository.findById(id);
      if (!task) return null;

      task.changePriority(priority, userId);
      const updatedTask = await this.repository.save(task);
      
      // Actualizar estado reactivo
      this.updateTasksInState(tasks => 
        tasks.map(t => t.id === id ? updatedTask : t)
      );
      
      return updatedTask;
    } catch (error) {
      this.setError(`Failed to change task priority: ${error}`);
      throw error;
    }
  }

  // 🔍 CONSULTAS Y FILTROS

  /**
   * Carga todas las tareas
   */
  async loadAllTasks(): Promise<void> {
    try {
      const tasks = await this.repository.findAll();
      this.setTasks(tasks);
    } catch (error) {
      this.setError(`Failed to load tasks: ${error}`);
    }
  }

  /**
   * Filtra tareas por estado
   */
  async filterByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const tasks = await this.repository.findByStatus(status);
      this.setTasks(tasks);
      return tasks;
    } catch (error) {
      this.setError(`Failed to filter by status: ${error}`);
      return [];
    }
  }

  /**
   * Filtra tareas por usuario asignado
   */
  async filterByUser(userId: string): Promise<Task[]> {
    try {
      const tasks = await this.repository.findByAssignedUser(userId);
      this.setTasks(tasks);
      return tasks;
    } catch (error) {
      this.setError(`Failed to filter by user: ${error}`);
      return [];
    }
  }

  /**
   * Busca tareas por texto
   */
  async searchTasks(searchText: string): Promise<Task[]> {
    try {
      const tasks = await this.repository.searchByText(searchText);
      this.setTasks(tasks);
      return tasks;
    } catch (error) {
      this.setError(`Failed to search tasks: ${error}`);
      return [];
    }
  }

  /**
   * Obtiene tareas con paginación
   */
  async getTasksPaginated(
    page: number, 
    pageSize: number, 
    options?: ITaskQueryOptions
  ): Promise<IPaginatedResult<Task>> {
    try {
      return await this.repository.findTasksPaginated(page, pageSize, options);
    } catch (error) {
      this.setError(`Failed to get paginated tasks: ${error}`);
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      };
    }
  }

  // 📊 ESTADÍSTICAS Y ANALYTICS

  /**
   * Carga estadísticas de tareas
   */
  async loadStatistics(): Promise<void> {
    try {
      const stats = await this.repository.getStatistics();
      this.setStatistics(stats);
    } catch (error) {
      this.setError(`Failed to load statistics: ${error}`);
    }
  }

  /**
   * Obtiene todas las etiquetas disponibles
   */
  async getAllTags(): Promise<string[]> {
    try {
      return await this.repository.getAllTags();
    } catch (error) {
      this.setError(`Failed to get tags: ${error}`);
      return [];
    }
  }

  /**
   * Obtiene todos los usuarios asignados
   */
  async getAllAssignedUsers(): Promise<string[]> {
    try {
      return await this.repository.getAllAssignedUsers();
    } catch (error) {
      this.setError(`Failed to get assigned users: ${error}`);
      return [];
    }
  }

  // 🔄 OPERACIONES BATCH

  /**
   * Completa múltiples tareas
   */
  async completeMultipleTasks(taskIds: string[], userId: string): Promise<Task[]> {
    try {
      this.setLoading(true);
      const updatedTasks = await this.repository.markMultipleAsCompleted(taskIds, userId);
      
      // Actualizar estado reactivo
      this.updateTasksInState(tasks => 
        tasks.map(task => {
          const updated = updatedTasks.find(ut => ut.id === task.id);
          return updated || task;
        })
      );
      
      await this.loadStatistics();
      return updatedTasks;
    } catch (error) {
      this.setError(`Failed to complete multiple tasks: ${error}`);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  // 🛠️ MÉTODOS PRIVADOS PARA GESTIÓN DE ESTADO

  private setTasks(tasks: Task[]): void {
    this._state.update(state => ({ ...state, tasks }));
  }

  private setLoading(loading: boolean): void {
    this._state.update(state => ({ ...state, loading }));
  }

  private setError(error: string): void {
    this._state.update(state => ({ ...state, error }));
  }

  private clearError(): void {
    this._state.update(state => ({ ...state, error: null }));
  }

  private setStatistics(statistics: ITaskStatistics): void {
    this._state.update(state => ({ ...state, statistics }));
  }

  private updateTasksInState(updater: (tasks: Task[]) => Task[]): void {
    this._state.update(state => ({ 
      ...state, 
      tasks: updater(state.tasks) 
    }));
  }

  // 🔧 UTILIDADES PÚBLICAS

  /**
   * Refresca completamente el estado
   */
  async refresh(): Promise<void> {
    await this.initialize();
  }

  /**
   * Limpia el estado
   */
  reset(): void {
    this._state.set({
      tasks: [],
      loading: false,
      error: null,
      statistics: null
    });
  }
}