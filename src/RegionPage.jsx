import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function RegionPage({ regionId, onBackClick }) {
  const [region, setRegion] = useState(null);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!regionId) return;

      setLoading(true);

      // Requête pour le nom de la région
      const { data: regionData, error: regionError } = await supabase
        .from('region')
        .select('nom')
        .eq('id', regionId)
        .single();

      if (regionError) console.error("Erreur chargement région:", regionError);
      else setRegion(regionData);

      // Requête pour les communes de la région
      const { data: communesData, error: communesError } = await supabase
        .from('commune')
        .select('id, nom')
        .eq('region_id', regionId)
        .order('nom');

      if (communesError) console.error("Erreur chargement communes:", communesError);
      else setCommunes(communesData || []);

      setLoading(false);
    };

    fetchData();
  }, [regionId]);

  if (loading) {
    return <div className="text-center p-10">Chargement de la région...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Région : <span className="text-green-700">{region?.nom || '...'}</span>
          </h1>
          <button onClick={onBackClick} className="text-sm text-green-600 hover:text-green-800 underline">
            &larr; Retour au tableau de bord
          </button>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Communes</h2>
        {communes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {communes.map((commune) => (
              <div key={commune.id} className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-center">
                <span className="font-medium">{commune.nom}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucune commune enregistrée pour cette région.</p>
        )}
      </div>
    </div>
  );
}