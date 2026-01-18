package com.divinationengine.divination.service.prompting;

import com.divinationengine.divination.dto.CardInterpretDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CelticCrossPromptTemplate extends BaseInterpretivePrompt implements PromptTemplate {

    @Override
    public String buildPrompt(
            String inquiry,
            String focusArea,
            List<CardInterpretDTO> cards
    ) {
        if (cards == null || cards.size() != 10) {
            throw new IllegalArgumentException(
                "Celtic Cross spread requires exactly 10 cards"
            );
        }

        String formattedCards = formatCelticCards(cards);
        
        return String.format("""
            %s

            Inquiry:
            "%s"

            Focus area:
            %s

            Cards drawn:
            %s

            The spread follows a ten-card Celtic Cross structure.
            Each position represents a distinct aspect of the situation,
            including immediate influences, underlying factors,
            external pressures, and potential trajectories.

            Compose a cohesive interpretive reading that:
            - treats each position as a lens rather than a verdict,
            - draws meaning from tensions and alignments across the spread,
            - acknowledges uncertainty and multiple plausible readings,
            - and resists framing the final outcome as fixed or inevitable.

            Emphasize relationships between positions over isolated meanings.
            Use reflective, conditional language throughout.
            Avoid predictive certainty or prescriptive instruction.
            """,
            epistemicPreamble(),
            inquiry != null ? inquiry : "",
            focusArea != null ? focusArea : "",
            formattedCards
        );
    }
    
    private String formatCelticCards(List<CardInterpretDTO> cards) {
        String[] positions = {
            "1. Present", "2. Challenge", "3. Past", "4. Future", "5. Above",
            "6. Below", "7. Advice", "8. External Influences", "9. Hopes/Fears", "10. Outcome"
        };
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cards.size(); i++) {
            CardInterpretDTO card = cards.get(i);
            String orientation = Boolean.TRUE.equals(card.getReversed()) ? "reversed" : "upright";
            String meaning = Boolean.TRUE.equals(card.getReversed()) ? card.getMeaningRev() : card.getMeaningUp();
            sb.append(String.format("- %s: %s (%s) - %s\n", 
                positions[i], card.getName(), orientation, meaning));
        }
        return sb.toString();
    }
}
