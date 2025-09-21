"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { crudFor } from "../../_services/railsApi";
import { apiClient } from "../../_lib/api/client";
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
  const [resolvedId, setResolvedId] = useState(null);

  // Slugify helper (PT-BR friendly)
  const slugify = (str) => {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\w]+/g, '')
  };

  // Resolve id that may be a slug (e.g., 'ladinotrapaceiroarcano') into numeric klass id
  useEffect(() => {
    (async () => {
      try {
        setError(null);
        if (!id) { setResolvedId(null); return; }
        // If already numeric, use directly
        if (/^\d+$/.test(String(id))) { setResolvedId(String(id)); return; }
        // Fetch all classes and try to match by slug prefix or api_index
        const res = await klassesApi.getAll();
        const list = Array.isArray(res.klasses) ? res.klasses : (Array.isArray(res) ? res : []);
        // First try api_index exact (e.g., 'rogue')
        let hit = list.find(k => String(k.api_index || '').toLowerCase() === String(id).toLowerCase());
        if (!hit) {
          const slug = slugify(id);
          // Compute class slugs from translated names (PT-BR)
          const withSlugs = list.map(k => ({ ...k, _slug: slugify(k.name || k.api_index || '') }));
          // Exact slug match
          hit = withSlugs.find(k => k._slug === slug);
          // Prefix match (e.g., 'ladinotrapaceiroarcano' starts with 'ladino')
          if (!hit) hit = withSlugs.find(k => slug.startsWith(k._slug));
        }
        if (hit && hit.id != null) {
          setResolvedId(String(hit.id));
        } else {
          setResolvedId(null);
          setError(`Classe não encontrada para identificador: ${id}`);
        }
      } catch (e) {
        setResolvedId(null);
        setError(e.message || 'Falha ao resolver classe');
      }
    })();
  }, [id, klassesApi]);

  useEffect(() => {
    if (!resolvedId) return;
    (async () => {
      try {
        const [klassRes, levelsRes, subRes, spellsRes] = await Promise.all([
          klassesApi.getOne(resolvedId),
          apiClient.get(`/api/v1/public/klasses/${resolvedId}/levels`),
          subKlassesApi.getAll(),
          spellsApi.getAll({ klass_id: resolvedId }),
        ]);
        const klassObj = klassRes.klass || klassRes;
        const levels = levelsRes.class_levels || levelsRes;
        setKlass(klassObj);
        setLevels(levels || []);
        const list = (subRes?.sub_klasses || []).filter((s) => String(s.klass_id) === String(resolvedId));
        setSubclasses(list);
        setSpells(spellsRes?.spells || []);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, [resolvedId, klassesApi, subKlassesApi, spellsApi]);

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
