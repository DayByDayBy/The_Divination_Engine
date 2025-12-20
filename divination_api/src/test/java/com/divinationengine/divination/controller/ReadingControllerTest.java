package com.divinationengine.divination.controller;

import com.divinationengine.divination.models.Card;
import com.divinationengine.divination.models.CardType;
import com.divinationengine.divination.models.Reading;
import com.divinationengine.divination.service.CardService;
import com.divinationengine.divination.service.ReadingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReadingController.class)
@SuppressWarnings("null")
class ReadingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReadingService readingService;

    @MockBean
    private CardService cardService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void get3Cards_ShouldReturn3RandomCards() throws Exception {
        // Given
        List<Card> cards = Arrays.asList(
            createCard(1L, "The Fool"),
            createCard(2L, "The Magician"),
            createCard(3L, "The High Priestess")
        );
        
        when(cardService.getRandomCards(3)).thenReturn(cards);

        // When & Then
        mockMvc.perform(get("/reading/3"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].name").value("The Fool"));
    }

    @Test
    void get10Cards_ShouldReturn10RandomCards() throws Exception {
        // Given
        List<Card> cards = Arrays.asList(
            createCard(1L, "The Fool"),
            createCard(2L, "The Magician"),
            createCard(3L, "The High Priestess"),
            createCard(4L, "The Empress"),
            createCard(5L, "The Emperor"),
            createCard(6L, "The Hierophant"),
            createCard(7L, "The Lovers"),
            createCard(8L, "The Chariot"),
            createCard(9L, "Strength"),
            createCard(10L, "The Hermit")
        );
        
        when(cardService.getRandomCards(10)).thenReturn(cards);

        // When & Then
        mockMvc.perform(get("/reading/10"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(10));
    }

    @Test
    void getAllReadings_ShouldReturnAllReadings() throws Exception {
        // Given
        Reading reading = new Reading();
        reading.setId(1L);
        List<Reading> readings = Arrays.asList(reading);
        
        when(readingService.getAllReadings()).thenReturn(readings);

        // When & Then
        mockMvc.perform(get("/reading/s"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void getReading_WithValidId_ShouldReturnReading() throws Exception {
        // Given
        Reading reading = new Reading();
        reading.setId(1L);
        
        when(readingService.getReadingById(1L)).thenReturn(Optional.of(reading));

        // When & Then
        mockMvc.perform(get("/reading/s/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void getReading_WithInvalidId_ShouldReturn404() throws Exception {
        // Given
        when(readingService.getReadingById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/reading/s/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    void postReading_ShouldCreateAndReturnReading() throws Exception {
        // Given
        Reading reading = new Reading();
        reading.setId(1L);
        reading.setCardReadings(new java.util.ArrayList<>());
        
        when(readingService.createReading(any(Reading.class))).thenReturn(reading);

        // When & Then
        mockMvc.perform(post("/reading/s")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reading)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void deleteReading_WithValidId_ShouldReturn204() throws Exception {
        // Given
        when(readingService.existsById(1L)).thenReturn(true);

        // When & Then
        mockMvc.perform(delete("/reading/s/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteReading_WithInvalidId_ShouldReturn404() throws Exception {
        // Given
        when(readingService.existsById(999L)).thenReturn(false);

        // When & Then
        mockMvc.perform(delete("/reading/s/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    private Card createCard(Long id, String name) {
        Card card = new Card();
        card.setId(id);
        card.setName(name);
        card.setType(CardType.major);
        return card;
    }
}
