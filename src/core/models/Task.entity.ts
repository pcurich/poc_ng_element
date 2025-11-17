/**
 * 📝 Task Entity - Ejemplo de uso del ORM
 * 
 * Demostración de cómo crear una entidad específica usando las clases base
 */

import { AuditableEntity } from '../models/BaseEntity';
import { IEntityMetadata, IPropertyMetadata } from './interfaces';

/**
 * 📋 Enumeración para el estado de las tareas
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * 📝 Interfaz para los datos de una tarea
 */
export interface ITaskData {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  dueDate?: Date;
  tags?: string[];
  assignedTo?: string;
}

/**
 * 📝 Entidad Task con auditoría completa
 */
export class Task extends AuditableEntity<string> implements ITaskData {
  public title!: string;
  public description?: string;
  public status: TaskStatus = TaskStatus.PENDING;
  public priority: number = 1;
  public dueDate?: Date;
  public tags?: string[] = [];
  public assignedTo?: string;

  constructor(data?: Partial<Task>) {
    super(data);
    
    // Aplicar valores por defecto si no se proporcionan
    if (data) {
      this.title = data.title || '';
      this.description = data.description;
      this.status = data.status || TaskStatus.PENDING;
      this.priority = data.priority || 1;
      this.dueDate = data.dueDate;
      this.tags = data.tags || [];
      this.assignedTo = data.assignedTo;
    }
  }

  /**
   * Obtiene los metadatos de la entidad Task
   */
  public getMetadata(): IEntityMetadata {
    return {
      tableName: 'tasks',
      primaryKey: 'id',
      properties: this.getPropertyMetadata(),
      indexes: ['status', 'priority', 'assignedTo', 'dueDate']
    };
  }

  /**
   * Obtiene los metadatos de las propiedades
   */
  private getPropertyMetadata(): IPropertyMetadata[] {
    return [
      {
        name: 'id',
        type: 'string',
        required: false,
        primaryKey: true
      },
      {
        name: 'title',
        type: 'string',
        required: true,
        maxLength: 200
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        maxLength: 1000
      },
      {
        name: 'status',
        type: 'string',
        required: true,
        enumValues: Object.values(TaskStatus)
      },
      {
        name: 'priority',
        type: 'number',
        required: true,
        min: 1,
        max: 5
      },
      {
        name: 'dueDate',
        type: 'date',
        required: false
      },
      {
        name: 'tags',
        type: 'array',
        required: false
      },
      {
        name: 'assignedTo',
        type: 'string',
        required: false
      }
    ];
  }

  /**
   * Validación específica para Task
   */
  public override validate(): { isValid: boolean; errors: string[] } {
    const baseValidation = super.validate();
    const errors = [...baseValidation.errors];

    // Validaciones específicas de Task
    if (!this.title || this.title.trim().length === 0) {
      errors.push('Title is required and cannot be empty');
    }

    if (this.title && this.title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    if (this.description && this.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }

    if (this.priority < 1 || this.priority > 5) {
      errors.push('Priority must be between 1 and 5');
    }

    if (this.dueDate && this.dueDate < new Date()) {
      errors.push('Due date cannot be in the past');
    }

    if (!Object.values(TaskStatus).includes(this.status)) {
      errors.push('Invalid task status');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Marca la tarea como completada
   */
  public markAsCompleted(userId: string): void {
    this.status = TaskStatus.COMPLETED;
    this.updateWithAudit(userId);
  }

  /**
   * Cambia la prioridad de la tarea
   */
  public changePriority(newPriority: number, userId: string): void {
    if (newPriority < 1 || newPriority > 5) {
      throw new Error('Priority must be between 1 and 5');
    }
    
    this.priority = newPriority;
    this.updateWithAudit(userId);
  }

  /**
   * Asigna la tarea a un usuario
   */
  public assignTo(userId: string, assignedBy: string): void {
    this.assignedTo = userId;
    this.updateWithAudit(assignedBy);
  }

  /**
   * Añade tags a la tarea
   */
  public addTags(newTags: string[], userId: string): void {
    this.tags = [...(this.tags || []), ...newTags];
    this.updateWithAudit(userId);
  }

  /**
   * Elimina tags de la tarea
   */
  public removeTags(tagsToRemove: string[], userId: string): void {
    this.tags = this.tags?.filter(tag => !tagsToRemove.includes(tag)) || [];
    this.updateWithAudit(userId);
  }

  /**
   * Verifica si la tarea está vencida
   */
  public isOverdue(): boolean {
    return this.dueDate ? this.dueDate < new Date() && this.status !== TaskStatus.COMPLETED : false;
  }

  /**
   * Obtiene una representación amigable del estado
   */
  public getStatusDisplay(): string {
    const statusMap = {
      [TaskStatus.PENDING]: 'Pendiente',
      [TaskStatus.IN_PROGRESS]: 'En Progreso',
      [TaskStatus.COMPLETED]: 'Completada',
      [TaskStatus.CANCELLED]: 'Cancelada'
    };
    
    return statusMap[this.status] || this.status;
  }

  /**
   * Serialización personalizada para IndexedDB
   */
  public override toPlainObject(): Record<string, any> {
    const obj = super.toPlainObject();
    return {
      ...obj,
      // Asegurar que los arrays no sean undefined
      tags: this.tags || []
    };
  }


}