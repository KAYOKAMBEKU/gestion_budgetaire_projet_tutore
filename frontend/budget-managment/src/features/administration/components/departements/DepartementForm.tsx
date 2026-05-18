import { useState, type FormEvent } from "react";
import { FormShell, inputClass, labelClass } from "../FormShell";
import type { Departement, DepartementCreate, DepartementStatus, DepartementUpdate } from "../../../../types/departement";

interface DepartementFormProps {
  departement?: Departement;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: DepartementCreate | DepartementUpdate) => void;
}

export function DepartementForm({ departement, loading, onCancel, onSubmit }: DepartementFormProps) {
  const [nom, setNom] = useState(departement?.nom ?? "");
  const [description, setDescription] = useState(departement?.description ?? "");
  const [responsable, setResponsable] = useState(departement?.responsable ?? "");
  const [statut, setStatut] = useState<DepartementStatus>(departement?.statut ?? "actif");
  const isEditing = Boolean(departement);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nom.trim()) {
      return;
    }
    onSubmit({ nom, description: description || undefined, responsable: responsable || undefined, statut });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormShell loading={loading} onCancel={onCancel} submitLabel={isEditing ? "Modifier" : "Creer"} title={isEditing ? "Modifier le departement" : "Nouveau departement"}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Nom *
            <input className={inputClass} required value={nom} onChange={(event) => setNom(event.target.value)} />
          </label>
          <label className={labelClass}>
            Responsable
            <input className={inputClass} value={responsable ?? ""} onChange={(event) => setResponsable(event.target.value)} />
          </label>
          <label className={labelClass}>
            Statut
            <select className={inputClass} value={statut} onChange={(event) => setStatut(event.target.value as DepartementStatus)}>
              <option value="actif">actif</option>
              <option value="inactif">inactif</option>
            </select>
          </label>
        </div>
        <label className={labelClass}>
          Description
          <textarea className={inputClass} rows={3} value={description ?? ""} onChange={(event) => setDescription(event.target.value)} />
        </label>
      </FormShell>
    </form>
  );
}
