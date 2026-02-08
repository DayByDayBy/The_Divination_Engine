import { LlmService, LlmTimeoutError, LlmRateLimitError, LlmProviderError } from './types';

export interface OpenAiProviderConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export class OpenAiProvider implements LlmService {
  private readonly config: OpenAiProviderConfig;

  constructor(config: OpenAiProviderConfig) {
    this.config = config;
  }

  async generateInterpretation(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new LlmRateLimitError(`OpenAI rate limit exceeded: ${response.statusText}`);
        }
        throw new LlmProviderError(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (
        !data ||
        typeof data !== 'object' ||
        !Array.isArray(data.choices) ||
        data.choices.length === 0 ||
        !data.choices[0]?.message ||
        typeof data.choices[0].message.content !== 'string'
      ) {
        throw new LlmProviderError('OpenAI returned unexpected response shape');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof LlmRateLimitError || error instanceof LlmProviderError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LlmTimeoutError(`Request timed out after ${this.config.timeoutMs}ms`);
      }
      throw new LlmProviderError(`OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
