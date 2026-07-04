import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function HistoriquePersonnelPage({ user }) {
  const [recoltes, setRecoltes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecoltes = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('recoltes_details')
          .select('date_saisie, region_nom, commune_nom, village_nom, variete_nom, quantite_kg')
          .eq('user_id', user.id)
          .order('date_saisie', { ascending: false });

        if (fetchError) throw fetchError;

        setRecoltes(data || []);
      } catch (err) {
        console.error("Erreur lors du chargement de l'historique personnel:", err);
        setError("Impossible de charger votre historique de récoltes.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecoltes();
  }, [user]);

  if (loading) return <div className="text-center p-10">Chargement de votre historique...</div>;
  if (error) return <div className="text-center p-10 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon historique de récoltes</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variété</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité (kg)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recoltes.length > 0 ? (
                recoltes.map((recolte, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(recolte.date_saisie).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{`${recolte.region_nom} > ${recolte.commune_nom} > ${recolte.village_nom}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{recolte.variete_nom || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">{recolte.quantite_kg ? recolte.quantite_kg.toLocaleString() : '0'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="text-center py-4 text-sm text-gray-500">Vous n'avez pas encore enregistré de récolte.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}