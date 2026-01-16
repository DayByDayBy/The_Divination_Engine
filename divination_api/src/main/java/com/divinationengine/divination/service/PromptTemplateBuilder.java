package com.divinationengine.divination.service;

import com.divinationengine.divination.dto.CardInterpretDTO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PromptTemplateBuilder {
    
    public String buildThreeCardPrompt(List<CardInterpretDTO> cards, String userInput, String userContext) {
        if (cards == null) {
            throw new IllegalArgumentException("buildThreeCardPrompt: cards must be non-null and contain exactly 3 cards");
        }
        if (cards.size() != 3) {
            throw new IllegalArgumentException("buildThreeCardPrompt: cards must contain exactly 3 cards");
        }
        String cardsDescription = cards.stream()
                .map(card -> String.format("- %s (%s): %s%s", 
                    card.getName(), 
                    card.getPosition(), 
                    Boolean.TRUE.equals(card.getReversed()) ? card.getMeaningRev() : card.getMeaningUp(),
                    Boolean.TRUE.equals(card.getReversed()) ? " (reversed)" : ""))
                .collect(Collectors.joining("\n"));
        
        return String.format("""
            You are a knowledgeable tarot reader providing insightful, reflective interpretations. 
            Focus on symbolism and personal growth rather than deterministic predictions.
            
            This is a three-card tarot reading for the querent's question: \"%s\".
            
            Cards drawn:
            %s
            
            User context: %s
            
            Please provide a thoughtful interpretation that:
            1. Explains the symbolic meaning of each card in its position
            2. Considers how the cards interact with each other
            3. Offers reflective guidance for personal growth
            4. Offers practical guidance for personal growth
            5. Avoids making absolute predictions about the future
            6. Maintains a supportive, empowering tone
            
            Remember: This is for reflection and insight, not fortune-telling.
            """, userInput != null ? userInput : "", cardsDescription, userContext != null ? userContext : "No specific context provided");
    }
    
    public String buildCelticCrossPrompt(List<CardInterpretDTO> cards, String userInput, String userContext) {
        if (cards == null) {
            throw new IllegalArgumentException("buildCelticCrossPrompt: cards must be non-null and contain exactly 10 cards");
        }
        if (cards.size() != 10) {
            throw new IllegalArgumentException("Celtic Cross spread requires exactly 10 cards");
        }
        
        String[] positions = {
            "1. Present", "2. Challenge", "3. Past", "4. Future", "5. Above",
            "6. Below", "7. Advice", "8. External Influences", "9. Hopes/Fears", "10. Outcome"
        };
        
        StringBuilder cardsDescription = new StringBuilder();
        for (int i = 0; i < cards.size(); i++) {
            CardInterpretDTO card = cards.get(i);
            cardsDescription.append(String.format("- %s (%s): %s%s\n", 
                card.getName(), 
                positions[i], 
                Boolean.TRUE.equals(card.getReversed()) ? card.getMeaningRev() : card.getMeaningUp(),
                Boolean.TRUE.equals(card.getReversed()) ? " (reversed)" : ""));
        }
        
        return String.format("""
            You are a knowledgeable tarot reader providing insightful, reflective interpretations. 
            Focus on symbolism and personal growth rather than deterministic predictions.
            
            This is a Celtic Cross tarot reading for the querent's question: \"%s\".
            
            Celtic Cross Spread:
            %s
            
            User context: %s
            
            Please provide a thoughtful interpretation that:
            1. Explains the significance of each position in the Celtic Cross
            2. Considers how the cards interact and tell a coherent story
            3. Identifies patterns and themes that emerge
            4. Offers practical guidance for personal growth
            5. Avoids making absolute predictions about the future
            6. Maintains a supportive, empowering tone
            
            Remember: This is for reflection and insight, not fortune-telling.
            """, userInput != null ? userInput : "", cardsDescription.toString(), userContext != null ? userContext : "No specific context provided");
    }
}
