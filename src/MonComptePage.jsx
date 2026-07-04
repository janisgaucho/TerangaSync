import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function MonComptePage({ profile, user }) {
  // --- États pour la section "Mes Informations" ---
  const [isInfoEditing, setIsInfoEditing] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState({ type: '', text: '' });
  const [prenom, setPrenom] = useState('');
  const [nomFamille, setNomFamille] = useState('');
  const [email, setEmail] = useState('');

  // --- États pour la section "Mot de passe" ---
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setPrenom(profile.prenom || '');
      setNomFamille(profile.nom_famille || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  if (!profile || !user) {
    return <div className="text-center p-10">Chargement des informations du compte...</div>;
  }

  const getAffectation = () => {
    if (profile.role === 'manager' && profile.region) {
      return `Région : ${profile.region.nom}`;
    }
    if (profile.role === 'benevole' && profile.commune) {
      return `Commune : ${profile.commune.nom}`;
    }
    if (['gestionnaire', 'gerant'].includes(profile.role)) {
      return 'Accès national';
    }
    return 'Aucune affectation';
  };

  const handleInfoSave = async (e) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoMessage({ type: '', text: '' });

    try {
      // 1. Mettre à jour le prénom et le nom dans la table 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ prenom: prenom, nom_famille: nomFamille })
        .eq('id', user.id);

      if (profileError) throw profileError;

      let successMessages = [];

      // 2. Mettre à jour l'email si il a changé
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email });
        if (emailError) throw emailError;
        setInfoMessage({ type: 'info', text: 'Informations mises à jour. Un email de confirmation a été envoyé pour valider votre nouvelle adresse.' });
      } else {
        setInfoMessage({ type: 'success', text: 'Vos informations ont été mises à jour avec succès !' });
      }

      setIsInfoEditing(false);

    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      setInfoMessage({ type: 'error', text: `Erreur: ${error.message}` });
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    if (!password || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Veuillez remplir les deux champs.' });
      setPasswordLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      setPasswordMessage({ type: 'success', text: 'Votre mot de passe a été mis à jour avec succès !' });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      setPasswordMessage({ type: 'error', text: `Erreur: ${error.message}` });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* --- Section Informations Personnelles --- */}
      <div className="bg-white shadow-lg rounded-lg">
        <form onSubmit={handleInfoSave} className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes Informations</h1>
              <p className="text-gray-500 mt-1">Gérez vos informations personnelles.</p>
            </div>
            {!isInfoEditing && (
              <button type="button" onClick={() => setIsInfoEditing(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Modifier
              </button>
            )}
          </div>
          {infoMessage.text && <div className={`p-4 mb-4 rounded-md text-sm ${infoMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{infoMessage.text}</div>}
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Prénom</dt>{isInfoEditing ? <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" /> : <dd className="mt-1 text-lg text-gray-900">{profile.prenom || 'Non renseigné'}</dd>}</div>
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Nom de famille</dt>{isInfoEditing ? <input type="text" value={nomFamille} onChange={(e) => setNomFamille(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" /> : <dd className="mt-1 text-lg text-gray-900">{profile.nom_famille || 'Non renseigné'}</dd>}</div>
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Adresse Email</dt>{isInfoEditing ? <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" /> : <dd className="mt-1 text-lg text-gray-900">{user.email}</dd>}</div>
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Rôle</dt><dd className="mt-1 text-lg text-gray-900 capitalize">{profile.role}</dd></div>
            <div className="sm:col-span-1"><dt className="text-sm font-medium text-gray-500">Zone d'affectation</dt><dd className="mt-1 text-lg text-gray-900">{getAffectation()}</dd></div>
            <div className="sm:col-span-2"><dt className="text-sm font-medium text-gray-500">Membre depuis le</dt><dd className="mt-1 text-lg text-gray-900">{new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</dd></div>
          </dl>
          {isInfoEditing && (
            <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end gap-3">
              <button type="button" onClick={() => setIsInfoEditing(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={infoLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300">
                {infoLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* --- Section Sécurité / Mot de passe --- */}
      <div className="bg-white shadow-lg rounded-lg">
        <form onSubmit={handlePasswordSave} className="p-8">
          <h2 className="text-2xl font-bold text-gray-900">Sécurité</h2>
          <p className="text-gray-500 mt-1 mb-8">Changez votre mot de passe.</p>
          {passwordMessage.text && <div className={`p-4 mb-4 rounded-md text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{passwordMessage.text}</div>}
          <div className="border-t border-gray-200 pt-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Nouveau mot de passe</dt>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" required />
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Confirmer le nouveau mot de passe</dt>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" required />
              </div>
            </dl>
          </div>
          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end">
            <button type="submit" disabled={passwordLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300">
              {passwordLoading ? 'Enregistrement...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}