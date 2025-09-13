"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "./UI/Dialog";
import Button from "./UI/Button";
import { crudFor } from "../_services/railsApi";
import { useAuth } from "../_context/AuthContext";
import styles from "../_styles/CharacterSheet.module.css";

const mod = (score) => Math.floor(((Number(score) || 10) - 10) / 2);
const fmtMod = (m) => (m >= 0 ? `+${m}` : `${m}`);

const CharacterSheet = ({ character, onClose, setIsEditOpen }) => {
  const { role } = useAuth();
  const sheetsApi = useMemo(() => crudFor("sheets", role || "public"), [role]);
  const skApi = useMemo(() => crudFor("sheet_klasses", role || "public"), [role]);
  const publicRacesApi = useMemo(() => crudFor("races", "public"), []);
  const publicSubRacesApi = useMemo(() => crudFor("sub_races", "public"), []);
  const publicKlassesApi = useMemo(() => crudFor("klasses", "public"), []);
  const publicSubKlassesApi = useMemo(() => crudFor("sub_klasses", "public"), []);
  const sheetItemsApi = useMemo(() => crudFor("sheet_items", role || "public"), [role]);

  const [sheet, setSheet] = useState(null);
  const [sheetKlasses, setSheetKlasses] = useState([]);
  const [races, setRaces] = useState([]);
  const [subRaces, setSubRaces] = useState([]);
  const [klasses, setKlasses] = useState([]);
  const [subKlasses, setSubKlasses] = useState([]);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const toArray = (v) => Array.isArray(v) ? v : (v ? (typeof v === 'object' ? Object.values(v) : [v]) : []);

  useEffect(() => {
    (async () => {
      try {
        const [{ sheets }, { sheet_klasses }, { races }, { sub_races }, { klasses }, { sub_klasses }] = await Promise.all([
          sheetsApi.getAll(),
          skApi.getAll(),
          publicRacesApi.getAll(),
          publicSubRacesApi.getAll(),
          publicKlassesApi.getAll(),
          publicSubKlassesApi.getAll(),
        ]);
        const s = (sheets || []).find((x) => x.character_id === character.id) || null;
        setSheet(s);
        setSheetKlasses((sheet_klasses || []).filter((sk) => s && sk.sheet_id === s.id));
        setRaces(races || []);
        setSubRaces(sub_races || []);
        setKlasses(klasses || []);
        setSubKlasses(sub_klasses || []);
        if (s) {
          try {
            const { sheet_items = [] } = await sheetItemsApi.getAll({ sheet_id: s.id });
            setItems(sheet_items);
          } catch (_) {}
        }
      } catch (e) {
        console.error(e);
        setError("Não foi possível carregar a ficha.");
      }
    })();
  }, [character?.id]);

  const race = sheet ? races.find((r) => r.id === sheet.race_id) : null;
  const subRace = sheet ? subRaces.find((sr) => sr.id === sheet.sub_race_id) : null;
  const mainSk = sheetKlasses[0] || null;
  const klass = mainSk ? klasses.find((k) => k.id === mainSk.klass_id) : null;
  const subKlass = mainSk ? subKlasses.find((sk) => sk.id === mainSk.sub_klass_id) : null;
  const level = mainSk?.level || 1;
  const profBonus = (() => {
    const lvl = Number(level) || 1;
    if (lvl >= 17) return 6; if (lvl >= 13) return 5; if (lvl >= 9) return 4; if (lvl >= 5) return 3; return 2;
  })();
  const bgSummary = sheet?.metadata?.background;
  const raceChoices = toArray(sheet?.metadata?.race_choices);
  const backgroundProficiencies = toArray(sheet?.metadata?.background_proficiencies);

  return (
    <Dialog onClose={onClose}>
      <div className={styles.sheetContainer}>
        <DialogHeader>
          <DialogTitle>{character.name}</DialogTitle>
          <DialogDescription>
            {race?.name}{subRace ? ` / ${subRace.name}` : ""} • {klass?.name}{subKlass ? ` / ${subKlass.name}` : ""} • Nível {level}
          </DialogDescription>
        </DialogHeader>

        <DialogContent>
          {error && <div className={styles.error}>{error}</div>}
          {!sheet && !error && <div>Sem ficha para este personagem.</div>}

          {sheet && (
            <div className={styles.grid}>
              <section className={styles.abilities}>
                <div className={styles.abilityBox}><span>FOR</span><strong>{sheet.str || 10}</strong><em>{fmtMod(mod(sheet.str))}</em></div>
                <div className={styles.abilityBox}><span>DES</span><strong>{sheet.dex || 10}</strong><em>{fmtMod(mod(sheet.dex))}</em></div>
                <div className={styles.abilityBox}><span>CON</span><strong>{sheet.con || 10}</strong><em>{fmtMod(mod(sheet.con))}</em></div>
                <div className={styles.abilityBox}><span>INT</span><strong>{sheet.int || 10}</strong><em>{fmtMod(mod(sheet.int))}</em></div>
                <div className={styles.abilityBox}><span>SAB</span><strong>{sheet.wis || 10}</strong><em>{fmtMod(mod(sheet.wis))}</em></div>
                <div className={styles.abilityBox}><span>CAR</span><strong>{sheet.cha || 10}</strong><em>{fmtMod(mod(sheet.cha))}</em></div>
              </section>

              <section className={styles.combat}>
                <div className={styles.panel}>
                  <div className={styles.panelTitle}>Pontos de Vida</div>
                  <div className={styles.hpRow}>Máximo: <strong>{sheet.hp_max}</strong></div>
                  <div className={styles.hpRow}>Atual: <strong>{sheet.hp_current}</strong></div>
                  <div className={styles.hpRow}>Temporário: <strong>{sheet.temp_hp}</strong></div>
                </div>
                <div className={styles.panel}>
                  <div className={styles.panelTitle}>Bônus de Proficiência</div>
                  <div className={styles.centerBig}>+{profBonus}</div>
                </div>
                <div className={styles.panel}>
                  <div className={styles.panelTitle}>Background</div>
                  <div className={styles.scrollText}>
                    {bgSummary?.name || character.background}
                    {bgSummary?.feature && (
                      <div style={{ marginTop: '10px' }}>
                        <strong>{bgSummary.feature.name}:</strong>
                        <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                          {bgSummary.feature.desc}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className={styles.details}>
                <div className={styles.panel}>
                  <div className={styles.panelTitle}>Proficiências</div>
                  <div className={styles.badges}>
                    {raceChoices.map((p) => (
                      <span className={styles.badge} key={p.id || p}>{p.name || p}</span>
                    ))}
                    {backgroundProficiencies.map((p) => (
                      <span className={styles.badge} key={p.id || p}>{p.name || p}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.panel}>
                  <div className={styles.panelTitle}>Inventário</div>
                  {items.length === 0 && <div className={styles.small}>Sem itens.</div>}
                  {items.length > 0 && (
                    <div>
                      {items.map((it) => (
                        <div key={it.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderBottom:'1px solid #eee' }}>
                          <div style={{ flex:1 }}>
                            <strong>{it.item_name}</strong>
                            <div className={styles.small}>{it.category || '—'} {it.quantity > 1 ? `x${it.quantity}` : ''}</div>
                          </div>
                          <div>
                            <label className={styles.checkbox}>
                              <input type="checkbox" checked={!!it.equipped} onChange={async (e)=>{
                                try {
                                  await sheetItemsApi.update(it.id, { equipped: e.target.checked });
                                  const { sheet_items = [] } = await sheetItemsApi.getAll({ sheet_id: sheet.id });
                                  setItems(sheet_items);
                                } catch (_) {}
                              }} /> equipado
                            </label>
                          </div>
                          <div>
                            <button className={styles.stepTab} onClick={async ()=>{
                              try { await sheetItemsApi.destroy(it.id); const { sheet_items = [] } = await sheetItemsApi.getAll({ sheet_id: sheet.id }); setItems(sheet_items); } catch(_){}
                            }}>remover</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.panel}>
                  <div className={styles.panelTitle}>Anotações</div>
                  <div className={styles.notesArea}></div>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          {setIsEditOpen && <Button variant="highlight" onClick={() => setIsEditOpen(true)}>Editar</Button>}
        </DialogFooter>
      </div>
    </Dialog>
  );
};

export default CharacterSheet;
