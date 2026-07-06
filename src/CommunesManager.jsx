import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function CommunesManager() {
  const [communes, setCommunes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [nouvelleCommune, setNouvelleCommune] = useState('');
  const [regionSelectionnee, setRegionSelectionnee] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filtreRegion, setFiltreRegion] = useState('');
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: regionsData, error: regionsError } = await supabase
        .from('region')
        .select('*')
        .order('nom');
      if (regionsError) throw regionsError;
      setRegions(regionsData);
      if (regionsData.length > 0 && !regionSelectionnee) {
        setRegionSelectionnee(regionsData[0].id);
      }

      const { data: communesData, error: communesError } = await supabase
        .from('commune')
        .select('*, region:region_id(nom)')
        .order('nom');
      if (communesError) throw communesError;
      setCommunes(communesData);
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

  const handleAddCommune = async (e) => {
    e.preventDefault();
    if (!nouvelleCommune.trim() || !regionSelectionnee) {
      alert("Veuillez renseigner le nom de la commune et sélectionner une région.");
      return;
    }

    const { error: insertError } = await supabase
      .from('commune')
      .insert([{ nom: nouvelleCommune, region_id: regionSelectionnee }]);

    if (insertError) {
      console.error("Erreur d'insertion:", insertError);
      setError("Erreur lors de l'ajout de la commune.");
    } else {
      setNouvelleCommune('');
      await fetchData();
    }
  };

  const handleDeleteCommune = async (communeId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commune ? Cela pourrait affecter les villages associés.")) {
      const { error: deleteError } = await supabase
        .from('commune')
        .delete()
        .eq('id', communeId);

      if (deleteError) {
        console.error("Erreur de suppression:", deleteError);
        setError("Erreur lors de la suppression de la commune. Assurez-vous qu'elle ne contient plus de villages.");
      } else {
        setCommunes(communes.filter(c => c.id !== communeId));
      }
    }
  };

  // Filtre les communes en fonction de la région sélectionnée
  const communesFiltrees = communes.filter(c => 
    filtreRegion === '' || c.region_id === parseInt(filtreRegion)
  );


  if (isLoading) return <div className="text-center p-4">Chargement...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Gestion des Communes</h2>

      <form onSubmit={handleAddCommune} className="flex items-end gap-4 p-4 bg-gray-50 rounded-md border">
        <div className="flex-grow">
          <label htmlFor="commune-name" className="block text-sm font-medium text-gray-700">Nom de la nouvelle commune</label>
          <input
            id="commune-name"
            type="text"
            value={nouvelleCommune}
            onChange={(e) => setNouvelleCommune(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
            placeholder="Nom de la commune"
          />
        </div>
        <div className="flex-grow">
          <label htmlFor="region-select" className="block text-sm font-medium text-gray-700">Région</label>
          <select
            id="region-select"
            value={regionSelectionnee}
            onChange={(e) => setRegionSelectionnee(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
          >
            {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          Ajouter
        </button>
      </form>

      {/* Barre de filtre */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md border">
        <label htmlFor="filtre-region" className="block text-sm font-medium text-gray-700">Filtrer par Région :</label>
        <select
          id="filtre-region"
          value={filtreRegion}
          onChange={(e) => setFiltreRegion(e.target.value)}
          className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
        >
          <option value="">Toutes les régions</option>
          {regions.map(r => (
            <option key={r.id} value={r.id}>{r.nom}</option>
          ))}
        </select>
      </div>


      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Région</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {communesFiltrees.map((commune) => (
              <tr key={commune.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{commune.nom}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{commune.region?.nom || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDeleteCommune(commune.id)} className="text-red-600 hover:text-red-900">
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