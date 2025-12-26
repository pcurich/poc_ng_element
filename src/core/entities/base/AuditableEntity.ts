import { IAuditableEntity } from "../../types/entity.types";
import { SoftDeletableEntity } from "./SoftDeletableEntity";

export abstract class AuditableEntity<TKey = string> extends SoftDeletableEntity<TKey> implements IAuditableEntity<TKey> {
    public version?: number = 1;
    public createdBy?: string;
    public updatedBy?: string;
    public deletedBy?: string;

    constructor(data?: Partial<AuditableEntity<TKey>>) {
        super(data);
    }

    public updateWithAudit(updatedBy: string): void {
        this.updatedBy = updatedBy;
        this.version = (this.version || 1) + 1;
        this.touch();
    }

    public softDeleteWithAudit(deletedBy: string): void {
        this.deletedBy = deletedBy;
        this.softDelete();
    }

    public override validate(): { isValid: boolean; errors: string[] } {
        const baseValidation = super.validate();
        const errors = [...baseValidation.errors];

        // Validaciones de auditoría
        if (this.version !== undefined && this.version < 1) {
            errors.push('version must be >= 1');
        }

        if (this.isDeleted && !this.deletedBy) {
            errors.push('deletedBy is required when entity is soft deleted');
        }

        return { isValid: errors.length === 0, errors };
    }
}