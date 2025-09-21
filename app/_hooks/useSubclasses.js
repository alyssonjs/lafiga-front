import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../_lib/api/client';

/**
 * Hook para carregar subclasses de uma classe específica
 * Combina subclasses estáticas (PHB) com subclasses customizadas da API
 */
export const useSubclasses = (klassId, klassApiIndex) => {
  const [subclasses, setSubclasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!klassId || !klassApiIndex) {
      setSubclasses([]);
      return;
    }

    const loadSubclasses = async () => {
      setLoading(true);
      setError(null);

      try {
        // Carregar subclasses da API (inclui estáticas + customizadas)
        const response = await apiClient.get(`/api/v1/public/klasses/${klassId}/subclasses`);
        const { subclasses: apiSubclasses = [] } = response;

        // Transformar para o formato esperado pelo frontend
        const formattedSubclasses = apiSubclasses.map(subclass => ({
          id: subclass.id,
          name: subclass.name,
          custom: subclass.custom || false,
          description: subclass.description,
          grants: subclass.grants || [],
          additional_choices_by_level: subclass.additional_choices_by_level || {},
          always_prepared: subclass.always_prepared || {},
          always_prepared_by_terrain: subclass.always_prepared_by_terrain || {}
        }));

        setSubclasses(formattedSubclasses);
      } catch (err) {
        console.error('Erro ao carregar subclasses:', err);
        setError(err.message);
        setSubclasses([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubclasses();
  }, [klassId, klassApiIndex]);

  return { subclasses, loading, error };
};

/**
 * Hook para carregar detalhes de uma subclasse específica
 */
export const useSubclassDetails = (subclassId) => {
  const [subclass, setSubclass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!subclassId) {
      setSubclass(null);
      return;
    }

    const loadSubclassDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/api/v1/public/sub_klasses/${subclassId}`);
        const { sub_klass: subclassData } = response;

        setSubclass(subclassData);
      } catch (err) {
        console.error('Erro ao carregar detalhes da subclasse:', err);
        setError(err.message);
        setSubclass(null);
      } finally {
        setLoading(false);
      }
    };

    loadSubclassDetails();
  }, [subclassId]);

  return { subclass, loading, error };
};

/**
 * Hook para carregar features de uma subclasse por nível
 */
export const useSubclassFeatures = (subclassId, level) => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!subclassId || !level) {
      setFeatures([]);
      return;
    }

    const loadFeatures = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/api/v1/public/sub_klasses/${subclassId}/levels`);
        const { sub_klass_levels: levels = [] } = response;

        // Encontrar o nível específico
        const levelData = levels.find(l => Number(l.level) === Number(level));
        const levelFeatures = levelData?.features || [];

        setFeatures(levelFeatures);
      } catch (err) {
        console.error('Erro ao carregar features da subclasse:', err);
        setError(err.message);
        setFeatures([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeatures();
  }, [subclassId, level]);

  return { features, loading, error };
};

/**
 * Hook para carregar spellcasting de uma subclasse
 */
export const useSubclassSpellcasting = (subclassId, level) => {
  const [spellcasting, setSpellcasting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!subclassId || !level) {
      setSpellcasting(null);
      return;
    }

    const loadSpellcasting = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(`/api/v1/public/sub_klasses/${subclassId}/levels`);
        const { sub_klass_levels: levels = [] } = response;

        // Encontrar o nível específico
        const levelData = levels.find(l => Number(l.level) === Number(level));
        const spellcastingData = levelData?.spellcasting;

        setSpellcasting(spellcastingData || null);
      } catch (err) {
        console.error('Erro ao carregar spellcasting da subclasse:', err);
        setError(err.message);
        setSpellcasting(null);
      } finally {
        setLoading(false);
      }
    };

    loadSpellcasting();
  }, [subclassId, level]);

  return { spellcasting, loading, error };
};

/**
 * Hook combinado para carregar todas as informações de uma subclasse
 */
export const useSubclassComplete = (subclassId, level) => {
  const { subclass, loading: subclassLoading, error: subclassError } = useSubclassDetails(subclassId);
  const { features, loading: featuresLoading, error: featuresError } = useSubclassFeatures(subclassId, level);
  const { spellcasting, loading: spellcastingLoading, error: spellcastingError } = useSubclassSpellcasting(subclassId, level);

  const loading = subclassLoading || featuresLoading || spellcastingLoading;
  const error = subclassError || featuresError || spellcastingError;

  return {
    subclass,
    features,
    spellcasting,
    loading,
    error
  };
};
