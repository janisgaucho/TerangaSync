import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function VillagePage() {
  const { id: villageId } = useParams();
  const navigate = useNavigate();

  const [village, setVillage] = useState(null);
  const [recoltes, setRecoltes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!villageId) return;
      setLoading(true);
      setError(null);

      try {
        // On utilise la même méthode robuste que pour les autres pages
        const [villageRes, recoltesDetailsRes] = await Promise.all([
          supabase.from('village').select('nom, commune_id').eq('id', villageId).single(),
          supabase.from('recoltes_details').select('*').eq('village_id', villageId)
        ]);

        if (villageRes.error) throw villageRes.error;
        if (recoltesDetailsRes.error) throw recoltesDetailsRes.error;

        setVillage(villageRes.data);
        const recoltesData = recoltesDetailsRes.data || [];

        // Préparer les données pour l'historique et les statistiques
        const processedRecoltes = recoltesData.map(r => ({
          ...r,
          variete: { nom: r.variete_nom },
          profiles: { prenom: r.user_prenom }
        }));
        setRecoltes(processedRecoltes);


      } catch (err) {
        console.error("Erreur lors du chargement des données du village:", err);
        setError("Impossible de charger les données pour ce village.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [villageId]);

  const { totalRecolte, totalSurface, statsVariete } = useMemo(() => {
    const totalRecolte = recoltes.reduce((acc, r) => acc + (r.quantite_kg || 0), 0);
    const totalSurface = recoltes.reduce((acc, r) => acc + (r.surface_utilisee_hectares || 0), 0);

    const mapVariete = {};
    recoltes.forEach(item => {
      const varieteNom = item.variete?.nom || "Autre";
      if (!mapVariete[varieteNom]) mapVariete[varieteNom] = 0;
      mapVariete[varieteNom] += item.quantite_kg;
    });

    const statsVariete = Object.keys(mapVariete).map(key => ({
      name: key,
      value: mapVariete[key]
    }));

    return { totalRecolte, totalSurface, statsVariete };
  }, [recoltes]);

  if (loading) return <div className="text-center p-10">Chargement du village...</div>;
  if (error) return <div className="text-center p-10 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Village : <span className="text-green-700">{village?.nom || '...'}</span>
        </h1>
        <button onClick={() => navigate(`/commune/${village?.commune_id}`)} className="text-sm text-green-600 hover:text-green-800 underline">
          &larr; Retour à la commune
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Statistiques du village</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <dt className="text-sm font-medium text-green-800 truncate">Total Récolté</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-900">{(totalRecolte / 1000).toFixed(2)} Tonnes</dd>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <dt className="text-sm font-medium text-yellow-800 truncate">Surface Totale Cultivée</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-900">{totalSurface.toFixed(2)} ha</dd>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <dt className="text-sm font-medium text-blue-800 truncate">Variétés de cultures</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-900">{statsVariete.length}</dd>
          </div>
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Répartition par variété (en Kg)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={statsVariete}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statsVariete.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => `${value.toLocaleString()} kg`} />
              <Legend />
            </PieChart>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variété</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité (kg)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enregistré par</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recoltes.length > 0 ? (
                recoltes.sort((a, b) => new Date(b.date_saisie) - new Date(a.date_saisie)).map((recolte, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(recolte.date_saisie).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recolte.variete?.nom || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recolte.quantite_kg.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recolte.profiles?.prenom || 'Utilisateur inconnu'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="text-center py-4 text-sm text-gray-500">Aucune récolte enregistrée pour ce village.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}