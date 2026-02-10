import {
  LlmService,
  LlmConfig,
  LlmTimeoutError,
  LlmRateLimitError,
  LlmProviderError,
} from '@/services/llm/types';

describe('LLM Service Interface', () => {
  describe('LlmService interface', () => {
    it('can be implemented with generateInterpretation method', () => {
      const mockService: LlmService = {
        generateInterpretation: jest.fn().mockResolvedValue('interpretation text'),
      };

      expect(mockService.generateInterpretation).toBeDefined();
      expect(typeof mockService.generateInterpretation).toBe('function');
    });

    it('generateInterpretation returns a Promise<string>', async () => {
      const mockService: LlmService = {
        generateInterpretation: jest.fn().mockResolvedValue('The cards suggest...'),
      };

      const result = await mockService.generateInterpretation('test prompt');
      expect(typeof result).toBe('string');
    });
  });

  describe('LlmConfig', () => {
    it('includes timeout configuration', () => {
      const config: LlmConfig = {
        timeoutMs: 5000,
        maxRetries: 3,
        provider: 'openai',
      };

      expect(config.timeoutMs).toBe(5000);
      expect(config.maxRetries).toBe(3);
      expect(config.provider).toBe('openai');
    });
  });

  describe('Error types', () => {
    it('LlmTimeoutError has correct properties', () => {
      const error = new LlmTimeoutError('Request timed out after 5000ms');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('LlmTimeoutError');
      expect(error.message).toBe('Request timed out after 5000ms');
    });

    it('LlmRateLimitError has correct properties', () => {
      const error = new LlmRateLimitError('Provider rate limit exceeded');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('LlmRateLimitError');
      expect(error.message).toBe('Provider rate limit exceeded');
    });

    it('LlmProviderError has correct properties', () => {
      const error = new LlmProviderError('Provider returned 500');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('LlmProviderError');
      expect(error.message).toBe('Provider returned 500');
    });
  });
});
