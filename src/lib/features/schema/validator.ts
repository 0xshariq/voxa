// SchemaValidator for request/response validation
// Removed unused VoxaConfig import

export interface SchemaValidatorConfig {
    enabled?: boolean;
    requestSchema?: any; // Zod/Yup schema
    responseSchema?: any; // Zod/Yup schema
    library?: 'zod' | 'yup';
}

export class SchemaValidator {
    private config: SchemaValidatorConfig;
    private zod?: any;
    private yup?: any;

    constructor(config: SchemaValidatorConfig = {}) {
        this.config = config;
        if (config.library === 'zod') {
            try { this.zod = require('zod'); } catch {}
        }
        if (config.library === 'yup') {
            try { this.yup = require('yup'); } catch {}
        }
    }

    validateRequest(data: any) {
        if (!this.config.enabled || !this.config.requestSchema) return true;
        if (this.config.library === 'zod' && this.zod) {
            return this.config.requestSchema.safeParse(data).success;
        }
        if (this.config.library === 'yup' && this.yup) {
            try {
                this.config.requestSchema.validateSync(data);
                return true;
            } catch {
                return false;
            }
        }
        return true;
    }

    validateResponse(data: any) {
        if (!this.config.enabled || !this.config.responseSchema) return true;
        if (this.config.library === 'zod' && this.zod) {
            return this.config.responseSchema.safeParse(data).success;
        }
        if (this.config.library === 'yup' && this.yup) {
            try {
                this.config.responseSchema.validateSync(data);
                return true;
            } catch {
                return false;
            }
        }
        return true;
    }
}
