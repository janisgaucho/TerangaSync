import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const ROLES_DISPONIBLES = ['admin', 'manager', 'gestionnaire', 'gerant', 'benevole'];

const InfoRow = ({ label, value, isEditing, name, onChange, type = 'text', options = [] }) => (
  <div className="sm:col-span-1">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    {isEditing ? (
      type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
        />
      )
    ) : (
      <dd className="mt-1 text-lg text-gray-900">{value || 'Non renseigné'}</dd>
    )}
  </div>
);

export default function UtilisateurDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData(data);
    } catch (err) {
      console.error("Erreur chargement profil:", err);
      setError("Impossible de charger le profil de l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEditing = () => {
    setFormData(profile); // Réinitialise le formulaire avec les données actuelles
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setError(null);

    // On ne met à jour que les champs modifiables
    const { prenom, nom_famille, email, role } = formData;

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ prenom, nom_famille, role })
        .eq('id', id);

      if (profileError) throw profileError;

      // Mise à jour de l'email (séparé car c'est dans `auth`)
      if (email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({ email });
        if (authError) throw authError;
      }

      setIsEditing(false);
      await fetchProfile(); // Recharger les données fraîches

    } catch (err) {
      console.error("Erreur de mise à jour:", err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm("Êtes-vous absolument sûr ? Cette action est irréversible et supprimera définitivement l'utilisateur et toutes ses données associées.")) {
      setSaveLoading(true);
      setError(null);
      try {
        // Appel à une Edge Function pour supprimer l'utilisateur de manière sécurisée
        const { error } = await supabase.functions.invoke('delete-user', {
          body: { user_id: id },
        });

        if (error) throw error;

        alert("L'utilisateur a été supprimé avec succès.");
        navigate('/admin/utilisateurs'); // Redirection vers la liste

      } catch (err) {
        console.error("Erreur de suppression:", err);
        setError(`Erreur lors de la suppression : ${err.message}`);
      } finally {
        setSaveLoading(false);
      }
    }
  };

  if (loading) return <div className="text-center p-10">Chargement de la fiche utilisateur...</div>;
  if (error) return <div className="text-center p-10 text-red-600">{error}</div>;
  if (!profile) return <div className="text-center p-10">Utilisateur non trouvé.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/admin/utilisateurs" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        Retour à la liste
      </Link>

      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fiche Utilisateur</h1>
            <p className="text-gray-500 mt-1">Consultez et modifiez les informations du profil.</p>
          </div>
          {!isEditing && (
            <button onClick={handleStartEditing} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Modifier
            </button>
          )}
        </div>

        {/* Section Informations Personnelles */}
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Informations Personnelles</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 mb-8">
          <InfoRow label="Prénom" value={formData.prenom} isEditing={isEditing} name="prenom" onChange={handleInputChange} />
          <InfoRow label="Nom de famille" value={formData.nom_famille} isEditing={isEditing} name="nom_famille" onChange={handleInputChange} />
          <InfoRow label="Adresse Email" value={formData.email} isEditing={isEditing} name="email" type="email" onChange={handleInputChange} />
        </dl>

        {/* Section Rôles & Accès */}
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Rôles & Accès</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          <InfoRow label="Rôle" value={formData.role} isEditing={isEditing} name="role" type="select" options={ROLES_DISPONIBLES} onChange={handleInputChange} />
          {/* Ajoutez ici d'autres champs comme la commune ou la région si nécessaire */}
        </dl>

        {isEditing && (
          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={handleCancelEditing} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saveLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300">
              {saveLoading ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </div>
        )}
      </div>

      {/* --- Zone de Danger --- */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-6">
        <h2 className="text-lg font-bold text-red-900">Zone de Danger</h2>
        <div className="mt-2 max-w-xl text-sm text-red-700">
          <p>La suppression d'un utilisateur est définitive. Toutes ses données, y compris son historique de récoltes, seront perdues et ne pourront pas être récupérées.</p>
        </div>
        <div className="mt-5">
          <button onClick={handleDeleteUser} disabled={saveLoading} className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:bg-red-300">
            {saveLoading ? 'Suppression...' : 'Supprimer cet utilisateur'}
          </button>
        </div>
      </div>
    </div>
  );
}