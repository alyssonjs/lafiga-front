"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../_context/AuthContext";
import { crudFor } from "../../../_services/railsApi";
import styles from "../../../_styles/character/CharacterForm.module.css";
import { useRouter } from "next/navigation";

function FieldRow({ label, children }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap: 8, alignItems:'center', marginBottom: 8 }}>
      <div className={styles.small} style={{ color: 'var(--text-secondary)' }}><strong>{label}</strong></div>
      <div>{children}</div>
    </div>
  );
}

export default function MagicItemsNewPage() {
  const { role } = useAuth();
  const api = useMemo(() => crudFor("magic_items", role || 'admin'), [role]);
  const sheetsApi = useMemo(() => crudFor("sheets", 'admin'), []);
  const sheetItemsApi = useMemo(() => crudFor("sheet_items", 'admin'), []);
  const charactersApi = useMemo(() => crudFor("characters", 'admin'), []);
  const router = useRouter();

  const [form, setForm] = useState({
    name: '', rarity: 'uncommon', category: '', sub_category: '', source: '',
    requires_attunement: false, attunement_note: '', weight_kg: '', value_gp: '',
    bonuses: { ac: 0, attack: 0, damage: 0 }, properties: {}, tags: [], description: ''
  });
  const [tagsText, setTagsText] = useState('');
  const [propsText, setPropsText] = useState('{}');
  const [bonuses, setBonuses] = useState({ ac: 0, attack: 0, damage: 0 });
  const [saving, setSaving] = useState(false);
  const [effects, setEffects] = useState([]);

  // Attach to inventory (optional)
  const [attachNow, setAttachNow] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingSheets(true);
      try {
        const [sres, cres] = await Promise.all([
          sheetsApi.getAll(),
          charactersApi.getAll({ per_page: 1000 }),
        ]);
        const ss = (sres.sheets || sres.data?.sheets || []).map((s) => ({ id: s.id, character_id: s.character_id }));
        const cc = (cres.characters || cres.data?.characters || []);
        setSheets(ss);
        setCharacters(cc);
      } catch (_) { /* noop */ } finally { setLoadingSheets(false); }
    };
    load();
  }, []);

  const characterNameFor = (character_id) => {
    const c = characters.find((x) => x.id === character_id);
    return c ? c.name : `Personagem ${character_id}`;
  };

  const sheetDisplay = (sheet) => `Ficha ${sheet.id} — ${characterNameFor(sheet.character_id)}`;

  function EffectsEditor({ value, onChange }) {
    const [newKind, setNewKind] = useState('attack_bonus');
    const [newEffect, setNewEffect] = useState({ kind: 'attack_bonus', value: 1, type: 'magico' });

    const knownKinds = [
      { id: 'attack_bonus', label: 'Bônus de Ataque' },
      { id: 'damage_bonus_flat', label: 'Dano + (fixo)' },
      { id: 'damage_bonus_dice', label: 'Dano + (dados)' },
      { id: 'weapon_is_magical', label: 'Arma é Mágica' },
      { id: 'ac_bonus', label: 'Bônus de CA (tipado)' },
      { id: 'set_ac_base', label: 'Definir CA Base' },
    ];

    const resetEffect = (kind) => {
      switch (kind) {
        case 'attack_bonus': return { kind, value: 1, scope: 'all', type: 'magico' };
        case 'damage_bonus_flat': return { kind, value: 1, damage_type: '' };
        case 'damage_bonus_dice': return { kind, dice: '1d6', damage_type: '' };
        case 'weapon_is_magical': return { kind, value: true };
        case 'ac_bonus': return { kind, value: 1, type: 'magico' };
        case 'set_ac_base': return { kind, base: '13 + DEX' };
        default: return { kind };
      }
    };

    const addEffect = () => {
      onChange([...(value || []), newEffect]);
      setNewEffect(resetEffect(newKind));
    };

    const updateField = (k, v) => setNewEffect({ ...newEffect, [k]: v });

    useEffect(() => {
      setNewKind(newEffect.kind || 'attack_bonus');
    }, [newEffect.kind]);

    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}><div className={styles.panelTitle}>Efeitos</div></div>
        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap: 8 }}>
          <div>
            <label className={styles.small} style={{ color:'var(--text-secondary)' }}>Tipo de Efeito</label>
            <select className={styles.inputText} value={newKind} onChange={(e)=>{ const k=e.target.value; setNewKind(k); setNewEffect(resetEffect(k)); }}>
              {knownKinds.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </div>
          <div>
            {newKind === 'attack_bonus' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label className={styles.small}>Valor</label>
                  <input className={styles.inputText} type="number" value={newEffect.value || 0} onChange={(e)=>updateField('value', Number(e.target.value))} />
                </div>
                <div>
                  <label className={styles.small}>Escopo</label>
                  <select className={styles.inputText} value={newEffect.scope || 'all'} onChange={(e)=>updateField('scope', e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="melee">Corpo a Corpo</option>
                    <option value="ranged">À Distância</option>
                    <option value="spell">Magias</option>
                  </select>
                </div>
                <div>
                  <label className={styles.small}>Tipo</label>
                  <input className={styles.inputText} placeholder="magico, circunstancial..." value={newEffect.type || ''} onChange={(e)=>updateField('type', e.target.value)} />
                </div>
              </div>
            )}
            {newKind === 'damage_bonus_flat' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
                <div>
                  <label className={styles.small}>Valor</label>
                  <input className={styles.inputText} type="number" value={newEffect.value || 0} onChange={(e)=>updateField('value', Number(e.target.value))} />
                </div>
                <div>
                  <label className={styles.small}>Tipo de Dano</label>
                  <input className={styles.inputText} placeholder="fogo, gelo, cortante..." value={newEffect.damage_type || ''} onChange={(e)=>updateField('damage_type', e.target.value)} />
                </div>
              </div>
            )}
            {newKind === 'damage_bonus_dice' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
                <div>
                  <label className={styles.small}>Dados</label>
                  <input className={styles.inputText} placeholder="1d6, 2d4..." value={newEffect.dice || ''} onChange={(e)=>updateField('dice', e.target.value)} />
                </div>
                <div>
                  <label className={styles.small}>Tipo de Dano</label>
                  <input className={styles.inputText} placeholder="fogo, gelo, cortante..." value={newEffect.damage_type || ''} onChange={(e)=>updateField('damage_type', e.target.value)} />
                </div>
              </div>
            )}
            {newKind === 'weapon_is_magical' && (
              <div>
                <label className={styles.small}>Arma é mágica?</label>
                <label style={{ display:'inline-flex', alignItems:'center', gap: 6, marginLeft: 8 }}>
                  <input type="checkbox" checked={!!newEffect.value} onChange={(e)=>updateField('value', e.target.checked)} />
                  Sim
                </label>
              </div>
            )}
            {newKind === 'ac_bonus' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
                <div>
                  <label className={styles.small}>AC +</label>
                  <input className={styles.inputText} type="number" value={newEffect.value || 0} onChange={(e)=>updateField('value', Number(e.target.value))} />
                </div>
                <div>
                  <label className={styles.small}>Tipo de bônus</label>
                  <input className={styles.inputText} placeholder="magico, escudo, circunstancial..." value={newEffect.type || ''} onChange={(e)=>updateField('type', e.target.value)} />
                </div>
              </div>
            )}
            {newKind === 'set_ac_base' && (
              <div>
                <label className={styles.small}>Fórmula de CA Base</label>
                <input className={styles.inputText} placeholder="ex.: 13 + DEX" value={newEffect.base || ''} onChange={(e)=>updateField('base', e.target.value)} />
                <div className={styles.small} style={{ color:'var(--text-secondary)' }}>
                  Observação: aplicar a fórmula exige suporte no cálculo de AC (feito futuramente).
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop: 8 }}>
          <button type="button" className={styles.stepTab} onClick={addEffect}>Adicionar efeito</button>
        </div>

        {(value || []).length > 0 && (
          <div className={styles.panel} style={{ marginTop: 8 }}>
            <div className={styles.panelHeader}><div className={styles.panelTitle}>Efeitos adicionados</div></div>
            {(value || []).map((e, idx) => (
              <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap: 8, alignItems:'center', padding: 8, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div><strong>{e.kind}</strong></div>
                  <div className={styles.small} style={{ color:'var(--text-secondary)' }}>{JSON.stringify(e)}</div>
                </div>
                <div>
                  <button className={styles.stepTab} onClick={()=>onChange(value.filter((_,i)=>i!==idx))}>Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      let propsJSON = {};
      try { propsJSON = JSON.parse(propsText || '{}'); } catch(_) { propsJSON = {}; }
      const payload = {
        ...form,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        value_gp: form.value_gp ? Number(form.value_gp) : null,
        bonuses: bonuses,
        effects: effects,
        properties: propsJSON,
        tags: tagsText.split(',').map(s=>s.trim()).filter(Boolean)
      };
      const res = await api.create(payload);
      const created = res.magic_item || res.data?.magic_item || res;
      // Optional: attach to selected sheets
      if (attachNow && selectedSheets.length > 0) {
        const slug = (created.slug || '').toString();
        const name = created.name || form.name;
        const category = created.category || form.category || 'magic_item';
        for (const sid of selectedSheets) {
          try {
            await sheetItemsApi.create({
              sheet_id: sid,
              item_name: name,
              category: category,
              quantity: 1,
              equipped: false,
              source: 'admin',
              props_json: { magic_item_slug: slug }
            });
          } catch (e) { console.error('Falha ao anexar na ficha', sid, e); }
        }
      }
      router.push('/admin/magic-items');
    } catch (e) { console.error(e); alert('Falha ao salvar'); } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 16 }}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>Novo Item Mágico</div>
        </div>
        <FieldRow label="Nome">
          <input className={styles.inputText} value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
        </FieldRow>
        <FieldRow label="Raridade">
          <select className={styles.inputText} value={form.rarity} onChange={(e)=>setForm({...form, rarity: e.target.value})}>
            <option value="common">Comum</option>
            <option value="uncommon">Incomum</option>
            <option value="rare">Raro</option>
            <option value="very rare">Muito Raro</option>
            <option value="legendary">Lendário</option>
            <option value="artifact">Artefato</option>
          </select>
        </FieldRow>
        <FieldRow label="Categoria">
          <input className={styles.inputText} placeholder="weapon, armor, shield, wondrous item..." value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})} />
        </FieldRow>
        <FieldRow label="Subcategoria">
          <input className={styles.inputText} placeholder="ex.: longsword, breastplate" value={form.sub_category} onChange={(e)=>setForm({...form, sub_category: e.target.value})} />
        </FieldRow>
        <FieldRow label="Fonte">
          <input className={styles.inputText} value={form.source} onChange={(e)=>setForm({...form, source: e.target.value})} />
        </FieldRow>
        <FieldRow label="Sintonização?">
          <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <input type="checkbox" checked={form.requires_attunement} onChange={(e)=>setForm({...form, requires_attunement: e.target.checked})} />
            Requer sintonização
          </label>
        </FieldRow>
        <FieldRow label="Nota de sintonização">
          <input className={styles.inputText} placeholder="por conjuradores, por paladinos..." value={form.attunement_note} onChange={(e)=>setForm({...form, attunement_note: e.target.value})} />
        </FieldRow>
        <FieldRow label="Peso (kg)">
          <input className={styles.inputText} type="number" step="0.01" value={form.weight_kg} onChange={(e)=>setForm({...form, weight_kg: e.target.value})} />
        </FieldRow>
        <FieldRow label="Valor (gp)">
          <input className={styles.inputText} type="number" step="0.01" value={form.value_gp} onChange={(e)=>setForm({...form, value_gp: e.target.value})} />
        </FieldRow>
      <div className={styles.panel} style={{ margin: '12px 0' }}>
        <div className={styles.panelHeader}><div className={styles.panelTitle}>Bônus</div></div>
        <FieldRow label="AC +">
          <input className={styles.inputText} type="number" value={bonuses.ac} onChange={(e)=>setBonuses({...bonuses, ac: Number(e.target.value)})} />
        </FieldRow>
        <FieldRow label="Ataque +">
          <input className={styles.inputText} type="number" value={bonuses.attack} onChange={(e)=>setBonuses({...bonuses, attack: Number(e.target.value)})} />
        </FieldRow>
        <FieldRow label="Dano +">
          <input className={styles.inputText} type="number" value={bonuses.damage} onChange={(e)=>setBonuses({...bonuses, damage: Number(e.target.value)})} />
        </FieldRow>
      </div>
      <EffectsEditor value={effects} onChange={setEffects} />
      <FieldRow label="Propriedades (JSON)">
        <textarea className={styles.inputText} rows={6} value={propsText} onChange={(e)=>setPropsText(e.target.value)} placeholder='{"resistance":["fire"]}' />
      </FieldRow>
      <FieldRow label="Tags">
        <input className={styles.inputText} placeholder="separadas por vírgula" value={tagsText} onChange={(e)=>setTagsText(e.target.value)} />
      </FieldRow>
      <FieldRow label="Descrição">
        <textarea className={styles.inputText} rows={8} value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} />
      </FieldRow>

      <div className={styles.panel} style={{ margin: '12px 0' }}>
        <div className={styles.panelHeader}><div className={styles.panelTitle}>Vincular ao Inventário (Opcional)</div></div>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 8 }}>
          <input id="attachNow" type="checkbox" checked={attachNow} onChange={(e)=>setAttachNow(e.target.checked)} />
          <label htmlFor="attachNow">Adicionar este item ao inventário das fichas selecionadas</label>
        </div>
        {attachNow && (
          <div>
            <div className={styles.small} style={{ color:'var(--text-secondary)', marginBottom: 6 }}>Selecione fichas</div>
            <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
              {loadingSheets ? (
                <div className={styles.small}>Carregando fichas...</div>
              ) : (
                sheets.map((s) => (
                  <label key={s.id} style={{ display:'flex', gap: 8, alignItems:'center', padding:'4px 0' }}>
                    <input type="checkbox" checked={selectedSheets.includes(s.id)} onChange={(e)=>{
                      const checked = e.target.checked;
                      setSelectedSheets((prev) => checked ? [...prev, s.id] : prev.filter((id)=>id!==s.id));
                    }} />
                    <span>{sheetDisplay(s)}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap: 8 }}>
        <button className={styles.stepTab} onClick={()=>router.push('/admin/magic-items')}>Cancelar</button>
        <button className={styles.stepTab} onClick={save} disabled={saving || !form.name}>Salvar</button>
      </div>
      </div>
    </div>
  );
}
