"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PlayerCharacterFormDialog from "../../../_components/character/PlayerCharacterFormDialog";
import { useAuth } from "../../../_context/AuthContext";
import { crudFor } from "../../../_services/railsApi";

export default function NewPlayerCharacterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { role } = useAuth();
  const [character, setCharacter] = useState(null);
  const [initialStep, setInitialStep] = useState(null);
  const charactersApi = useMemo(() => crudFor("characters", role), [role]);

  const handleClose = () => router.push("/my_characters");
  const handleSave = () => router.push("/my_characters");

  useEffect(() => {
    const cid = params?.get('cid');
    const step = params?.get('step');
    if (step) setInitialStep(Number(step));
    if (!cid || !role) return;
    (async () => {
      try {
        const res = await charactersApi.getOne(cid);
        setCharacter(res.character || res);
        if (!step && (res.character?.current_step || res.current_step)) {
          setInitialStep(res.character?.current_step || res.current_step);
        }
      } catch (e) {
        console.error('Falha ao carregar personagem', e);
      }
    })();
  }, [params, role]);

  return (
    <PlayerCharacterFormDialog
      isOpen={true}
      onClose={handleClose}
      onSave={handleSave}
      inline
      character={character}
      initialStep={initialStep}
    />
  );
}
