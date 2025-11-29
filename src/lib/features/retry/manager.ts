
export interface RetryConfig {
	count?: number;
	delay?: number;
	exponentialBackoff?: boolean;
	maxRetry?: number;
	statusCodes?: number[];
}

export class RetryManager {
	private config: RetryConfig;

	constructor(config: RetryConfig = {}) {
		this.config = config;
	}

	getRetryConfig(override?: RetryConfig): Required<RetryConfig> {
		const merged = { ...this.config, ...override };
		return {
			count: Math.min(merged.count ?? 5, 5),
			delay: merged.delay ?? 1000,
			exponentialBackoff: merged.exponentialBackoff ?? true,
			maxRetry: merged.maxRetry ?? 30000,
			statusCodes: merged.statusCodes ?? [429, 500, 502, 503, 504]
		};
	}

	shouldRetryStatus(statusCode: number, statusCodes?: number[]): boolean {
		const codesToCheck = statusCodes ?? [429, 500, 502, 503, 504];
		return codesToCheck.includes(statusCode);
	}

	calculateRetryDelay(attempt: number, delay: number = 1000, exponentialBackoff: boolean = true, maxRetry: number = 30000): number {
		let waitTime: number;
		if (exponentialBackoff) {
			waitTime = delay * Math.pow(2, attempt);
		} else {
			waitTime = delay;
		}
		return Math.min(waitTime, maxRetry);
	}

	async sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}