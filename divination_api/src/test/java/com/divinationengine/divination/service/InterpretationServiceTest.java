package com.divinationengine.divination.service;

import com.divinationengine.divination.dto.CardInterpretDTO;
import com.divinationengine.divination.dto.InterpretRequest;
import com.divinationengine.divination.dto.InterpretResponse;
import com.divinationengine.divination.exception.LlmGenerationException;
import com.divinationengine.divination.exception.ResourceNotFoundException;
import com.divinationengine.divination.models.Reading;
import com.divinationengine.divination.repository.ReadingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterpretationServiceTest {

    @Mock
    private ReadingRepository readingRepository;

    @Mock
    private PromptTemplateBuilder promptTemplateBuilder;

    @Mock
    private LlmService llmService;

    @InjectMocks
    private InterpretationService interpretationService;

    private InterpretRequest testRequest;
    private Reading testReading;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testRequest = new InterpretRequest();
        testRequest.setReadingId(1L);
        testRequest.setSpreadType("three-card");
        testRequest.setUserInput("What should I know about my career?");
        testRequest.setUserContext("Considering a job change");

        CardInterpretDTO card = new CardInterpretDTO();
        card.setName("The Fool");
        card.setReversed(false);
        card.setMeaningUp("New beginnings, innocence, spontaneity");
        card.setMeaningRev("Recklessness, risk-taking, naivety");
        card.setPosition("Past");
        testRequest.setCards(Arrays.asList(card));

        testReading = new Reading();
        testReading.setId(1L);
        testReading.setUserId(testUserId);
    }

    @Test
    void interpret_ValidRequest_ShouldReturnInterpretResponse() throws LlmServiceException {
        // Given
        String mockPrompt = "Test prompt";
        String mockInterpretation = "This is a test interpretation";

        when(readingRepository.findById(1L)).thenReturn(Optional.of(testReading));
        when(promptTemplateBuilder.buildThreeCardPrompt(any(), any(), any())).thenReturn(mockPrompt);
        when(llmService.generateInterpretation(mockPrompt)).thenReturn(mockInterpretation);
        when(readingRepository.save(any(Reading.class))).thenReturn(testReading);

        // When
        InterpretResponse response = interpretationService.interpret(testRequest, testUserId.toString(), "FREE");

        // Then
        assertNotNull(response);
        assertEquals(1L, response.getReadingId());
        assertEquals(mockInterpretation, response.getInterpretation());
        assertEquals("three-card", response.getSpreadType());
        assertEquals("FREE", response.getTier());
        assertNotNull(response.getTimestamp());

        verify(readingRepository).findById(1L);
        verify(promptTemplateBuilder).buildThreeCardPrompt(any(), any(), any());
        verify(llmService).generateInterpretation(mockPrompt);
        verify(readingRepository).save(testReading);
    }

    @Test
    void interpret_InvalidUserId_ShouldThrowUnauthorized() {
        // Given - no setup needed since UUID parsing happens first

        // When & Then
        assertThrows(ResponseStatusException.class, () -> {
            interpretationService.interpret(testRequest, "invalid-uuid", "FREE");
        });
    }

    @Test
    void interpret_NonExistentReading_ShouldThrowResourceNotFound() {
        // Given
        when(readingRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(ResourceNotFoundException.class, () -> {
            interpretationService.interpret(testRequest, testUserId.toString(), "FREE");
        });
    }

    @Test
    void interpret_LlmServiceFailure_ShouldThrowLlmGenerationException() throws LlmServiceException {
        // Given
        when(readingRepository.findById(1L)).thenReturn(Optional.of(testReading));
        when(promptTemplateBuilder.buildThreeCardPrompt(any(), any(), any())).thenReturn("Test prompt");
        when(llmService.generateInterpretation(any())).thenThrow(new LlmServiceException("API error"));

        // When & Then
        assertThrows(LlmGenerationException.class, () -> {
            interpretationService.interpret(testRequest, testUserId.toString(), "FREE");
        });
    }
}
