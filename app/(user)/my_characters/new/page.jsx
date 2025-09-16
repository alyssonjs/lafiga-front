"use client";

import { useRouter } from "next/navigation";
import PlayerCharacterFormDialog from "../../../_components/character/PlayerCharacterFormDialog";

export default function NewPlayerCharacterPage() {
  const router = useRouter();

  const handleClose = () => router.push("/my_characters");
  const handleSave = () => router.push("/my_characters");

  return (
    <PlayerCharacterFormDialog
      isOpen={true}
      onClose={handleClose}
      onSave={handleSave}
      inline
    />
  );
}
