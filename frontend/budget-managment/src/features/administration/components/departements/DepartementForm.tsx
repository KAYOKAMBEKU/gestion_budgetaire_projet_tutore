import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormShell, inputClass, labelClass } from "../FormShell";
import { departementService } from "../../../../services/departementService";
import type { Departement, DepartementCreate, DepartementStatus, DepartementUpdate } from "../../../../types/departement";
import type { User } from "../../../../types/user";

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
  const [gestionnaireId, setGestionnaireId] = useState<number | undefined>(undefined);
  const isEditing = Boolean(departement);

  const currentGestionnairesQuery = useQuery({
    queryKey: ["departements", departement?.id, "gestionnaires"],
    queryFn: () => departement ? departementService.getGestionnairesByDepartement(departement.id) : Promise.resolve([]),
    enabled: Boolean(departement?.id),
  });

  const availableGestionnairesQuery = useQuery({
    queryKey: ["departements", departement?.id, "gestionnaires", "available"],
    queryFn: () => departementService.getAvailableGestionnaires(departement?.id),
  });

  useEffect(() => {
    if (!gestionnaireId && currentGestionnairesQuery.data?.length) {
      setGestionnaireId(currentGestionnairesQuery.data[0].id);
    }
  }, [currentGestionnairesQuery.data, gestionnaireId]);

  useEffect(() => {
    if (!gestionnaireId || !availableGestionnairesQuery.data) {
      return;
    }
    const selected = availableGestionnairesQuery.data.find((user) => user.id === gestionnaireId);
    if (selected) {
      setResponsable(`${selected.nom} ${selected.prenom ?? ""}`.trim());
    }
  }, [gestionnaireId, availableGestionnairesQuery.data]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nom.trim()) {
      return;
    }
    onSubmit({
      nom,
      description: description || undefined,
      responsable: responsable || undefined,
      statut,
      gestionnaire_id: gestionnaireId,
    });
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
            <input
              className={inputClass}
              value={responsable ?? ""}
              onChange={(event) => setResponsable(event.target.value)}
              readOnly={Boolean(gestionnaireId)}
              placeholder={gestionnaireId ? "Responsable déterminé par le gestionnaire" : "Nom du responsable"}
            />
          </label>
          <label className={labelClass}>
            Gestionnaire
            <select
              className={inputClass}
              value={gestionnaireId ?? ""}
              onChange={(event) => setGestionnaireId(event.target.value ? Number(event.target.value) : undefined)}
              disabled={availableGestionnairesQuery.isLoading}
            >
              <option value="">Aucun</option>
              {availableGestionnairesQuery.data?.map((user: User) => (
                <option key={user.id} value={user.id}>
                  {user.nom} {user.prenom ?? ""} - {user.email}
                </option>
              ))}
            </select>
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
