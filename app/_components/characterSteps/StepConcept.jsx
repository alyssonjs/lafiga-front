"use client";

import Input from "../UI/Input";
import TextArea from "../UI/TextArea";
import Select from "../UI/Select";
import styles from "../../_styles/character/CharacterForm.module.css";

const StepConcept = ({
  name, setName,
  background, setBackground,
  groups, groupId, setGroupId,
  role, users, userId, setUserId,
}) => (
  <div className={styles.stepContent}>
    <label htmlFor="name" className={styles.label}>Nome:</label>
    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />

    <label htmlFor="background" className={styles.label}>Background:</label>
    <TextArea id="background" value={background} onChange={(e) => setBackground(e.target.value)} required />

    <label htmlFor="group" className={styles.label}>Grupo:</label>
    <Select placeholder="Selecione um grupo" options={groups} value={groupId} onChange={(val) => setGroupId(val)} />

    {role === 'admin' ? (
      <>
        <label htmlFor="user" className={styles.label}>Usuário:</label>
        <Select placeholder="Selecione o usuário" options={users} value={userId} onChange={(val) => setUserId(val)} />
      </>
    ) : null}
  </div>
);

export default StepConcept;
