package com.divinationengine.divination.controller;

import com.divinationengine.divination.dto.CardInterpretDTO;
import com.divinationengine.divination.dto.InterpretRequest;
import com.divinationengine.divination.models.Reading;
import com.divinationengine.divination.repository.ReadingRepository;
import com.divinationengine.divination.security.JwtUtil;
import com.divinationengine.divination.service.LlmService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class InterpretControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ReadingRepository readingRepository;

    @MockBean
    private LlmService llmService;

    @Test
    void interpret_withoutJwt_returns401() throws Exception {
        InterpretRequest request = new InterpretRequest(1L, "test question", List.of(), "three-card", null);

        mockMvc.perform(post("/tarot/interpret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void interpret_withJwt_persistsInterpretationAndReturnsResponse() throws Exception {
        Reading reading = readingRepository.save(new Reading());

        UUID userId = UUID.randomUUID();
        String token = jwtUtil.generateToken(userId, "FREE");

        List<CardInterpretDTO> cards = List.of(
                new CardInterpretDTO("The Fool", false, "New beginnings", "Recklessness", "past"),
                new CardInterpretDTO("The Magician", false, "Manifestation", "Trickery", "present"),
                new CardInterpretDTO("The High Priestess", false, "Intuition", "Secrets", "future")
        );

        InterpretRequest request = new InterpretRequest(reading.getId(), "What should I focus on?", cards, "three-card", "Some context");

        when(llmService.generateInterpretation(anyString())).thenReturn("mock interpretation");

        mockMvc.perform(post("/tarot/interpret")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readingId").value(reading.getId()))
                .andExpect(jsonPath("$.tier").value("FREE"))
                .andExpect(jsonPath("$.spreadType").value("three-card"))
                .andExpect(jsonPath("$.interpretation").value("mock interpretation"))
                .andExpect(jsonPath("$.timestamp").exists());

        Reading updated = readingRepository.findById(reading.getId()).orElseThrow();
        assertEquals("mock interpretation", updated.getLlmInterpretation());
        assertNotNull(updated.getUserId());
        assertEquals(userId, updated.getUserId());
    }
}
