import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function VillagesManager() {
  const [villages, setVillages] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [nouveauVillage, setNouveauVillage] = useState('');
  const [communeSelectionnee, setCommuneSelectionnee] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filtreCommune, setFiltreCommune] = useState('');
  // --- Nouveaux états pour l'édition ---
  const [editingId, setEditingId] = useState(null);
  const [editNom, setEditNom] = useState('');
  const [editCommuneId, setEditCommuneId] = useState('');
  const [error, setError] = useState(null);

  const fetchVillagesAndCommunes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: communesData, error: communesError } = await supabase
        .from('commune')
        .select('*')
        .order('nom');
      if (communesError) throw communesError;
      setCommunes(communesData);
      if (communesData.length > 0 && !communeSelectionnee) {
        setCommuneSelectionnee(communesData[0].id);
      }
      const { data: villagesData, error: villagesError } = await supabase
        .from('village')
        .select('*, commune:commune_id(id, nom)') // On récupère aussi l'ID de la commune
        .order('nom');
      if (villagesError) throw villagesError;
      setVillages(villagesData);
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setError(`Impossible de charger les données: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVillagesAndCommunes();
  }, []);

  const handleAddVillage = async (e) => {
    e.preventDefault();
    if (!nouveauVillage.trim() || !communeSelectionnee) {
      alert("Veuillez renseigner le nom du village et sélectionner une commune.");
      return;
    }

    setError(null);
    const parsedCommuneId = parseInt(communeSelectionnee, 10);
    const { error: insertError } = await supabase
      .from('village')
      .insert([{ nom: nouveauVillage.trim(), commune_id: isNaN(parsedCommuneId) ? communeSelectionnee : parsedCommuneId }]);

    if (insertError) {
      console.error("Erreur d'insertion Supabase:", insertError);
      setError(`Erreur lors de l'ajout du village (${insertError.code || '403'}): ${insertError.message || 'Accès refusé par la politique de sécurité (RLS).'}`);
    } else {
      setNouveauVillage('');
      await fetchVillagesAndCommunes(); // Recharger la liste
    }
  };

  const handleDeleteVillage = async (villageId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce village ?")) {
      setError(null);
      const { error: deleteError } = await supabase
        .from('village')
        .delete()
        .eq('id', villageId);

      if (deleteError) {
        console.error("Erreur de suppression Supabase:", deleteError);
        setError(`Erreur lors de la suppression (${deleteError.code || '403'}): ${deleteError.message}`);
      } else {
        setVillages(villages.filter(v => v.id !== villageId));
      }
    }
  };

  // --- Fonctions pour l'édition ---
  const handleStartEditing = (village) => {
    setEditingId(village.id);
    setEditNom(village.nom);
    setEditCommuneId(village.commune?.id || village.commune_id); // Utilise l'ID de la commune jointe
  };

  const handleCancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id) => {
    if (!editNom.trim() || !editCommuneId) {
      alert("Le nom et la commune ne peuvent pas être vides.");
      return;
    }

    setError(null);
    const parsedEditCommuneId = parseInt(editCommuneId, 10);
    const { error: updateError } = await supabase
      .from('village')
      .update({ nom: editNom.trim(), commune_id: isNaN(parsedEditCommuneId) ? editCommuneId : parsedEditCommuneId })
      .eq('id', id);

    if (updateError) {
      console.error("Erreur de mise à jour Supabase:", updateError);
      setError(`Erreur lors de la mise à jour (${updateError.code || '403'}): ${updateError.message}`);
    } else {
      setEditingId(null);
      await fetchVillagesAndCommunes(); // Recharger pour voir les changements
    }
  };

  // Filtre les villages en fonction de la commune sélectionnée
  const villagesFiltres = villages.filter(v => 
    filtreCommune === '' || v.commune_id === parseInt(filtreCommune, 10) || v.commune_id === filtreCommune
  );

  if (isLoading) return <div className="text-center p-4">Chargement...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Gestion des Villages</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex justify-between items-center">
          <div>
            <span className="font-semibold">Erreur : </span>
            {error}
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-red-500 hover:text-red-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <form onSubmit={handleAddVillage} className="flex items-end gap-4 p-4 bg-gray-50 rounded-md border">
        <div className="flex-grow">
          <label htmlFor="village-name" className="block text-sm font-medium text-gray-700">Nom du nouveau village</label>
          <input
            id="village-name"
            type="text"
            value={nouveauVillage}
            onChange={(e) => setNouveauVillage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
            placeholder="Nom du village"
          />
        </div>
        <div className="flex-grow">
          <label htmlFor="commune-select" className="block text-sm font-medium text-gray-700">Commune</label>
          <select
            id="commune-select"
            value={communeSelectionnee}
            onChange={(e) => setCommuneSelectionnee(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
          >
            {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          Ajouter
        </button>
      </form>

      {/* Barre de filtre */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md border">
        <label htmlFor="filtre-commune" className="block text-sm font-medium text-gray-700">Filtrer par Commune :</label>
        <select
          id="filtre-commune"
          value={filtreCommune}
          onChange={(e) => setFiltreCommune(e.target.value)}
          className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
        >
          <option value="">Toutes les communes</option>
          {communes.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      {/* Tableau des villages */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commune</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {villagesFiltres.map((village) => (
              editingId === village.id ? (
                // --- Mode Édition ---
                <tr key={village.id} className="bg-yellow-50">
                  <td className="px-6 py-4">
                    <input type="text" value={editNom} onChange={(e) => setEditNom(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                  </td>
                  <td className="px-6 py-4">
                    <select value={editCommuneId} onChange={(e) => setEditCommuneId(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm p-2 border">
                      {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleUpdate(village.id)} className="text-green-600 hover:text-green-900 font-semibold">
                      Sauvegarder
                    </button>
                    <button onClick={handleCancelEditing} className="text-gray-500 hover:text-gray-700">
                      Annuler
                    </button>
                  </td>
                </tr>
              ) : (
                // --- Mode Lecture ---
                <tr key={village.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{village.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{village.commune?.nom || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleStartEditing(village)} className="text-blue-600 hover:text-blue-900">
                      Modifier
                    </button>
                    <button onClick={() => handleDeleteVillage(village.id)} className="text-red-600 hover:text-red-900">
                      Supprimer
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}