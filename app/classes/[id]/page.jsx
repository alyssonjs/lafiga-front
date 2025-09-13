"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { crudFor } from "../../_services/railsApi";
import styles from "../../_styles/character/CharacterForm.module.css";

const Section = ({ title, children }) => (
  <div className={styles.panel} style={{ marginTop: 12 }}>
    <div className={styles.panelTitle}>{title}</div>
    {children}
  </div>
);

export default function ClassShowPage() {
  const params = useParams();
  const id = params?.id;
  const klassesApi = useMemo(() => crudFor("klasses", "public"), []);
  const subKlassesApi = useMemo(() => crudFor("sub_klasses", "public"), []);
  const spellsApi = useMemo(() => crudFor("spells", "public"), []);

  const [klass, setKlass] = useState(null);
  const [levels, setLevels] = useState([]);
  const [subclasses, setSubclasses] = useState([]);
  const [spells, setSpells] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [{ klass }, { class_levels }, subRes, spellsRes] = await Promise.all([
          klassesApi.getOne(id),
          fetch(`/api/v1/public/klasses/${id}/levels`).then((r) => r.json()),
          subKlassesApi.getAll(),
          spellsApi.getAll({ klass_id: id }),
        ]);
        setKlass(klass);
        setLevels(class_levels || []);
        const list = (subRes?.sub_klasses || []).filter((s) => String(s.klass_id) === String(id));
        setSubclasses(list);
        setSpells(spellsRes?.spells || []);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, [id]);

  const byLevel = useMemo(() => {
    const map = {};
    (levels || []).forEach((row) => {
      map[row.level] = row;
    });
    return map;
  }, [levels]);

  if (error) return <div className={styles.error}>Erro: {error}</div>;
  if (!klass) return <div className={styles.small}>Carregando classe…</div>;

  const spellcasting = (lvl) => {
    try { return byLevel[lvl]?.spellcasting || null; } catch { return null; }
  };
  const featuresAt = (lvl) => (byLevel[lvl]?.features || []);

  return (
    <div className={styles.form} style={{ maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>{klass.name}</h1>
      <div className={styles.small}>
        Dado de Vida: d{klass.hit_die || "?"}
        {klass.spellcasting_ability && (
          <> • Habilidade de Conjuração: {klass.spellcasting_ability}</>
        )}
      </div>

      <Section title="Subclasses">
        {subclasses.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {subclasses.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        ) : (
          <div className={styles.small}>Nenhuma subclasse cadastrada.</div>
        )}
      </Section>

      <Section title="Progressão por Nível (1–20)">
        <div style={{ display: "grid", gridTemplateColumns: "60px 120px 1fr", gap: 8 }}>
          <div><strong>Nível</strong></div>
          <div><strong>Prof.</strong></div>
          <div><strong>Características</strong></div>
          {Array.from({ length: 20 }).map((_, idx) => {
            const lvl = idx + 1;
            const row = byLevel[lvl] || {};
            const feats = (row.features || []).map((f) => f.name).join(", ") || "—";
            return (
              <>
                <div key={`lvl-${lvl}`}>{lvl}</div>
                <div key={`prof-${lvl}`}>+{row.prof_bonus ?? "?"}</div>
                <div key={`feat-${lvl}`}>{feats}</div>
              </>
            );
          })}
        </div>
      </Section>

      <Section title="Magia (Resumo)">
        <div className={styles.small}>
          {levels.some((r) => r.spellcasting) ? (
            <>Esta classe possui progressão de magia. Veja detalhes por nível abaixo.</>
          ) : (
            <>Esta classe não possui magia nativa (ou é opcional por subclasse).</>
          )}
        </div>
        {Array.from({ length: 20 }).map((_, idx) => {
          const lvl = idx + 1;
          const sc = spellcasting(lvl);
          if (!sc) return null;
          let slots = {};
          try { slots = sc.spell_slots ? JSON.parse(sc.spell_slots) : {}; } catch (_) {}
          let pact = null;
          try { pact = sc.pact_slots ? JSON.parse(sc.pact_slots) : null; } catch (_) {}
          const listSlots = Object.entries(slots).map(([k, v]) => `Nível ${k}: ${v}`).join("; ") || "—";
          const pactStr = pact ? `Pacto (Warlock): ${pact.pact} slot(s) nível ${sc.pact_slot_level}` : null;
          return (
            <div key={`sc-${lvl}`} style={{ marginBottom: 6 }}>
              <strong>Nível {lvl}:</strong> {listSlots} {pactStr ? `• ${pactStr}` : ""}
            </div>
          );
        })}
      </Section>

      <Section title="Lista de Magias (por classe)">
        {spells.length ? (
          <div style={{ columns: 2 }}>
            {spells.map((s) => (
              <div key={s.id} className={styles.small}>{s.level || 0}º • {s.name}</div>
            ))}
          </div>
        ) : (
          <div className={styles.small}>Nenhuma magia associada.</div>
        )}
      </Section>
    </div>
  );
}

