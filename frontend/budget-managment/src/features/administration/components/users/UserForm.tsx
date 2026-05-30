import { useState, type FormEvent } from "react";
import { FormShell, inputClass, labelClass } from "../FormShell";
import type { Role } from "../../../../types/role";
import type { User, UserCreate, UserStatus, UserUpdate } from "../../../../types/user";

interface UserFormProps {
  user?: User;
  roles: Role[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: UserCreate | UserUpdate) => void;
}

export function UserForm({ user, roles, loading, onCancel, onSubmit }: UserFormProps) {
  const [nom, setNom] = useState(user?.nom ?? "");
  const [prenom, setPrenom] = useState(user?.prenom ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [motDePasse, setMotDePasse] = useState("");
  const [statut, setStatut] = useState<UserStatus>(user?.statut ?? "actif");
  const [roleIds, setRoleIds] = useState<number[]>(user?.roles?.map((role) => role.id) ?? []);
  const isEditing = Boolean(user);

  function toggleRole(id: number) {
    setRoleIds((current) => (current.includes(id) ? current.filter((roleId) => roleId !== id) : [...current, id]));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nom.trim() || !email.trim() || (!isEditing && !motDePasse.trim())) {
      return;
    }

    const payload: UserCreate | UserUpdate = {
      nom,
      prenom: prenom || undefined,
      email,
      statut,
      role_ids: roleIds,
      ...(motDePasse ? { mot_de_passe: motDePasse } : {}),
    };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormShell loading={loading} onCancel={onCancel} submitLabel={isEditing ? "Modifier" : "Creer"} title={isEditing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            Nom *
            <input className={inputClass} required value={nom} onChange={(event) => setNom(event.target.value)} />
          </label>
          <label className={labelClass}>
            Prenom
            <input className={inputClass} value={prenom ?? ""} onChange={(event) => setPrenom(event.target.value)} />
          </label>
          <label className={labelClass}>
            Email *
            <input className={inputClass} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className={labelClass}>
            Mot de passe {isEditing ? "" : "*"}
            <input className={inputClass} minLength={8} required={!isEditing} type="password" value={motDePasse} onChange={(event) => setMotDePasse(event.target.value)} />
          </label>
          <label className={labelClass}>
            Statut
            <select className={inputClass} value={statut} onChange={(event) => setStatut(event.target.value as UserStatus)}>
              <option value="actif">actif</option>
              <option value="inactif">inactif</option>
            </select>
          </label>
        </div>
        <div>
          <p className={labelClass}>Roles</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {roles.map((role) => (
              <label className="flex items-center gap-2 rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-[#6B7280]" key={role.id}>
                <input checked={roleIds.includes(role.id)} type="checkbox" onChange={() => toggleRole(role.id)} />
                {role.nom_role}
              </label>
            ))}
          </div>
        </div>
      </FormShell>
    </form>
  );
}
