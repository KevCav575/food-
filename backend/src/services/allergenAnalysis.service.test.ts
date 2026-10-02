import { describe, expect, it } from 'vitest';
import { analyzeProduct } from './allergenAnalysis.service.js';
import { detectAllergensInText, resolveAllergen } from '../domain/allergens.js';
import { splitIngredientsText } from './openFoodFacts.service.js';

const product = (text: string, allergenTags: string[] = [], traceTags: string[] = []) => ({
  ingredients: splitIngredientsText(text),
  allergenTags,
  traceTags,
});

describe('detectAllergensInText', () => {
  it.each([
    ['Leche entera en polvo', 'MILK'],
    ['suero de LÁCTEOS', 'MILK'],
    ['harina de trigo', 'GLUTEN'],
    ['cacahuates tostados', 'PEANUTS'],
    ['maní', 'PEANUTS'],
    ['ajonjolí', 'SESAME_SEEDS'],
    ['camarones', 'CRUSTACEANS'],
    ['conservador (E-220)', 'SULPHITES'],
    ['lecitina de soya', 'SOYBEANS'],
    ['nueces', 'NUTS'],
    ['whey powder', 'MILK'],
  ])('"%s" → %s', (text, allergen) => {
    expect(detectAllergensInText(text).has(allergen as never)).toBe(true);
  });

  it.each([
    ['leche de coco', 'MILK'],
    ['manteca de cacao', 'MILK'],
    ['mantequilla de cacahuate', 'MILK'],
    ['sin gluten', 'GLUTEN'],
    ['trigo sarraceno', 'GLUTEN'],
    ['nuez moscada', 'NUTS'],
    ['harina de maíz', 'GLUTEN'],
    ['natural', 'MILK'], // "nata" no debe coincidir dentro de otra palabra
    ['coconut', 'NUTS'],
  ])('"%s" NO activa %s', (text, allergen) => {
    expect(detectAllergensInText(text).has(allergen as never)).toBe(false);
  });

  it('la exclusión no oculta otra mención real del mismo alérgeno', () => {
    expect(detectAllergensInText('leche de coco y leche descremada').has('MILK')).toBe(true);
  });

  it('mantequilla de cacahuate sí activa cacahuate', () => {
    expect(detectAllergensInText('mantequilla de cacahuate').has('PEANUTS')).toBe(true);
  });
});

describe('resolveAllergen', () => {
  it.each([
    ['GLUTEN', 'GLUTEN'],
    ['lactosa', 'MILK'],
    ['Maní', 'PEANUTS'],
    ['mariscos', 'CRUSTACEANS'],
    ['SESAME_SEEDS', 'SESAME_SEEDS'],
  ])('%s → %s', (input, expected) => expect(resolveAllergen(input)).toBe(expected));

  it('devuelve null para valores desconocidos', () => expect(resolveAllergen('kriptonita')).toBeNull());
});

describe('splitIngredientsText', () => {
  it('respeta paréntesis y decimales', () => {
    const parts = splitIngredientsText('Azúcar, chocolate (cacao, leche), sal 2,5%, aceite.');
    expect(parts.map((p) => p.text)).toEqual(['Azúcar', 'chocolate (cacao, leche)', 'sal 2,5%', 'aceite']);
  });
});

describe('analyzeProduct', () => {
  it('DANGER: marca los ingredientes que activan la alerta', () => {
    const r = analyzeProduct(product('Harina de trigo, azúcar, leche en polvo, sal'), ['MILK']);
    expect(r.status).toBe('DANGER');
    expect(r.isSafe).toBe(false);
    expect(r.triggeredIngredients.map((i) => i.text)).toEqual(['leche en polvo']);
    expect(r.ingredients).toHaveLength(4);
    // El trigo se detecta pero no es peligroso para este usuario
    expect(r.ingredients[0]!.detectedAllergens).toContain('GLUTEN');
    expect(r.ingredients[0]!.isDangerous).toBe(false);
  });

  it('DANGER por etiqueta del producto aunque el texto no lo mencione', () => {
    const r = analyzeProduct(product('Azúcar, aromas', ['en:gluten']), ['GLUTEN']);
    expect(r.status).toBe('DANGER');
    expect(r.matchedAllergens[0]).toMatchObject({ allergen: 'GLUTEN', sources: ['PRODUCT_LABEL'] });
  });

  it('CAUTION: trazas de un alérgeno del perfil', () => {
    const r = analyzeProduct(product('Azúcar, cacao', [], ['en:nuts']), ['NUTS']);
    expect(r.status).toBe('CAUTION');
    expect(r.warnings).toContain('TRACES_DETECTED');
  });

  it('UNKNOWN: sin datos de ingredientes nunca se reporta como seguro', () => {
    const r = analyzeProduct(product(''), ['MILK']);
    expect(r.status).toBe('UNKNOWN');
    expect(r.isSafe).toBe(false);
  });

  it('SAFE: sin coincidencias con el perfil', () => {
    const r = analyzeProduct(product('Agua, azúcar, ácido cítrico'), ['MILK', 'GLUTEN']);
    expect(r.status).toBe('SAFE');
    expect(r.triggeredIngredients).toHaveLength(0);
  });

  it('avisa cuando el usuario no configuró alergias', () => {
    const r = analyzeProduct(product('Leche'), []);
    expect(r.status).toBe('SAFE');
    expect(r.warnings).toContain('NO_ALLERGIES_CONFIGURED');
    expect(r.ingredients[0]!.detectedAllergens).toContain('MILK');
  });
});
