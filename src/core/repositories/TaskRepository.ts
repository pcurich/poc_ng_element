/**
 * 📋 TaskRepository - Repositorio específico para entidades Task
 * 
 * Extiende BaseRepository con operaciones específicas para tareas
 * Implementa SOLID principles y operaciones de negocio específicas
 */

import { BaseRepository } from './BaseRepository';
import { Task, TaskStatus } from '../models/Task.entity';
import { IDbContext } from '../context/IDbContext';
import { IQueryOptions, IPaginatedResult } from './IRepository';

/**
 * 📊 Opciones específicas de consulta para tareas
 */
export interface ITaskQueryOptions extends IQueryOptions<Task> {
  status?: TaskStatus;
  assignedTo?: string;
  priority?: number;
  overdue?: boolean;
  hasTag?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * 📈 Estadísticas de tareas
 */
export interface ITaskStatistics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  overdue: number;
  dueToday: number;
  dueTomorrow: number;
  byPriority: Record<number, number>;
  averageCompletionTime?: number; // en días
}

/**
 * 📋 Repositorio para entidades Task con operaciones específicas
 */
export class TaskRepository extends BaseRepository<Task, string> {
  
  constructor(dbContext: IDbContext) {
    super(dbContext, Task, 'tasks');
  }

  // 🔍 CONSULTAS ESPECÍFICAS DE TAREAS

  /**
   * Busca tareas por estado
   */
  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.findMany({
      filter: { status }
    });
  }

  /**
   * Busca tareas asignadas a un usuario específico
   */
  async findByAssignedUser(userId: string): Promise<Task[]> {
    return this.findMany({
      filter: { assignedTo: userId }
    });
  }

  /**
   * Busca tareas por prioridad
   */
  async findByPriority(priority: number): Promise<Task[]> {
    return this.findMany({
      filter: { priority },
      sortBy: 'dueDate',
      sortDirection: 'asc'
    });
  }

  /**
   * Busca tareas vencidas
   */
  async findOverdue(): Promise<Task[]> {
    return this.findMany({
      filter: (task: Task) => task.isOverdue()
    });
  }

  /**
   * Busca tareas que vencen hoy
   */
  async findDueToday(): Promise<Task[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.findMany({
      filter: (task: Task) => {
        if (!task.dueDate) return false;
        return task.dueDate >= startOfDay && task.dueDate <= endOfDay;
      }
    });
  }

  /**
   * Busca tareas que vencen mañana
   */
  async findDueTomorrow(): Promise<Task[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const endOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

    return this.findMany({
      filter: (task: Task) => {
        if (!task.dueDate) return false;
        return task.dueDate >= startOfDay && task.dueDate <= endOfDay;
      }
    });
  }

  /**
   * Busca tareas por tag
   */
  async findByTag(tag: string): Promise<Task[]> {
    return this.findMany({
      filter: (task: Task) => task.tags?.includes(tag) || false
    });
  }

  /**
   * Busca tareas en un rango de fechas
   */
  async findInDateRange(start: Date, end: Date): Promise<Task[]> {
    return this.findMany({
      filter: (task: Task) => {
        if (!task.dueDate) return false;
        return task.dueDate >= start && task.dueDate <= end;
      },
      sortBy: 'dueDate',
      sortDirection: 'asc'
    });
  }

  /**
   * Consulta avanzada con opciones específicas de tareas
   */
  async findWithTaskOptions(options: ITaskQueryOptions): Promise<Task[]> {
    let baseFilter = options.filter;

    // Construir filtro combinado
    const combinedFilter = (task: Task): boolean => {
      // Aplicar filtro base si existe
      if (baseFilter && typeof baseFilter === 'function' && !baseFilter(task)) {
        return false;
      } else if (baseFilter && typeof baseFilter === 'object') {
        for (const [key, value] of Object.entries(baseFilter)) {
          if ((task as any)[key] !== value) {
            return false;
          }
        }
      }

      // Filtros específicos de tareas
      if (options.status && task.status !== options.status) {
        return false;
      }

      if (options.assignedTo && task.assignedTo !== options.assignedTo) {
        return false;
      }

      if (options.priority && task.priority !== options.priority) {
        return false;
      }

      if (options.overdue !== undefined && task.isOverdue() !== options.overdue) {
        return false;
      }

      if (options.hasTag && !task.tags?.includes(options.hasTag)) {
        return false;
      }

      if (options.dateRange && task.dueDate) {
        const { start, end } = options.dateRange;
        if (task.dueDate < start || task.dueDate > end) {
          return false;
        }
      }

      return true;
    };

    return this.findMany({
      ...options,
      filter: combinedFilter
    });
  }

  // 📊 ESTADÍSTICAS Y ANALYTICS

  /**
   * Obtiene estadísticas generales de tareas
   */
  async getStatistics(): Promise<ITaskStatistics> {
    const allTasks = await this.findAll();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats: ITaskStatistics = {
      total: allTasks.length,
      byStatus: {
        [TaskStatus.PENDING]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.CANCELLED]: 0
      },
      overdue: 0,
      dueToday: 0,
      dueTomorrow: 0,
      byPriority: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    for (const task of allTasks) {
      // Contar por estado
      stats.byStatus[task.status]++;

      // Contar por prioridad
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;

      // Contar vencidas
      if (task.isOverdue()) {
        stats.overdue++;
      }

      // Contar que vencen hoy
      if (task.dueDate && task.dueDate >= today && task.dueDate < tomorrow) {
        stats.dueToday++;
      }

      // Contar que vencen mañana
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      if (task.dueDate && task.dueDate >= tomorrow && task.dueDate < dayAfterTomorrow) {
        stats.dueTomorrow++;
      }
    }

    return stats;
  }

  /**
   * Obtiene todas las etiquetas únicas
   */
  async getAllTags(): Promise<string[]> {
    const allTasks = await this.findAll();
    const tagsSet = new Set<string>();

    allTasks.forEach(task => {
      task.tags?.forEach(tag => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  }

  /**
   * Obtiene todos los usuarios asignados únicos
   */
  async getAllAssignedUsers(): Promise<string[]> {
    const allTasks = await this.findAll();
    const usersSet = new Set<string>();

    allTasks.forEach(task => {
      if (task.assignedTo) {
        usersSet.add(task.assignedTo);
      }
    });

    return Array.from(usersSet).sort();
  }

  // 🔄 OPERACIONES BATCH

  /**
   * Marca múltiples tareas como completadas
   */
  async markMultipleAsCompleted(taskIds: string[], userId: string): Promise<Task[]> {
    const updatedTasks: Task[] = [];

    for (const taskId of taskIds) {
      const task = await this.findById(taskId);
      if (task) {
        task.markAsCompleted(userId);
        const updated = await this.save(task);
        updatedTasks.push(updated);
      }
    }

    return updatedTasks;
  }

  /**
   * Asigna múltiples tareas a un usuario
   */
  async assignMultipleTasks(taskIds: string[], assignedTo: string, assignedBy: string): Promise<Task[]> {
    const updatedTasks: Task[] = [];

    for (const taskId of taskIds) {
      const task = await this.findById(taskId);
      if (task) {
        task.assignTo(assignedTo, assignedBy);
        const updated = await this.save(task);
        updatedTasks.push(updated);
      }
    }

    return updatedTasks;
  }

  /**
   * Actualiza la prioridad de múltiples tareas
   */
  async updateMultiplePriorities(taskIds: string[], newPriority: number, userId: string): Promise<Task[]> {
    const updatedTasks: Task[] = [];

    for (const taskId of taskIds) {
      const task = await this.findById(taskId);
      if (task) {
        task.changePriority(newPriority, userId);
        const updated = await this.save(task);
        updatedTasks.push(updated);
      }
    }

    return updatedTasks;
  }

  // 📋 OPERACIONES DE BÚSQUEDA AVANZADA

  /**
   * Busca tareas por texto en título o descripción
   */
  async searchByText(searchText: string): Promise<Task[]> {
    const searchLower = searchText.toLowerCase();
    
    return this.findMany({
      filter: (task: Task) => {
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descriptionMatch = task.description?.toLowerCase().includes(searchLower) || false;
        return titleMatch || descriptionMatch;
      }
    });
  }

  /**
   * Obtiene tareas paginadas con filtros avanzados
   */
  async findTasksPaginated(
    page: number,
    pageSize: number,
    options?: ITaskQueryOptions
  ): Promise<IPaginatedResult<Task>> {
    // Si hay opciones específicas de tareas, usamos findWithTaskOptions primero
    if (options && (options.status || options.assignedTo || options.priority || options.overdue !== undefined || options.hasTag || options.dateRange)) {
      const filteredTasks = await this.findWithTaskOptions(options);
      
      // Aplicar paginación manual
      const offset = (page - 1) * pageSize;
      const items = filteredTasks.slice(offset, offset + pageSize);
      const total = filteredTasks.length;
      const totalPages = Math.ceil(total / pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      };
    }

    // Usar paginación estándar del BaseRepository
    return this.findPaginated(page, pageSize, options);
  }
}