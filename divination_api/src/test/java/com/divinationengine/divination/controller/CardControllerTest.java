package com.divinationengine.divination.controller;

import com.divinationengine.divination.models.Card;
import com.divinationengine.divination.models.CardType;
import com.divinationengine.divination.service.CardService;
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

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CardController.class)
class CardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CardService cardService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllCards_ShouldReturnAllCards() throws Exception {
        // Given
        Card card = new Card();
        card.setId(1L);
        card.setType(CardType.major);
        card.setName("The Fool");
        List<Card> cards = Arrays.asList(card);
        
        when(cardService.getAllCards()).thenReturn(cards);

        // When & Then
        mockMvc.perform(get("/cards"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].name").value("The Fool"))
                .andExpect(jsonPath("$[0].type").value("major"));
    }

    @Test
    void getCard_WithValidId_ShouldReturnCard() throws Exception {
        // Given
        Card card = new Card();
        card.setId(1L);
        card.setType(CardType.minor);
        card.setName("Ace of Wands");
        
        when(cardService.getCardById(1L)).thenReturn(Optional.of(card));

        // When & Then
        mockMvc.perform(get("/cards/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Ace of Wands"))
                .andExpect(jsonPath("$.type").value("minor"));
    }

    @Test
    void getCard_WithInvalidId_ShouldReturn404() throws Exception {
        // Given
        when(cardService.getCardById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/cards/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").exists());
    }
}
