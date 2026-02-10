package com.divinationengine.divination.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Service
public class OpenAiLlmService implements LlmService {
    
    private final WebClient webClient;
    private final String apiKey;
    private final String model;
    private final Duration timeout;
    
    public OpenAiLlmService(@Value("${OPENAI_API_KEY:}") String apiKey,
                           @Value("${LLM_MODEL:gpt-3.5-turbo}") String model,
                           @Value("${LLM_TIMEOUT_MS:5000}") Long timeoutMs) {
        this.apiKey = apiKey;
        this.model = model;
        this.timeout = Duration.ofMillis(timeoutMs);
        
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
    
    @Override
    public String generateInterpretation(String prompt) throws LlmServiceException {
        if (apiKey == null || apiKey.isBlank()) {
            throw new LlmServiceException("OPENAI_API_KEY is not configured");
        }
        try {
            Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", new Object[]{
                    Map.of("role", "system", "content", "You are a knowledgeable tarot reader providing insightful, reflective interpretations. Focus on symbolism and personal growth rather than deterministic predictions."),
                    Map.of("role", "user", "content", prompt)
                },
                "max_tokens", 500,
                "temperature", 0.7
            );
            
            Mono<String> response = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .map(json -> {
                        JsonNode contentNode = json.path("choices").path(0).path("message").path("content");
                        if (contentNode.isMissingNode() || contentNode.isNull()) {
                            throw new LlmServiceException("OpenAI response missing choices[0].message.content");
                        }
                        return contentNode.asText();
                    })
                    .timeout(timeout);
            
            return response.block();
        } catch (Exception e) {
            throw new LlmServiceException("Failed to generate interpretation: " + e.getMessage(), e);
        }
    }
}
