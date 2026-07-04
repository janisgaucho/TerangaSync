import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import Formulaire from './Formulaire';

export default function ManagerDashboard({ profile, user }) {
  const [communes, setCommunes] = useState([]);
  const [loadingCommunes, setLoadingCommunes] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunes = async () => {
      if (!profile?.region?.id) {
        setLoadingCommunes(false);
        return;
      }

      setLoadingCommunes(true);
      const { data, error } = await supabase
        .from('commune')
        .select('id, nom')
        .eq('region_id', profile.region.id)
        .order('nom');

      if (error) console.error("Erreur chargement communes:", error);
      else setCommunes(data || []);
      setLoadingCommunes(false);
    };

    fetchCommunes();
  }, [profile?.region?.id]);

  const handleCommuneClick = (communeId) => {
    navigate(`/commune/${communeId}`);
  };

  if (!profile) {
    return <div className="text-center p-10">Chargement...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue, {profile.prenom || 'Manager'}
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          Vous êtes en charge de la région : <span className="font-semibold text-green-700">{profile.region?.nom || 'Région non assignée'}</span>.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Communes de votre région
        </h2>
        {loadingCommunes ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-12 rounded-lg"></div>
            ))}
          </div>
        ) : communes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {communes.map((commune) => (
              <button key={commune.id} onClick={() => handleCommuneClick(commune.id)} className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-center hover:bg-blue-100 hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span className="font-medium">{commune.nom}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Aucune commune enregistrée pour votre région.
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