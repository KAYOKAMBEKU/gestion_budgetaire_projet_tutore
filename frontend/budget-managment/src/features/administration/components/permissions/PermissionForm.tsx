import { useState, type FormEvent } from "react";
import { FormShell, inputClass, labelClass } from "../FormShell";
import type { Permission, PermissionCreate, PermissionUpdate } from "../../../../types/permission";

interface PermissionFormProps {
  permission?: Permission;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: PermissionCreate | PermissionUpdate) => void;
}

export function PermissionForm({ permission, loading, onCancel, onSubmit }: PermissionFormProps) {
  const [code, setCode] = useState(permission?.code ?? "");
  const [description, setDescription] = useState(permission?.description ?? "");
  const isEditing = Boolean(permission);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) {
      return;
    }
    onSubmit({ code, description: description || undefined });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormShell loading={loading} onCancel={onCancel} submitLabel={isEditing ? "Modifier" : "Creer"} title={isEditing ? "Modifier la permission" : "Nouvelle permission"}>
        <label className={labelClass}>
          Code *
          <input className={inputClass} placeholder="users:create" required value={code} onChange={(event) => setCode(event.target.value)} />
        </label>
        <label className={labelClass}>
          Description
          <textarea className={inputClass} rows={3} value={description ?? ""} onChange={(event) => setDescription(event.target.value)} />
        </label>
      </FormShell>
    </form>
  );
}
