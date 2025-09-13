"use client";

import { useState } from "react";
import KnownLevelPanel from "./KnownLevelPanel";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "./UI/Dialog";
import { apiClient } from "../_lib/api/client";

// Renders per-level known spell panels. `byLevel` = { 0: ['Light', ...], 1: ['Sleep', ...], ... }
export default function SpellsKnownPanel({ byLevel = {}, spellDict = {}, styles = {} }) {
  const levels = Object.keys(byLevel)
    .map(n => parseInt(n, 10))
    .filter(n => !Number.isNaN(n))
    .sort((a,b)=>a-b);
  const [modal, setModal] = useState({ open: false, title: '', body: '' });
  const openInfo = async (name) => {
    const key = name?.trim?.() || name;
    let entry = (spellDict && spellDict[key]) || null;
    let desc = entry?.desc || entry?.description || entry?.higher_level || null;
    if (!desc && entry?.id) {
      try {
        const res = await apiClient.get(`/api/v1/public/spells/${entry.id}`);
        const spell = res.spell || {};
        desc = spell.desc || spell.higher_level || null;
      } catch (_) {
        // ignore
      }
    }
    if (!desc) desc = 'Descrição indisponível.';
    setModal({ open: true, title: name, body: Array.isArray(desc) ? desc.join('\n\n') : desc });
  };
  const closeInfo = () => setModal({ open: false, title: '', body: '' });

  return (
    <>
      <div className={styles.knownContainer}>
        {levels.map(lvl => (
          <KnownLevelPanel key={`lvl-${lvl}`} level={lvl} spells={byLevel[lvl] || []} onSpellClick={openInfo} styles={styles} />
        ))}
      </div>
      <Dialog isOpen={modal.open} onClose={closeInfo} size="md">
        <DialogHeader>
          <DialogTitle>{modal.title}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className={styles.featureDesc}>{modal.body}</div>
        </DialogContent>
        <DialogFooter>
          <button className={styles.stepTab} onClick={closeInfo}>Fechar</button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
