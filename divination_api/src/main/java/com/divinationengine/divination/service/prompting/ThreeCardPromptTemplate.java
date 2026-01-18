
package com.divinationengine.divination.service.prompting;
import com.divinationengine.divination.dto.CardInterpretDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ThreeCardPromptTemplate
        extends BaseInterpretivePrompt
        implements PromptTemplate {

    @Override
    public String buildPrompt(
            String inquiry,
            String focusArea,
            List<CardInterpretDTO> cards
    ) {
        if (cards == null || cards.size() != 3) {
            throw new IllegalArgumentException(
                "Three-card spread requires exactly 3 cards"
            );
        }

        String formattedCards = formatThreeCards(cards);
        
        return String.format("""
            %s

            Inquiry:
            "%s"

            Focus area:
            %s

            Cards drawn:
            %s

            The spread follows a Past–Present–Future structure.

            Compose a reflective reading that:
            - treats each card as a perspective on the inquiry rather than a prediction,
            - draws meaning primarily from the relationship between the three positions,
            - and reframes the situation in a way that may help the querent notice priorities,
              tensions, or possible directions.

            Use exploratory and conditional language.
            Avoid certainty or prescriptive advice.
            The reading should function as a narrative lens the querent may engage with,
            rather than a conclusion they must accept.
            """,
            epistemicPreamble(),
            inquiry != null ? inquiry : "",
            focusArea != null ? focusArea : "",
            formattedCards
        );
    }
    
    private String formatThreeCards(List<CardInterpretDTO> cards) {
        String[] positions = {"Past", "Present", "Future"};
        
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
