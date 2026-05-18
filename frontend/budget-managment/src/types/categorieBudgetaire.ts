export type TypeCategorieBudgetaire = "recette" | "depense";

export interface CategorieBudgetaire {
  id: number;
  nom: string;
  description?: string | null;
  type_categorie: TypeCategorieBudgetaire;
}
