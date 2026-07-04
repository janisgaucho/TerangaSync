import React, { useState, useEffect } from 'react';
import Formulaire from './Formulaire';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function GestionnaireDashboard({ profile, user }) {
  const [regions, setRegions] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true);
      // Pour l'instant, on charge les régions du Sénégal (pays_id = 1)
      const { data, error } = await supabase
        .from('region')
        .select('id, nom')
        .eq('pays_id', 1) // On assume que le Sénégal a l'ID 1
        .order('nom');

      if (error) console.error("Erreur chargement régions:", error);
      else setRegions(data || []);
      
      setLoadingRegions(false);
    };

    fetchRegions();
  }, []); // Se déclenche une seule fois au montage du composant

  const handleRegionClick = (regionId) => {
    navigate(`/region/${regionId}`);
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
          Bienvenue, {profile.prenom || 'Gérant'}
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Vous êtes rattaché au pays : <span className="font-semibold text-green-700">Sénégal</span>.
        </p>
      </div>

      {/* Section des villages */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Régions de votre pays
        </h2>
        {loadingRegions ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-12 rounded-lg"></div>
            ))}
          </div>
        ) : regions.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {regions.map((region) => (
              <button key={region.id} onClick={() => handleRegionClick(region.id)} className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-center hover:bg-green-100 hover:border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">
                <span className="font-medium">
                  {region.nom}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Aucune région enregistrée dans votre pays.
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