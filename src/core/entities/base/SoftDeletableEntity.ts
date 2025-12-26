import { BaseEntity } from "./BaseEntity";

export abstract class SoftDeletableEntity<TKey = string> extends BaseEntity<TKey> {
    public deletedAt?: Date;
    public isDeleted?: boolean = false;

    constructor(data?: Partial<SoftDeletableEntity<TKey>>) {
        super(data);
    }

    public softDelete(): void {
        this.isDeleted = true;
        this.deletedAt = new Date();
        this.touch();
    }

    public restore(): void {
        this.isDeleted = false;
        this.deletedAt = undefined;
        this.touch();
    }

    public isEntityDeleted(): boolean {
        return this.isDeleted === true;
    }

    public override validate(): { isValid: boolean; errors: string[] } {
        const baseValidation = super.validate();
        const errors = [...baseValidation.errors];

        if (this.isDeleted && !this.deletedAt) {
            errors.push('deletedAt is required when isDeleted is true');
        }

        if (!this.isDeleted && this.deletedAt) {
            errors.push('deletedAt should not be set when isDeleted is false');
        }

        return { isValid: errors.length === 0, errors };
    }

    public override toPlainObject(): Record<string, any> {
        const obj = super.toPlainObject();
        return { ...obj, isDeleted: this.isDeleted || false };
    }
}