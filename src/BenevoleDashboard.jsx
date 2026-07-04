import React, { useState, useEffect } from 'react';
import Formulaire from './Formulaire';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function BenevoleDashboard({ profile, user }) {
  const [villages, setVillages] = useState([]);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVillages = async () => {
      if (!profile?.commune?.id) {
        setLoadingVillages(false);
        return;
      }

      setLoadingVillages(true);
      const { data, error } = await supabase
        .from('village')
        .select('id, nom')
        .eq('commune_id', profile.commune.id)
        .order('nom');

      if (error) console.error("Erreur chargement villages:", error);
      else setVillages(data || []);
      setLoadingVillages(false);
    };

    fetchVillages();
  }, [profile?.commune?.id]);

  const handleVillageClick = (villageId) => {
    navigate(`/village/${villageId}`);
  };

  // On s'assure que le profil est bien chargé pour éviter les erreurs
  if (!profile) {
    return <div className="text-center p-10">Chargement...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Section de bienvenue */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue, {profile.prenom || 'Bénévole'}
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Vous êtes rattaché à la commune de <span className="font-semibold text-green-700">{profile.commune?.nom || 'Commune non assignée'}</span>.
        </p>
      </div>

      {/* Section des villages */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Villages de votre commune
        </h2>
        {loadingVillages ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-12 rounded-lg"></div>
            ))}
          </div>
        ) : villages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {villages.map((village) => (
              <button key={village.id} onClick={() => handleVillageClick(village.id)} className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-center hover:bg-green-100 hover:border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">
                <span className="font-medium">{village.nom}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Aucun village enregistré pour cette commune.
          </p>
        )}
      </div>

      {/* Section du formulaire de récolte */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Saisir une nouvelle récolte
        </h2>
        <Formulaire user={user} profile={profile} />
      </div>

    </div>
  );
}