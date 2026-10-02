import { Fragment } from 'react';
import type { AllergenRef, AnalyzedIngredient } from '../types/api.ts';

interface Props {
  ingredients: AnalyzedIngredient[];
  rawText: string | null;
  userAllergens: AllergenRef[];
}

interface IngredientNode {
  ingredient: AnalyzedIngredient;
  children: IngredientNode[];
}

/** El backend envía la lista aplanada en preorden con `depth`; la reconstruimos como árbol. */
function buildTree(list: AnalyzedIngredient[]): IngredientNode[] {
  const roots: IngredientNode[] = [];
  const stack: IngredientNode[] = [];
  for (const ingredient of list) {
    const node: IngredientNode = { ingredient, children: [] };
    while (stack.length > ingredient.depth) stack.pop();
    const parent = stack[stack.length - 1];
    (parent ? parent.children : roots).push(node);
    stack.push(node);
  }
  return roots;
}

function IngredientNodes({ nodes, labels }: { nodes: IngredientNode[]; labels: Map<string, string> }) {
  return nodes.map(({ ingredient, children }, i) => (
    <Fragment key={`${ingredient.text}-${i}`}>
      {i > 0 && ', '}
      {ingredient.isDangerous ? (
        <mark
          className="rounded-md bg-red-100 px-1 py-0.5 font-bold text-red-700 ring-1 ring-red-200 [box-decoration-break:clone]"
          title={`Contiene: ${ingredient.triggeredBy.map((a) => labels.get(a) ?? a).join(', ')}`}
        >
          {ingredient.text}
          <span className="sr-only">
            {' '}
            (alérgeno: {ingredient.triggeredBy.map((a) => labels.get(a) ?? a).join(', ')})
          </span>
        </mark>
      ) : (
        ingredient.text
      )}
      {children.length > 0 && (
        <>
          {' ('}
          <IngredientNodes nodes={children} labels={labels} />
          {')'}
        </>
      )}
    </Fragment>
  ));
}

export function IngredientList({ ingredients, rawText, userAllergens }: Props) {
  const labels = new Map<string, string>(userAllergens.map((a) => [a.allergen, a.label]));
  const dangerousCount = ingredients.filter((i) => i.isDangerous).length;

  return (
    <section aria-labelledby="ingredients-title">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 id="ingredients-title" className="font-semibold text-slate-900">
          Ingredientes
        </h3>
        {dangerousCount > 0 && (
          <span className="text-xs font-semibold text-red-700">
            {dangerousCount} {dangerousCount === 1 ? 'coincide' : 'coinciden'} con tu perfil
          </span>
        )}
      </div>

      {ingredients.length > 0 ? (
        <p className="text-[15px] leading-7 text-slate-700">
          <IngredientNodes nodes={buildTree(ingredients)} labels={labels} />.
        </p>
      ) : rawText ? (
        <p className="text-[15px] leading-7 text-slate-700">{rawText}</p>
      ) : (
        <p className="text-sm text-slate-500 italic">Este producto no tiene ingredientes registrados.</p>
      )}
    </section>
  );
}
