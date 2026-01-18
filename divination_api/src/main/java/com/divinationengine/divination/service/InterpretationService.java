package com.divinationengine.divination.service;

import com.divinationengine.divination.dto.InterpretRequest;
import com.divinationengine.divination.dto.InterpretResponse;
import com.divinationengine.divination.exception.LlmGenerationException;
import com.divinationengine.divination.exception.ResourceNotFoundException;
import com.divinationengine.divination.models.Reading;
import com.divinationengine.divination.repository.ReadingRepository;
import com.divinationengine.divination.service.prompting.PromptTemplateBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class InterpretationService {

    private static final Logger logger = LoggerFactory.getLogger(InterpretationService.class);

    private final ReadingRepository readingRepository;
    private final PromptTemplateBuilder promptTemplateBuilder;
    private final LlmService llmService;

    public InterpretationService(ReadingRepository readingRepository,
                                PromptTemplateBuilder promptTemplateBuilder,
                                LlmService llmService) {
        this.readingRepository = readingRepository;
        this.promptTemplateBuilder = promptTemplateBuilder;
        this.llmService = llmService;
    }

    @Transactional
    public InterpretResponse interpret(InterpretRequest request, String userId, String tier) {
        UUID userUuid;
        try {
            userUuid = UUID.fromString(userId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid userId in authentication context");
        }

        Reading reading = readingRepository.findById(request.getReadingId())
                .orElseThrow(() -> new ResourceNotFoundException("Reading", "id", request.getReadingId()));

        if (reading.getUserId() != null && !reading.getUserId().equals(userUuid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Reading does not belong to the current user");
        }

        if (reading.getUserId() == null) {
            reading.setUserId(userUuid);
        }

        String spreadType = request.getSpreadType();
        String prompt;
        try {
            if (spreadType != null && spreadType.equalsIgnoreCase("three-card")) {
                prompt = promptTemplateBuilder.buildThreeCardPrompt(request.getCards(), request.getUserInput(), request.getUserContext());
            } else if (spreadType != null && spreadType.equalsIgnoreCase("celtic-cross")) {
                prompt = promptTemplateBuilder.buildCelticCrossPrompt(request.getCards(), request.getUserInput(), request.getUserContext());
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported spread type: " + spreadType);
            }
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }

        String interpretation;
        try {
            interpretation = llmService.generateInterpretation(prompt);
            logger.info("Generated LLM interpretation for reading {}: {}", request.getReadingId(), interpretation);
        } catch (Exception e) {
            logger.error("Failed to generate LLM interpretation for reading {}: {}", request.getReadingId(), e.getMessage(), e);
            throw new LlmGenerationException("Failed to generate interpretation: " + e.getMessage(), e);
        }

        try {
            reading.setLlmInterpretation(interpretation);
            readingRepository.save(reading);
            logger.info("Saved interpretation for reading {}", request.getReadingId());
        } catch (Exception e) {
            logger.error("Failed to save interpretation for reading {}: {}", request.getReadingId(), e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save interpretation", e);
        }

        return new InterpretResponse(request.getReadingId(), interpretation, Instant.now(), request.getSpreadType(), tier);
    }
}
