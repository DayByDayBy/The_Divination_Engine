package com.divinationengine.divination.controller;

import com.divinationengine.divination.dto.CardInterpretDTO;
import com.divinationengine.divination.dto.InterpretRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RateLimitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RedisTemplate<String, String> redisTemplate;

    @MockBean
    private ValueOperations<String, String> valueOperations;

    @MockBean
    private com.divinationengine.divination.service.InterpretationService interpretationService;

    @MockBean
    private com.divinationengine.divination.repository.ReadingRepository readingRepository;

    @Test
    @WithMockUser(roles = {"FREE"})
    void interpret_FreeUser_WithinLimit_ShouldAllow() throws Exception {
        // Given
        InterpretRequest request = createTestRequest();
        com.divinationengine.divination.dto.InterpretResponse response = new com.divinationengine.divination.dto.InterpretResponse(1L, "Test interpretation", java.time.Instant.now(), "three-card", "FREE");
        
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(1L);
        when(redisTemplate.expire(anyString(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        when(interpretationService.interpret(any(), any(), any())).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/tarot/interpret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-RateLimit-Remaining"))
                .andExpect(header().exists("X-RateLimit-Reset"));
    }

    @Test
    @WithMockUser(roles = {"FREE"})
    void interpret_FreeUser_ExceedsLimit_ShouldReturn429() throws Exception {
        // Given
        InterpretRequest request = createTestRequest();
        
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(4L); // 4th request exceeds limit of 3

        // When & Then
        mockMvc.perform(post("/tarot/interpret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is(429))
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.error").value("Rate limit exceeded"))
                .andExpect(jsonPath("$.upgradeHint").exists());
    }

    @Test
    @WithMockUser(roles = {"BASIC"})
    void interpret_BasicUser_WithinLimit_ShouldAllow() throws Exception {
        // Given
        InterpretRequest request = createTestRequest();
        com.divinationengine.divination.dto.InterpretResponse response = new com.divinationengine.divination.dto.InterpretResponse(1L, "Test interpretation", java.time.Instant.now(), "three-card", "BASIC");
        
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(15L); // Within limit of 20
        when(redisTemplate.expire(anyString(), anyLong(), any(TimeUnit.class))).thenReturn(true);
        when(interpretationService.interpret(any(), any(), any())).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/tarot/interpret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-RateLimit-Remaining"));
    }

    @Test
    @WithMockUser(roles = {"PREMIUM"})
    void interpret_PremiumUser_UnlimitedAccess_ShouldAllow() throws Exception {
        // Given
        InterpretRequest request = createTestRequest();
        com.divinationengine.divination.dto.InterpretResponse response = new com.divinationengine.divination.dto.InterpretResponse(1L, "Test interpretation", java.time.Instant.now(), "three-card", "PREMIUM");
        when(interpretationService.interpret(any(), any(), any())).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/tarot/interpret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
        
        // Verify Redis operations were not called for premium users
        verify(redisTemplate, never()).opsForValue();
    }

    @Test
    void interpret_UnauthenticatedUser_ShouldReturn401() throws Exception {
        // Given
        InterpretRequest request = createTestRequest();

        // When & Then
        mockMvc.perform(post("/tarot/interpret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    private InterpretRequest createTestRequest() {
        InterpretRequest request = new InterpretRequest();
        request.setReadingId(1L);
        request.setSpreadType("three-card");
        request.setUserInput("What should I know about my career?");
        request.setUserContext("Considering a job change");

        CardInterpretDTO card = new CardInterpretDTO();
        card.setName("The Fool");
        card.setReversed(false);
        card.setMeaningUp("New beginnings, innocence, spontaneity");
        card.setMeaningRev("Recklessness, risk-taking, naivety");
        card.setPosition("Past");
        request.setCards(Arrays.asList(card));

        return request;
    }
}
