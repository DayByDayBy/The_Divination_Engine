export type SpreadType = 'THREE_CARD' | 'CELTIC_CROSS' | 'ONE_CARD' | 'CUSTOM';

export interface PromptCard {
  name: string;
  reversed: boolean;
  meaningUp: string;
  meaningRev: string;
  position: number;
}

export interface PromptRequest {
  spreadType: SpreadType;
  userInput: string;
  userContext?: string;
  cards: PromptCard[];
}

const SPREAD_DESCRIPTIONS: Record<SpreadType, string> = {
  ONE_CARD: 'a single card reading for quick insight',
  THREE_CARD: 'a three-card spread representing past, present, and future',
  CELTIC_CROSS: 'a Celtic Cross spread for deep, comprehensive analysis',
  CUSTOM: 'a custom spread layout',
};

export function buildPrompt(request: PromptRequest): string {
  const { spreadType, userInput, userContext, cards } = request;

  const cardDetails = cards
    .map((card, i) => {
      const orientation = card.reversed ? 'Reversed' : 'Upright';
      const meaning = card.reversed ? card.meaningRev : card.meaningUp;
      return `Position ${i + 1}: ${card.name} (${orientation})\nMeaning: ${meaning}`;
    })
    .join('\n\n');

  let prompt = `You are an experienced tarot reader providing an interpretation for ${SPREAD_DESCRIPTIONS[spreadType]} (${spreadType}).

The querent asks: "${userInput}"`;

  if (userContext) {
    prompt += `\n\nAdditional context: ${userContext}`;
  }

  prompt += `\n\nCards drawn:\n\n${cardDetails}`;

  prompt += `\n\nProvide a thoughtful, insightful interpretation that connects the cards to the querent's question. Be specific about how each card relates to their situation.`;

  return prompt;
}
