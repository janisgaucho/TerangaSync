import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function RegionsManager() {
  const [regions, setRegions] = useState([]);
  const [pays, setPays] = useState([]);
  const [nouvelleRegion, setNouvelleRegion] = useState('');
  const [paysSelectionne, setPaysSelectionne] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: paysData, error: paysError } = await supabase
        .from('pays')
        .select('*')
        .order('nom');
      if (paysError) throw paysError;
      setPays(paysData);
      if (paysData.length > 0 && !paysSelectionne) {
        setPaysSelectionne(paysData[0].id);
      }

      const { data: regionsData, error: regionsError } = await supabase
        .from('region')
        .select('*, pays:pays_id(nom)')
        .order('nom');
      if (regionsError) throw regionsError;
      setRegions(regionsData);
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setError("Impossible de charger les données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRegion = async (e) => {
    e.preventDefault();
    if (!nouvelleRegion.trim() || !paysSelectionne) {
      alert("Veuillez renseigner le nom de la région et sélectionner un pays.");
      return;
    }

    const { error: insertError } = await supabase
      .from('region')
      .insert([{ nom: nouvelleRegion, pays_id: paysSelectionne }]);

    if (insertError) {
      console.error("Erreur d'insertion:", insertError);
      setError("Erreur lors de l'ajout de la région.");
    } else {
      setNouvelleRegion('');
      await fetchData();
    }
  };

  const handleDeleteRegion = async (regionId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette région ? Cela pourrait affecter les communes et villages associés.")) {
      const { error: deleteError } = await supabase
        .from('region')
        .delete()
        .eq('id', regionId);

      if (deleteError) {
        console.error("Erreur de suppression:", deleteError);
        setError("Erreur lors de la suppression de la région. Assurez-vous qu'elle ne contient plus de communes.");
      } else {
        setRegions(regions.filter(r => r.id !== regionId));
      }
    }
  };

  if (isLoading) return <div className="text-center p-4">Chargement...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Gestion des Régions</h2>

      <form onSubmit={handleAddRegion} className="flex items-end gap-4 p-4 bg-gray-50 rounded-md border">
        <div className="flex-grow">
          <label htmlFor="region-name" className="block text-sm font-medium text-gray-700">Nom de la nouvelle région</label>
          <input
            id="region-name"
            type="text"
            value={nouvelleRegion}
            onChange={(e) => setNouvelleRegion(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
            placeholder="Nom de la région"
          />
        </div>
        <div className="flex-grow">
          <label htmlFor="pays-select" className="block text-sm font-medium text-gray-700">Pays</label>
          <select
            id="pays-select"
            value={paysSelectionne}
            onChange={(e) => setPaysSelectionne(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
          >
            {pays.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          Ajouter
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pays</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {regions.map((region) => (
              <tr key={region.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{region.nom}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.pays?.nom || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDeleteRegion(region.id)} className="text-red-600 hover:text-red-900">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}