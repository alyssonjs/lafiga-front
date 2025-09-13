"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../_context/AuthContext";
import { crudFor } from "../../../_services/railsApi";
import styles from "../../../_styles/character/CharacterForm.module.css";

export default function MagicItemsIndexPage() {
  const { role } = useAuth();
  const api = useMemo(() => crudFor("magic_items", role || 'admin'), [role]);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAll({ q });
      setItems(res.magic_items || res.data?.magic_items || []);
    } catch (e) { /* noop */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 16 }}>
      <div className={styles.panel} style={{ marginBottom: 12 }}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>Itens Mágicos</div>
          <Link className={styles.stepTab} href="/admin/magic-items/new">+ Novo Item Mágico</Link>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className={styles.inputText} placeholder="Buscar por nome..." value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className={styles.stepTab} onClick={load} disabled={loading}>Buscar</button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>Catálogo</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap: 8, padding: '0 8px', marginBottom: 6, color: 'var(--text-secondary)' }}>
          <div>Nome</div><div>Raridade</div><div>Categoria</div><div>Sintoniza?</div>
        </div>
        {items.map((it) => (
          <div key={it.slug || it.id} className={styles.panel} style={{ marginBottom: 6, padding: 8 }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap: 8, alignItems:'center' }}>
              <div style={{ fontWeight: 700 }}>{it.name}</div>
              <div>{it.rarity || '-'}</div>
              <div>{it.category || '-'}</div>
              <div>{it.requires_attunement ? 'Sim' : 'Não'}</div>
            </div>
          </div>
        ))}
        {(!loading && items.length === 0) && (
          <div className={styles.small} style={{ color:'var(--text-secondary)' }}>Nenhum item cadastrado.</div>
        )}
      </div>
    </div>
  );
}

