import type { Budget, BudgetStatus } from "../../../types/budget";
import type { LigneBudgetaire } from "../../../types/ligneBudgetaire";

export const budgetStatusLabels: Record<BudgetStatus, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  soumis_gestionnaire: "Soumis au Gestionnaire",
  valide: "Valide",
  valide_gestionnaire: "Valide par le Gestionnaire",
  soumis_admin: "Soumis a l'Administrateur",
  approuve_admin: "Approuve par l'Administrateur",
  rejete: "Rejete",
  rejete_gestionnaire: "Rejete par le Gestionnaire",
  rejete_admin: "Rejete par l'Administrateur",
  en_execution: "En execution",
  execute: "Execute",
  cloture: "Cloture",
};

export const budgetStatusTones: Record<BudgetStatus, string> = {
  brouillon: "bg-slate-100 text-slate-700 ring-slate-200",
  soumis: "bg-amber-50 text-amber-700 ring-amber-200",
  soumis_gestionnaire: "bg-amber-50 text-amber-700 ring-amber-200",
  valide: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  valide_gestionnaire: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  soumis_admin: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  approuve_admin: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejete: "bg-rose-50 text-rose-700 ring-rose-200",
  rejete_gestionnaire: "bg-rose-50 text-rose-700 ring-rose-200",
  rejete_admin: "bg-rose-50 text-rose-700 ring-rose-200",
  en_execution: "bg-blue-50 text-blue-700 ring-blue-200",
  execute: "bg-violet-50 text-violet-700 ring-violet-200",
  cloture: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function sumByType(lines: LigneBudgetaire[], type: "recette" | "depense") {
  return lines.filter((line) => line.type_ligne === type).reduce((sum, line) => sum + Number(line.montant_prevu || 0), 0);
}

export function getBudgetWarnings(budget: Budget, lines: LigneBudgetaire[]) {
  const warnings: string[] = [];
  const projectStart = budget.projet?.date_debut_prevue;
  const projectEnd = budget.projet?.date_fin_prevue;
  const exerciceStart = budget.exercice?.date_debut;
  const exerciceEnd = budget.exercice?.date_fin;

  if (projectStart && exerciceStart && projectStart < exerciceStart) {
    warnings.push("La date de debut du projet precede celle de l'exercice budgetaire.");
  }
  if (projectEnd && exerciceEnd && projectEnd > exerciceEnd) {
    warnings.push("La date de fin du projet depasse celle de l'exercice budgetaire.");
  }
  if (projectStart && projectEnd && exerciceStart && exerciceEnd && (projectStart > exerciceStart || projectEnd < exerciceEnd)) {
    warnings.push("La periode du projet ne couvre pas toute la periode de l'exercice budgetaire.");
  }
  if (lines.some((line) => !line.libelle || !line.categorie_id || Number(line.montant_prevu || 0) <= 0)) {
    warnings.push("Certaines lignes budgetaires semblent incompletes.");
  }

  return warnings;
}
