import { useState, type FormEvent } from "react";
import { FormShell, inputClass, labelClass } from "../FormShell";
import type {
  ExerciceBudgetaire,
  ExerciceBudgetaireCreate,
  ExerciceBudgetaireStatus,
  ExerciceBudgetaireUpdate,
} from "../../../../types/exerciceBudgetaire";

interface ExerciceBudgetaireFormProps {
  exercice?: ExerciceBudgetaire;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: ExerciceBudgetaireCreate | ExerciceBudgetaireUpdate) => void;
}

export function ExerciceBudgetaireForm({ exercice, loading, onCancel, onSubmit }: ExerciceBudgetaireFormProps) {
  const [libelle, setLibelle] = useState(exercice?.libelle ?? "");
  const [dateDebut, setDateDebut] = useState(exercice?.date_debut ?? "");
  const [dateFin, setDateFin] = useState(exercice?.date_fin ?? "");
  const [statut, setStatut] = useState<ExerciceBudgetaireStatus>(exercice?.statut ?? "ouvert");
  const [dateError, setDateError] = useState("");
  const isEditing = Boolean(exercice);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!libelle.trim() || !dateDebut || !dateFin) {
      return;
    }
    if (new Date(dateFin) <= new Date(dateDebut)) {
      setDateError("La date de fin doit etre superieure a la date de debut.");
      return;
    }
    setDateError("");
    onSubmit({ libelle, date_debut: dateDebut, date_fin: dateFin, statut });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormShell loading={loading} onCancel={onCancel} submitLabel={isEditing ? "Modifier" : "Creer"} title={isEditing ? "Modifier l'exercice" : "Nouvel exercice budgetaire"}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Libelle *
            <input className={inputClass} required value={libelle} onChange={(event) => setLibelle(event.target.value)} />
          </label>
          <label className={labelClass}>
            Statut
            <select className={inputClass} value={statut} onChange={(event) => setStatut(event.target.value as ExerciceBudgetaireStatus)}>
              <option value="ouvert">ouvert</option>
              <option value="cloture">cloture</option>
            </select>
          </label>
          <label className={labelClass}>
            Date de debut *
            <input className={inputClass} required type="date" value={dateDebut} onChange={(event) => setDateDebut(event.target.value)} />
          </label>
          <label className={labelClass}>
            Date de fin *
            <input className={inputClass} required type="date" value={dateFin} onChange={(event) => setDateFin(event.target.value)} />
          </label>
        </div>
        {dateError ? <p className="rounded-md bg-[#FEE2E2] px-3 py-2 text-sm font-medium text-[#DC2626]">{dateError}</p> : null}
      </FormShell>
    </form>
  );
}
