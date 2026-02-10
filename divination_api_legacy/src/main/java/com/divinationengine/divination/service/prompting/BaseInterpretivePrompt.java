package com.divinationengine.divination.service.prompting;

/**
 * provides the shared epistemic framing for all interpretive prompts.
 * 
 *  this class should remain stable and free of spread-specific logic.
 *  changes here will affect the tone and interpretive stance of the entire system.
 */
public abstract class BaseInterpretivePrompt {

    protected String epistemicPreamble() {
        return """
        A symbolic spread has been generated in response to a querent’s inquiry.

        The cards, their positions, orientations, and associated meanings are already visible to the querent.
        They should be treated as shared reference points rather than revelations.

        Your role is not simply to explain the symbols, but to articulate possible ways they can be read together,
        to create narrative threads between them, without closing off the querent’s own interpretation.
        """;
    }
}