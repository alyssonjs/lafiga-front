"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '../_lib/api/client';

export const useFeats = () => {
  const [feats, setFeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/api/v1/player/sheets/available_feats');
        setFeats(response.feats || []);
      } catch (err) {
        console.error('Error fetching feats:', err);
        setError(err.message || 'Erro ao carregar feats');
        // Fallback para feats hardcoded em caso de erro
        setFeats([
          {id:'observador',name:'Observador', description:'+1 WIS, +1 INT, proficiência em Percepção'},
          {id:'duravel',name:'Durável', description:'+1 CON, recuperação melhorada'},
          {id:'atirador_agucado',name:'Atirador Aguçado', description:'+1 DEX, ataques à distância melhorados'},
          {id:'sentinela',name:'Sentinela', description:'+1 STR, +1 CON, ataques de oportunidade melhorados'},
          {id:'resiliente',name:'Resiliente', description:'+1 em atributo escolhido, proficiência em salvaguarda'},
          {id:'atleta',name:'Atleta', description:'+1 STR ou DEX, escalada e natação melhoradas'},
          {id:'especialista_em_armas',name:'Especialista em Armas', description:'+1 STR ou DEX, proficiência com armas'},
          {id:'magico_iniciante',name:'Mágico Iniciante', description:'+1 INT, WIS ou CHA, 2 cantrips e 1 magia de 1º nível'},
          {id:'especialista_em_armadura',name:'Especialista em Armadura', description:'+1 STR, proficiência com armaduras pesadas'},
          {id:'especialista_em_escudo',name:'Especialista em Escudo', description:'+1 STR ou DEX, bônus com escudos'}
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeats();
  }, []);

  return { feats, loading, error };
};
