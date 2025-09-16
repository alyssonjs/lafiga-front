"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "../UI/Dialog";
import TextArea from "../UI/TextArea";
import Button from "../UI/Button";
import Select from "../UI/Select";
import Input from "../UI/Input";
import { useAuth } from "../../_context/AuthContext";
import { crudFor } from "../../_services/railsApi";
import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../UI/Card";
import StepperNav from "../characterSteps/StepperNav";
import StepConcept from "../characterSteps/StepConcept";
import StepRace from "../characterSteps/StepRace";
import StepClass from "../characterSteps/StepClass";
import StepAbilities from "../characterSteps/StepAbilities";
import StepReview from "../characterSteps/StepReview";



const CharacterFormDialog = ({ 
  character,
  isOpen,
  onClose,
  onSave, 
  charactersApi,
  inline = false
 }) => {
  const isEdit = Boolean(character);

  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [groupId, setGroupId] = useState("");
  const [userId, setUserId] = useState("");
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [races, setRaces] = useState([]);
  const [subRaces, setSubRaces] = useState([]);
  const [klasses, setKlasses] = useState([]);
  const [subKlasses, setSubKlasses] = useState([]);

  const [raceId, setRaceId] = useState("");
  const [subRaceId, setSubRaceId] = useState("");
  const [klassId, setKlassId] = useState("");
  const [subKlassId, setSubKlassId] = useState("");
  const [level, setLevel] = useState(1);

  const [str, setStr] = useState(10);
  const [dex, setDex] = useState(10);
  const [con, setCon] = useState(10);
  const [intA, setIntA] = useState(10);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(10);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  // Stepper state (D&D 5e guided creation)
  const steps = [
    { id: 0, name: "Conceito" },
    { id: 1, name: "Raça" },
    { id: 2, name: "Classe" },
    { id: 3, name: "Atributos" },
    { id: 4, name: "Revisão" },
  ];
  const [stepIndex, setStepIndex] = useState(0);
  // Ability score method per D&D 5e
  const [abilityMethod, setAbilityMethod] = useState("manual"); // manual | point_buy | standard_array
  const { role, user } = useAuth();
  const groupsApi = useMemo(
    () => crudFor("groups", role),
    [role]
  );
  const usersApi = useMemo(
    () => crudFor("users", role),
    [role]
  );
  const sheetsApi = useMemo(
    () => crudFor("sheets", role),
    [role]
  );
  const sheetKlassesApi = useMemo(
    () => crudFor("sheet_klasses", role),
    [role]
  );
  const publicRacesApi = useMemo(() => crudFor("races", "public"), []);
  const publicSubRacesApi = useMemo(() => crudFor("sub_races", "public"), []);
  const publicKlassesApi = useMemo(() => crudFor("klasses", "public"), []);
  const publicSubKlassesApi = useMemo(() => crudFor("sub_klasses", "public"), []);
  useEffect(() => {
    if (isEdit) {
      setName(character.name);
      setBackground(character.background);
      setGroupId(character.group_id);
      setUserId(character.user_id);
      // D&D fields não editados aqui por simplicidade
    } else {
      setName("");
      setBackground("");
      setGroupId("");
      setUserId(user?.id || "");
      setRaceId("");
      setSubRaceId("");
      setKlassId("");
      setSubKlassId("");
      setLevel(1);
      setStr(10); setDex(10); setCon(10); setIntA(10); setWis(10); setCha(10);
    }
    setError(null);
    setSuccessMessage(null);
    setStepIndex(0);
    setAbilityMethod("manual");
  }, [isOpen, character]);

  useEffect(() => {
    if (!role) return;

    (async () => {
      try {
        // Carrega listas públicas (não dependem de autenticação de role)
        const [
          { races },
          { sub_races },
          { klasses },
          { sub_klasses },
        ] = await Promise.all([
          publicRacesApi.getAll(),
          publicSubRacesApi.getAll(),
          publicKlassesApi.getAll(),
          publicSubKlassesApi.getAll(),
        ]);
        setRaces(races);
        setSubRaces(sub_races);
        setKlasses(klasses);
        setSubKlasses(sub_klasses);
      } catch (err) {
        console.error("Falha ao carregar listas públicas:", err);
      }

      // Carrega grupos (existe em admin e player)
      try {
        const { groups } = await groupsApi.getAll();
        setGroups(groups);
      } catch (err) {
        console.error("Falha ao carregar grupos:", err);
      }

      // Carrega usuários apenas no admin (rota não existe para player)
      try {
        if (role === 'admin') {
          const { users } = await usersApi.getAll();
          setUsers(users);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Falha ao carregar usuários:", err);
      }
    })();
  }, [role]);


  // --- D&D 5e helpers -----------------------------------------------------
  const profBonusFor = (totalLevel) => {
    const lvl = Number(totalLevel) || 1;
    if (lvl >= 17) return 6;
    if (lvl >= 13) return 5;
    if (lvl >= 9) return 4;
    if (lvl >= 5) return 3;
    return 2;
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v)));

  // Point-buy costs for 8..15
  const pointBuyCost = (score) => {
    const s = Number(score);
    if (s <= 8) return 0;
    if (s === 9) return 1;
    if (s === 10) return 2;
    if (s === 11) return 3;
    if (s === 12) return 4;
    if (s === 13) return 5;
    if (s === 14) return 7;
    if (s === 15) return 9;
    return Infinity;
  };
  const totalPointBuyCost = () => (
    [str, dex, con, intA, wis, cha].reduce((sum, s) => sum + pointBuyCost(s), 0)
  );
  const remainingPointBuy = 27 - totalPointBuyCost();

  const applyStandardArray = () => {
    setStr(15); setDex(14); setCon(13); setIntA(12); setWis(10); setCha(8);
  };

  // --- Stepper validation/navigation --------------------------------------
  const validateStep = (idx) => {
    switch (idx) {
      case 0:
        if (!name?.trim()) return "Informe o nome do personagem.";
        if (!userId) return "Selecione o usuário do personagem.";
        return null;
      case 1:
        if (!raceId) return "Selecione a raça.";
        return null;
      case 2:
        if (!klassId) return "Selecione a classe.";
        return null;
      case 3:
        if (abilityMethod === "point_buy") {
          if ([str, dex, con, intA, wis, cha].some((s) => s < 8 || s > 15))
            return "No point-buy, atributos devem estar entre 8 e 15.";
          if (remainingPointBuy < 0) return "Você excedeu os 27 pontos do point-buy.";
        }
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const err = validateStep(stepIndex);
    if (err) { setError(err); return; }
    setError(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goPrev = () => {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  };


  const resetForm = () => {
    setName("");
    setBackground("");
    setGroupId("");
    setError(null);
    setSuccessMessage(null);
    setStepIndex(0);
    setAbilityMethod("manual");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (!raceId || !klassId) {
        setError("Selecione raça e classe.");
        return;
      }
      const payload = { name, background, group_id: groupId ? +groupId : null, user_id: userId };
      const response = isEdit
        ? await charactersApi.update(character.id, payload)
        : await charactersApi.create(payload);

      const createdChar = response.character || response;

      if (!isEdit) {
        // Cria Sheet com atributos básicos
        const klass = klasses.find(k => k.id === klassId);
        const conMod = Math.floor((Number(con) - 10) / 2);
        const hitDie = klass?.hit_die || 8;
        const initHp = Math.max(1, hitDie + conMod);
        const sheetRes = await sheetsApi.create({
          character_id: createdChar.id,
          race_id: raceId,
          sub_race_id: subRaceId || null,
          str, dex, con, int: intA, wis, cha,
          hp_max: initHp,
          hp_current: initHp,
          temp_hp: 0,
        });
        const sheet = sheetRes.sheet || sheetRes;

        // Cria vínculo de classe
        await sheetKlassesApi.create({
          sheet_id: sheet.id,
          klass_id: klassId,
          sub_klass_id: subKlassId || null,
          level: Number(level) || 1,
        });
      }

      setSuccessMessage("Personagem criado com sucesso!");
      onSave(response.character || response);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  if (inline) {
    return (
      <Card disableHover className={styles.centeredForm} style={{ maxWidth: 1200, margin: '0 auto' }}>
        <CardHeader>
          <CardTitle>Criar Personagem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            {successMessage && <div className={styles.success}>{successMessage}</div>}

            <StepperNav steps={steps} stepIndex={stepIndex} />

            {stepIndex === 0 && (
              <StepConcept
                name={name} setName={setName}
                background={background} setBackground={setBackground}
                groups={groups} groupId={groupId} setGroupId={setGroupId}
                role={role} users={users} userId={userId} setUserId={setUserId}
              />
            )}

            {stepIndex === 1 && (
              <StepRace
                races={races} subRaces={subRaces}
                raceId={raceId} setRaceId={setRaceId}
                subRaceId={subRaceId} setSubRaceId={setSubRaceId}
              />
            )}

            {stepIndex === 2 && (
              <StepClass
                klasses={klasses} subKlasses={subKlasses}
                klassId={klassId} setKlassId={setKlassId}
                subKlassId={subKlassId} setSubKlassId={setSubKlassId}
                level={level} setLevel={setLevel}
                clamp={clamp} profBonusFor={profBonusFor}
              />
            )}

            {stepIndex === 3 && (
              <StepAbilities
                abilityMethod={abilityMethod} setAbilityMethod={setAbilityMethod}
                remainingPointBuy={remainingPointBuy}
                str={str} setStr={setStr}
                dex={dex} setDex={setDex}
                con={con} setCon={setCon}
                intA={intA} setIntA={setIntA}
                wis={wis} setWis={setWis}
                cha={cha} setCha={setCha}
                clamp={clamp}
                applyStandardArray={applyStandardArray}
              />
            )}

            {stepIndex === 4 && (
              <StepReview
                name={name} users={users} userId={userId}
                groups={groups} groupId={groupId}
                races={races} raceId={raceId} subRaces={subRaces} subRaceId={subRaceId}
                klasses={klasses} klassId={klassId} subKlasses={subKlasses} subKlassId={subKlassId}
                level={level} profBonusFor={profBonusFor}
                str={str} dex={dex} con={con} intA={intA} wis={wis} cha={cha}
              />
            )}
          </form>
        </CardContent>
        <CardFooter className={styles.stickyFooter}>
          <div className={styles.stepActions}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            {stepIndex > 0 && (
              <Button variant="secondary" onClick={goPrev}>Voltar</Button>
            )}
            {stepIndex < steps.length - 1 ? (
              <Button variant="highlight" onClick={goNext}>Próximo</Button>
            ) : (
              <Button variant="highlight" onClick={(e) => {
                const err = validateStep(3);
                if (err) { setError(err); return; }
                handleSubmit(e);
              }}>Salvar</Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} inline={inline} showClose={!inline}>
      <DialogHeader>
        <DialogTitle>Criar Personagem</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}

          <StepperNav steps={steps} stepIndex={stepIndex} />

          {stepIndex === 0 && (
            <StepConcept
              name={name} setName={setName}
              background={background} setBackground={setBackground}
              groups={groups} groupId={groupId} setGroupId={setGroupId}
              role={role} users={users} userId={userId} setUserId={setUserId}
            />
          )}

          {stepIndex === 1 && (
            <StepRace
              races={races} subRaces={subRaces}
              raceId={raceId} setRaceId={setRaceId}
              subRaceId={subRaceId} setSubRaceId={setSubRaceId}
            />
          )}

          {stepIndex === 2 && (
            <StepClass
              klasses={klasses} subKlasses={subKlasses}
              klassId={klassId} setKlassId={setKlassId}
              subKlassId={subKlassId} setSubKlassId={setSubKlassId}
              level={level} setLevel={setLevel}
              clamp={clamp} profBonusFor={profBonusFor}
            />
          )}

          {stepIndex === 3 && (
            <StepAbilities
              abilityMethod={abilityMethod} setAbilityMethod={setAbilityMethod}
              remainingPointBuy={remainingPointBuy}
              str={str} setStr={setStr}
              dex={dex} setDex={setDex}
              con={con} setCon={setCon}
              intA={intA} setIntA={setIntA}
              wis={wis} setWis={setWis}
              cha={cha} setCha={setCha}
              clamp={clamp}
              applyStandardArray={applyStandardArray}
            />
          )}

          {stepIndex === 4 && (
            <StepReview
              name={name} users={users} userId={userId}
              groups={groups} groupId={groupId}
              races={races} raceId={raceId} subRaces={subRaces} subRaceId={subRaceId}
              klasses={klasses} klassId={klassId} subKlasses={subKlasses} subKlassId={subKlassId}
              level={level} profBonusFor={profBonusFor}
              str={str} dex={dex} con={con} intA={intA} wis={wis} cha={cha}
            />
          )}
        </form>
      </DialogContent>
      <DialogFooter className={styles.stickyFooter}>
        <div className={styles.stepActions}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          {stepIndex > 0 && (
            <Button variant="secondary" onClick={goPrev}>Voltar</Button>
          )}
          {stepIndex < steps.length - 1 ? (
            <Button variant="highlight" onClick={goNext}>Próximo</Button>
          ) : (
            <Button variant="highlight" onClick={(e) => {
              const err = validateStep(3);
              if (err) { setError(err); return; }
              handleSubmit(e);
            }}>Salvar</Button>
          )}
        </div>
      </DialogFooter>
    </Dialog>
  );
};

export default CharacterFormDialog;
