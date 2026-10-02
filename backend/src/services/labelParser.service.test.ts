import { describe, expect, it } from 'vitest';
import { parseLabelText } from './labelParser.service.js';

describe('parseLabelText', () => {
  it('aísla la sección de ingredientes y corta en el contenido neto', () => {
    const r = parseLabelText('GALLETAS\nIngredientes: harina de trigo, azúcar, sal.\nContenido neto 120 g');
    expect(r.ingredientsText).toBe('harina de trigo, azúcar, sal');
  });

  it('une palabras cortadas con guion al final de línea', () => {
    const r = parseLabelText('INGREDIENTES: leche en pol-\nvo, azúcar');
    expect(r.ingredientsText).toBe('leche en polvo, azúcar');
  });

  it('extrae la declaración "Contiene:" y las trazas', () => {
    const r = parseLabelText(
      'Ingredientes: azúcar, cacao. CONTIENE: LECHE Y SOYA. Puede contener trazas de cacahuate.',
    );
    expect(r.ingredientsText).toBe('azúcar, cacao');
    expect(r.allergenTags.sort()).toEqual(['en:milk', 'en:soybeans']);
    expect(r.traceTags).toEqual(['en:peanuts']);
  });

  it('reconoce "elaborado en una planta que procesa…" como trazas', () => {
    const r = parseLabelText('Ingredientes: arroz, sal. Elaborado en una planta que procesa nuez y ajonjolí.');
    expect(r.traceTags.sort()).toEqual(['en:nuts', 'en:sesame-seeds']);
  });

  it('acepta encabezados en inglés', () => {
    expect(parseLabelText('INGREDIENTS: water, sugar').ingredientsText).toBe('water, sugar');
  });

  it('sin encabezado devuelve ingredientsText null pero conserva el texto', () => {
    const r = parseLabelText('harina de trigo, leche, huevo');
    expect(r.ingredientsText).toBeNull();
    expect(r.cleanText).toBe('harina de trigo, leche, huevo');
    expect(r.hasText).toBe(true);
  });

  it('marca como ilegible un texto casi vacío', () => {
    expect(parseLabelText('  ~ | 1 .  ').hasText).toBe(false);
  });
});
