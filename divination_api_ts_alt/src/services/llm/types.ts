export interface LlmService {
  generateInterpretation(prompt: string): Promise<string>;
}

export interface LlmConfig {
  timeoutMs: number;
  maxRetries: number;
  provider: string;
}

export class LlmTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmTimeoutError';
  }
}

export class LlmRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmRateLimitError';
  }
}

export class LlmProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmProviderError';
  }
}
