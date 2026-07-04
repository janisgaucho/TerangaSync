import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';

export default function CommunePage() {
  const { id: communeId } = useParams();
  const navigate = useNavigate();

  const [commune, setCommune] = useState(null);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historiqueRecoltes, setHistoriqueRecoltes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!communeId) return;

      setLoading(true);
      setError(null);

      try {
        const [communeRes, villagesRes, recoltesRes] = await Promise.all([
          supabase.from('commune').select('nom, region_id').eq('id', communeId).single(),
          supabase.from('village').select('id, nom').eq('commune_id', communeId),
          supabase.from('recoltes_details').select('*').eq('commune_id', communeId)
        ]);

        if (communeRes.error) throw communeRes.error;
        if (villagesRes.error) throw villagesRes.error;
        if (recoltesRes.error) throw recoltesRes.error;

        setCommune(communeRes.data);
        const villagesData = villagesRes.data || [];
        const recoltesData = recoltesRes.data || [];

        // Préparer l'historique
        setHistoriqueRecoltes(recoltesData.map(r => ({
          ...r,
          variete: { nom: r.variete_nom },
          profiles: { prenom: r.user_prenom }
        })));

        // Agréger les données de récolte par village
        const statsParVillage = new Map();
        recoltesData.forEach(recolte => {
          const totalActuel = statsParVillage.get(recolte.village_id) || 0;
          statsParVillage.set(recolte.village_id, totalActuel + (recolte.quantite_kg || 0));
        });

        // Fusionner la liste des villages avec leurs statistiques
        const villagesAvecStats = villagesData.map(village => ({
          ...village,
          totalRecolte: statsParVillage.get(village.id) || 0
        }));

        setVillages(villagesAvecStats);

      } catch (err) {
        console.error("Erreur lors du chargement des données de la commune:", err);
        setError("Impossible de charger les données pour cette commune.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communeId]);

  const sortedVillages = useMemo(() => {
    return [...villages].sort((a, b) => a.nom.localeCompare(b.nom));
  }, [villages]);

  const totalRecolteCommune = useMemo(() => {
    return villages.reduce((total, v) => total + v.totalRecolte, 0);
  }, [villages]);

  if (loading) {
    return <div className="text-center p-10">Chargement de la commune...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Section Titre et retour */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Commune : <span className="text-green-700">{commune?.nom || '...'}</span>
        </h1>
        <button onClick={() => navigate(`/region/${commune?.region_id}`)} className="text-sm text-green-600 hover:text-green-800 underline">
          &larr; Retour à la région
        </button>
      </div>

      {/* Section Villages */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Liste des villages</h2>
        {sortedVillages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedVillages.map((village) => (
              <button
                key={village.id}
                onClick={() => navigate(`/village/${village.id}`)}
                className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-center hover:bg-yellow-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <span className="font-medium">{village.nom}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucun village enregistré pour cette commune.</p>
        )}
      </div>

      {/* Section Statistiques */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Statistiques de la commune</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <dt className="text-sm font-medium text-green-800 truncate">Total Récolté (Commune)</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-900">{(totalRecolteCommune / 1000).toFixed(2)} Tonnes</dd>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <dt className="text-sm font-medium text-blue-800 truncate">Nombre de villages</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-900">{villages.length}</dd>
          </div>
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Production par village (en Kg)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={sortedVillages.sort((a, b) => b.totalRecolte - a.totalRecolte)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(recolte.date_saisie).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recolte.villageNom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recolte.variete?.nom || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recolte.quantite_kg ? recolte.quantite_kg.toLocaleString() : '0'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recolte.profiles?.prenom || 'Utilisateur inconnu'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-4 text-sm text-gray-500">Aucune récolte enregistrée pour cette commune.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}