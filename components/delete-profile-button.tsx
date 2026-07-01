"use client";

import { Trash2 } from "lucide-react";
import { deleteProfile } from "@/app/admin/actions";

interface Props {
  profileId: string;
  profileName: string;
  roleLabel: string;
}

export function DeleteProfileButton({ profileId, profileName, roleLabel }: Props) {

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm(`Tem a certeza que deseja eliminar ${roleLabel} "${profileName}"?`)) return;
    const result = await deleteProfile(profileId);
    if (result.error) {
      alert("Erro: " + result.error);
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-600 hover:bg-red-600 hover:text-white transition-colors"
      >
        <Trash2 size={14} /> Eliminar
      </button>
    </form>
  );
}
