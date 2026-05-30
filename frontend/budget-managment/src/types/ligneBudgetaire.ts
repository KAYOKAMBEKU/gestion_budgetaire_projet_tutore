import type { CategorieBudgetaire } from "./categorieBudgetaire";

export type TypeLigneBudgetaire = "recette" | "depense";

export interface LigneBudgetaire {
  id: number;
  libelle: string;
  description?: string | null;
  montant_prevu: number;
  montant_realise: number;
  ecart_montant: number;
  ecart_pourcentage: number;
  type_ligne: TypeLigneBudgetaire;
  budget_id: number;
  categorie_id: number;
  categorie?: CategorieBudgetaire | null;
}

export interface LigneBudgetaireCreate {
  libelle: string;
  description?: string;
  montant_prevu: number;
  type_ligne: TypeLigneBudgetaire;
  budget_id: number;
  categorie_id: number;
}

export interface DraftBudgetLine {
  libelle: string;
  description?: string;
  quantite?: number;
  cout_unitaire?: number;
  periode?: string;
  montant_prevu: number;
  type_ligne: TypeLigneBudgetaire;
  categorie_id: number;
  categorie_nom: string;
}
