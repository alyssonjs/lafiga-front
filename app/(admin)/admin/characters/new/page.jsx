"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import CharacterFormDialog from "../../../_components/character/CharacterFormDialog";
import { useAuth } from "../../../_context/AuthContext";
import { crudFor } from "../../../_services/railsApi";

export default function NewAdminCharacterPage() {
  const router = useRouter();
  const { role } = useAuth();
  const charactersApi = useMemo(() => crudFor("characters", role), [role]);

  const handleClose = () => router.push("/admin/characters");
  const handleSave = () => router.push("/admin/characters");

  return (
    <CharacterFormDialog
      isOpen={true}
      onClose={handleClose}
      onSave={handleSave}
      charactersApi={charactersApi}
      inline
    />
  );
}
