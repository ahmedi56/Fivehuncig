import { detectCrisis } from './safety';

describe('crisis detection', () => {
  it.each([
    ['I want to kill myself', 'self-harm'],
    ["I'm thinking about suicide", 'self-harm'],
    ['Je veux mettre fin à mes jours', 'self-harm'],
    ["J'AI ENVIE DE MOURIR", 'self-harm'],
    ['أريد أن أموت', 'self-harm'],
    ['أُريدُ أن أموتَ', 'self-harm'],
    ['I have chest pain and feel dizzy', 'medical-emergency'],
    ["I can’t breathe", 'medical-emergency'],
    ["J'ai une douleur à la poitrine", 'medical-emergency'],
    ['عندي ألم في الصدر', 'medical-emergency'],
  ])('flags %p as %s', (text, kind) => {
    expect(detectCrisis(text)).toBe(kind);
  });

  it.each([
    'I really want a cigarette right now',
    "I'm stressed and want to smoke",
    'Je suis stressé, j’ai envie de fumer',
    'أريد سيجارة الآن',
    'My cravings are killing me', // figure of speech, no self-harm keyword
    'avocado', // contains "avc" letters but is not the word
  ])('does not flag ordinary craving talk: %p', (text) => {
    expect(detectCrisis(text)).toBeUndefined();
  });
});
