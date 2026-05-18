import { useMemo, useState, type FormEvent } from "react";
import type { CategorieBudgetaire } from "../../../types/categorieBudgetaire";
import type { DraftBudgetLine, TypeLigneBudgetaire } from "../../../types/ligneBudgetaire";

interface BudgetLineFormProps {
  categories: CategorieBudgetaire[];
  onAdd: (line: DraftBudgetLine) => void;
  onError?: (message: string) => void;
}

const inputClass =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500";

export function BudgetLineForm({ categories, onAdd, onError }: BudgetLineFormProps) {
  const [typeLigne, setTypeLigne] = useState<TypeLigneBudgetaire>("depense");
  const [categorieId, setCategorieId] = useState("");
  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [montantPrevu, setMontantPrevu] = useState("");

  const filteredCategories = useMemo(() => categories.filter((category) => category.type_categorie === typeLigne), [categories, typeLigne]);

  function handleTypeChange(value: TypeLigneBudgetaire) {
    setTypeLigne(value);
    setCategorieId("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(montantPrevu);
    const category = categories.find((item) => item.id === Number(categorieId));

    if (!libelle.trim() || !category || Number.isNaN(amount) || amount < 0) {
      onError?.("Veuillez renseigner un libelle, une categorie et un montant prevu valide.");
      return;
    }

    onAdd({
      libelle,
      description: description || undefined,
      type_ligne: typeLigne,
      categorie_id: category.id,
      categorie_nom: category.nom,
      montant_prevu: amount,
    });
    setLibelle("");
    setDescription("");
    setCategorieId("");
    setMontantPrevu("");
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold text-slate-950">Ajouter une ligne budgetaire</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Type *
          <select className={inputClass} value={typeLigne} onChange={(event) => handleTypeChange(event.target.value as TypeLigneBudgetaire)}>
            <option value="depense">Depense</option>
            <option value="recette">Recette</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Categorie *
          <select className={inputClass} required value={categorieId} onChange={(event) => setCategorieId(event.target.value)}>
            <option value="">Selectionner</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Montant prevu *
          <input className={inputClass} min={0} required step="0.01" type="number" value={montantPrevu} onChange={(event) => setMontantPrevu(event.target.value)} />
        </label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Libelle *
          <input className={inputClass} required value={libelle} onChange={(event) => setLibelle(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Description
          <input className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <button className="rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
          Ajouter la ligne
        </button>
      </div>
    </form>
  );
}
