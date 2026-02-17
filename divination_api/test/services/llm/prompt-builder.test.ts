import { buildPrompt, SpreadType } from '@/services/llm/prompt-builder';

const sampleCards = [
  {
    name: 'The Fool',
    reversed: false,
    meaningUp: 'New beginnings...',
    meaningRev: 'Recklessness...',
    position: 0,
  },
  {
    name: 'The Magician',
    reversed: true,
    meaningUp: 'Skill and diplomacy...',
    meaningRev: 'Lack of self-confidence...',
    position: 1,
  },
  {
    name: 'The High Priestess',
    reversed: false,
    meaningUp: 'Wisdom and serenity...',
    meaningRev: 'Ignorance and superficiality...',
    position: 2,
  },
];

describe('buildPrompt', () => {
  it('includes spread type in prompt', () => {
    const prompt = buildPrompt({
      spreadType: 'THREE_CARD',
      userInput: 'What does my future hold?',
      cards: sampleCards,
    });

    expect(prompt).toContain('THREE_CARD');
  });

  it('includes user input question', () => {
    const prompt = buildPrompt({
      spreadType: 'THREE_CARD',
      userInput: 'What does my future hold?',
      cards: sampleCards,
    });

    expect(prompt).toContain('What does my future hold?');
  });

  it('includes card details with name and meaning', () => {
    const prompt = buildPrompt({
      spreadType: 'THREE_CARD',
      userInput: 'test',
      cards: sampleCards,
    });

    expect(prompt).toContain('The Fool');
    expect(prompt).toContain('New beginnings...');
    expect(prompt).toContain('The Magician');
    expect(prompt).toContain('Reversed');
  });

  it('uses meaningRev for reversed cards', () => {
    const prompt = buildPrompt({
      spreadType: 'THREE_CARD',
      userInput: 'test',
      cards: sampleCards,
    });

    expect(prompt).toContain('Lack of self-confidence...');
  });

  it('uses meaningUp for upright cards', () => {
    const prompt = buildPrompt({
      spreadType: 'THREE_CARD',
      userInput: 'test',
      cards: sampleCards,
    });

    expect(prompt).toContain('New beginnings...');
  });

  it('includes user context when provided', () => {
    const prompt = buildPrompt({
      spreadType: 'THREE_CARD',
      userInput: 'Career advice?',
      userContext: "I'm considering a job change",
      cards: sampleCards,
    });

    expect(prompt).toContain("I'm considering a job change");
  });

  it('works without user context', () => {
    const prompt = buildPrompt({
      spreadType: 'ONE_CARD',
      userInput: 'Quick reading',
      cards: [sampleCards[0]],
    });

    expect(prompt).not.toContain('undefined');
    expect(prompt).toContain('Quick reading');
  });

  it('supports all spread types', () => {
    const spreadTypes: SpreadType[] = ['THREE_CARD', 'CELTIC_CROSS', 'ONE_CARD', 'CUSTOM'];

    for (const st of spreadTypes) {
      const prompt = buildPrompt({
        spreadType: st,
        userInput: 'test',
        cards: sampleCards,
      });
      expect(prompt).toContain(st);
    }
  });

  it('includes card positions', () => {
    const prompt = buildPrompt({
      spreadType: 'THREE_CARD',
      userInput: 'test',
      cards: sampleCards,
    });

    expect(prompt).toContain('Position 1');
    expect(prompt).toContain('Position 2');
    expect(prompt).toContain('Position 3');
  });

  it('should include output format instructions in prompt', () => {
    const prompt = buildPrompt({
      spreadType: 'THREE_CARD',
      userInput: 'What does my future hold?',
      cards: sampleCards,
    });

    expect(prompt).toMatch(/overview/i);
    expect(prompt).toMatch(/individual card/i);
    expect(prompt).toMatch(/synthesis/i);
    expect(prompt).toMatch(/under 500 words/i);
  });
});
