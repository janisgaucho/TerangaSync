import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import ZoneBadge from './ZoneBadge';

export default function RegionPage({ profile }) {
  const { id: regionId } = useParams();
  const navigate = useNavigate();

  const [region, setRegion] = useState(null);
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historiqueRecoltes, setHistoriqueRecoltes] = useState([]);
  const [sortBy, setSortBy] = useState('nom'); // 'nom' ou 'recolte'

  useEffect(() => {
    const fetchData = async () => {
      if (!regionId) return;

      setLoading(true);

      try {
        // On utilise des requêtes séparées et fiables
        const [regionRes, communesRes, recoltesRes] = await Promise.all([
          supabase.from('region').select('nom').eq('id', regionId).single(),
          supabase.from('commune').select('id, nom').eq('region_id', regionId),
          supabase.from('recoltes_details').select('*').eq('region_id', regionId)
        ]);

        // Gestion des erreurs
        if (regionRes.error) throw regionRes.error;
        if (communesRes.error) throw communesRes.error;
        if (recoltesRes.error) throw recoltesRes.error;

        // Mise à jour des états
        setRegion(regionRes.data);
        const recoltesData = recoltesRes.data || [];
        const communesData = communesRes.data || [];

        // Préparer l'historique
        setHistoriqueRecoltes(recoltesData.map(r => ({
          ...r,
          variete: { nom: r.variete_nom },
          profiles: { prenom: r.user_prenom }
        })));

        // Agréger les données de récolte par commune
        const statsParCommune = new Map();
        recoltesData.forEach(recolte => {
          const totalActuel = statsParCommune.get(recolte.commune_id) || 0;
          statsParCommune.set(recolte.commune_id, totalActuel + (recolte.quantite_kg || 0));
        });

        // Fusionner la liste des communes avec leurs statistiques
        const communesAvecStats = communesData.map(commune => ({
          ...commune,
          totalRecolte: statsParCommune.get(commune.id) || 0
        }));

        setCommunes(communesAvecStats);

      } catch (err) {
        console.error("Erreur lors du chargement des données de la région:", err);
        setError("Impossible de charger les données pour cette région.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [regionId]);

  // Tri des communes en fonction de l'état sortBy
  const sortedCommunes = useMemo(() => {
    const sorted = [...communes];
    if (sortBy === 'nom') sorted.sort((a, b) => a.nom.localeCompare(b.nom));
    if (sortBy === 'recolte') sorted.sort((a, b) => b.totalRecolte - a.totalRecolte);
    return sorted;
  }, [communes, sortBy]);

  // Calcul du total des récoltes pour la région
  const totalRecolteRegion = useMemo(() => {
    return communes.reduce((total, c) => total + c.totalRecolte, 0);
  }, [communes]);

  const isInZone = useMemo(() => {
    if (!profile || !regionId) return false;
    if (['gestionnaire', 'gerant'].includes(profile.role)) return true;
    if (profile.role === 'manager' && profile.region?.id === parseInt(regionId, 10)) return true;
    return false;
  }, [profile, regionId]);

  if (loading) {
    return <div className="text-center p-10">Chargement de la région...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Section Titre et retour */}
      <div className="flex justify-between items-start">
        <div>
          <ZoneBadge isInZone={isInZone} />
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Région : <span className="text-green-700">{region?.nom || '...'}</span>
          </h1>
        </div>
        <button onClick={() => navigate('/gestionnaire')} className="text-sm text-green-600 hover:text-green-800 underline">
          &larr; Retour au tableau de bord
        </button>
      </div>

      {/* Section Communes */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Liste des communes</h2>
        </div>

        {sortedCommunes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedCommunes.map((commune) => (
              <button
                key={commune.id}
                onClick={() => navigate(`/commune/${commune.id}`)}
                className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-center hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="font-medium">{commune.nom}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucune commune enregistrée pour cette région.</p>
        )}
      </div>

      {/* Section Statistiques */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Statistiques de la région</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <dt className="text-sm font-medium text-green-800 truncate">Total Récolté (Région)</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-900">{(totalRecolteRegion / 1000).toFixed(2)} Tonnes</dd>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <dt className="text-sm font-medium text-blue-800 truncate">Nombre de communes</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-900">{communes.length}</dd>
          </div>
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Production par commune (en Kg)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={sortedCommunes} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nom" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} kg`} />
              <Legend />
              <Bar dataKey="totalRecolte" fill="#16a34a" name="Récolte (Kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section Historique des récoltes */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Historique des récoltes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commune</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Village</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variété</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité (kg)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enregistré par</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historiqueRecoltes.length > 0 ? (
                historiqueRecoltes.sort((a, b) => new Date(b.date_saisie) - new Date(a.date_saisie)).map((recolte, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recolte.date_saisie ? new Date(recolte.date_saisie).toLocaleString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recolte.commune_nom || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recolte.village_nom || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recolte.variete?.nom || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recolte.quantite_kg ? recolte.quantite_kg.toLocaleString() : '0'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recolte.profiles?.prenom || 'Utilisateur inconnu'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-4 text-sm text-gray-500">Aucune récolte enregistrée pour cette région.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}