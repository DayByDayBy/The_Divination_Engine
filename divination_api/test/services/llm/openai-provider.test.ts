import { OpenAiProvider } from '@/services/llm/openai-provider';
import { LlmTimeoutError, LlmProviderError, LlmRateLimitError } from '@/services/llm/types';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('OpenAiProvider', () => {
  const provider = new OpenAiProvider({
    apiKey: 'test-api-key',
    model: 'gpt-4o-mini',
    timeoutMs: 5000,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('implements LlmService interface', () => {
    expect(typeof provider.generateInterpretation).toBe('function');
  });

  it('returns interpretation text on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'The cards suggest great fortune.' } }],
      }),
    });

    const result = await provider.generateInterpretation('test prompt');
    expect(result).toBe('The cards suggest great fortune.');
  });

  it('sends correct request to OpenAI API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'interpretation' } }],
      }),
    });

    await provider.generateInterpretation('my prompt');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        }),
      })
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.model).toBe('gpt-4o-mini');
    expect(callBody.messages[0].content).toBe('my prompt');
  });

  it('throws LlmTimeoutError on timeout', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    await expect(provider.generateInterpretation('test')).rejects.toThrow(LlmTimeoutError);
  });

  it('throws LlmRateLimitError on 429', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(provider.generateInterpretation('test')).rejects.toThrow(LlmRateLimitError);
  });

  it('throws LlmProviderError on other API errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(provider.generateInterpretation('test')).rejects.toThrow(LlmProviderError);
  });

  it('throws LlmProviderError on malformed response shape', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [] }),
    });

    await expect(provider.generateInterpretation('test')).rejects.toThrow(
      'OpenAI returned unexpected response shape'
    );
    await expect(provider.generateInterpretation('test')).rejects.toThrow(LlmProviderError);
  });

  it('throws LlmProviderError when content is null', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: null } }],
      }),
    });

    await expect(provider.generateInterpretation('test')).rejects.toThrow(LlmProviderError);
  });
});
