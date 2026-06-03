import { useMemo, useState, type FormEvent } from "react";
import type { CategorieBudgetaire } from "../../../types/categorieBudgetaire";
import type { DraftBudgetLine, TypeLigneBudgetaire } from "../../../types/ligneBudgetaire";

interface BudgetLineFormProps {
  categories: CategorieBudgetaire[];
  onAdd: (line: DraftBudgetLine) => void;
  onError?: (message: string) => void;
}

export function BudgetLineForm({ categories, onAdd, onError }: BudgetLineFormProps) {
  const [typeLigne, setTypeLigne] = useState<TypeLigneBudgetaire>("depense");
  const [categorieId, setCategorieId] = useState("");
  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [quantite, setQuantite] = useState("");
  const [coutUnitaire, setCoutUnitaire] = useState("");
  const [montantPrevu, setMontantPrevu] = useState("");
  const [periode, setPeriode] = useState("");

  const filteredCategories = useMemo(() => categories.filter((category) => category.type_categorie === typeLigne), [categories, typeLigne]);

  function updateComputedAmount(nextQuantity: string, nextCost: string) {
    if (!nextQuantity || !nextCost) {
      setMontantPrevu("");
      return;
    }

    setMontantPrevu(String(Number(nextQuantity) * Number(nextCost)));
  }

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
      quantite: quantite ? Number(quantite) : undefined,
      cout_unitaire: coutUnitaire ? Number(coutUnitaire) : undefined,
      periode: periode || undefined,
      type_ligne: typeLigne,
      categorie_id: category.id,
      categorie_nom: category.nom,
      montant_prevu: amount,
    });
    setLibelle("");
    setDescription("");
    setQuantite("");
    setCoutUnitaire("");
    setCategorieId("");
    setMontantPrevu("");
    setPeriode("");
  }

  return (
    <form className="rounded-lg border border-[#E5E7EB] bg-white p-5 text-left shadow-sm" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold text-[#1F2937]">Ajouter une ligne budgetaire</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-[#374151]">
          Type *
          <select className="input-field" value={typeLigne} onChange={(event) => handleTypeChange(event.target.value as TypeLigneBudgetaire)}>
            <option value="depense">Depense</option>
            <option value="recette">Recette</option>
          </select>
        </label>
        <label className="text-sm font-medium text-[#374151]">
          Categorie *
          <select className="input-field" required value={categorieId} onChange={(event) => setCategorieId(event.target.value)}>
            <option value="">Selectionner</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-[#374151]">
          Montant prevu *
          <input className="input-field disabled:bg-[#F3F4F6] disabled:text-[#6B7280]" disabled min={0} step="0.01" type="number" value={montantPrevu} />
        </label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-[#374151]">
          Libelle *
          <input className="input-field" required value={libelle} onChange={(event) => setLibelle(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-[#374151]">
          Quantite *
          <input
            className="input-field"
            min={0}
            required
            step="0.01"
            type="number"
            value={quantite}
            onChange={(event) => {
              const nextQuantity = event.target.value;
              setQuantite(nextQuantity);
              updateComputedAmount(nextQuantity, coutUnitaire);
            }}
          />
        </label>
        <label className="text-sm font-medium text-[#374151]">
          Cout unitaire *
          <input
            className="input-field"
            min={0}
            required
            step="0.01"
            type="number"
            value={coutUnitaire}
            onChange={(event) => {
              const nextCost = event.target.value;
              setCoutUnitaire(nextCost);
              updateComputedAmount(quantite, nextCost);
            }}
          />
        </label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-[#374151]">
          Description
          <input className="input-field" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="text-sm font-medium text-[#374151]">
          Periode ou mois concerne
          <input className="input-field" type="month" value={periode} onChange={(event) => setPeriode(event.target.value)} />
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <button className="btn-primary rounded-md px-5 py-2 text-sm font-semibold" type="submit">
          Ajouter la ligne
        </button>
      </div>
    </form>
  );
}
