"use client";

import React, { useState } from "react";
import styles from "../../_styles/character/CharacterForm.module.css";
import { Card, CardContent } from "../UI/Card";

const FeatsPanel = ({ feats = [], readOnly = true }) => {
  const [selectedFeat, setSelectedFeat] = useState(null);

  if (!feats || feats.length === 0) {
    return (
      <Card disableHover bgVar="medium-hover">
        <CardContent>
            <div className={styles.panelTitle}>Talentos (Feats)</div>
            <div className={styles.scrollText}>
              Nenhum talento selecionado.
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
        <Card disableHover bgVar="medium-hover">
          <CardContent>
            <div className={styles.panelTitle}>Talentos (Feats)</div>
            <div className={styles.scrollText}>
              {feats.map((feat, index) => (
                <div key={feat.id || index} className={styles.featItem}>
                  <div 
                    className={styles.featName}
                    onClick={() => setSelectedFeat(selectedFeat?.id === feat.id ? null : feat)}
                    style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '4px' }}
                  >
                    {feat.name}
                    {feat.level_gained && (
                      <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '8px' }}>
                        (Nível {feat.level_gained})
                      </span>
                    )}
                  </div>
                  
                  {selectedFeat?.id === feat.id && (
                    <div className={styles.featDetails} style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      {feat.description && (
                        <div style={{ marginBottom: '8px', fontStyle: 'italic' }}>
                          {feat.description}
                        </div>
                      )}
                      
                      {feat.ability_bonuses && Object.keys(feat.ability_bonuses).length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Bônus de Atributos:</strong>
                          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                            {Object.entries(feat.ability_bonuses).map(([ability, bonus]) => (
                              <li key={ability}>
                                {ability.toUpperCase()}: +{bonus}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {feat.proficiency_bonuses && Object.keys(feat.proficiency_bonuses).length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Proficiências:</strong>
                          <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                            {Object.entries(feat.proficiency_bonuses).map(([type, proficiencies]) => (
                              <li key={type}>
                                {type}: {Array.isArray(proficiencies) ? proficiencies.join(', ') : proficiencies}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {feat.features && feat.features.name && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>{feat.features.name}:</strong>
                          <div style={{ fontSize: '0.9em', marginTop: '4px' }}>
                            {feat.features.desc}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
        </CardContent>
      </Card>
  );
};

export default FeatsPanel;
