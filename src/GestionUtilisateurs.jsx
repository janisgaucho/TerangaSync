import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const RoleBadge = ({ role }) => {
  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-purple-100 text-purple-800',
    gestionnaire: 'bg-blue-100 text-blue-800',
    gerant: 'bg-blue-100 text-blue-800',
    benevole: 'bg-yellow-100 text-yellow-800',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
      {role}
    </span>
  );
};

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtreRole, setFiltreRole] = useState('');
  const navigate = useNavigate();

  // États pour la modification en ligne
  const [editingId, setEditingId] = useState(null);
  const [newRole, setNewRole] = useState('');

  const ROLES_DISPONIBLES = ['admin', 'manager', 'gestionnaire', 'gerant', 'benevole'];

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, prenom, nom_famille, email, role')
        .order('nom_famille', { ascending: true })
        .order('prenom', { ascending: true });

      if (error) throw error;
      setUsers(data);
    } catch (err) {
      console.error("Erreur de chargement des utilisateurs:", err);
      setError("Impossible de charger la liste des utilisateurs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStartEditing = (user) => {
    setEditingId(user.id);
    setNewRole(user.role);
  };

  const handleCancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdateRole = async (userId) => {
    if (!newRole) {
      alert("Veuillez sélectionner un rôle.");
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (updateError) {
      console.error("Erreur de mise à jour du rôle:", updateError);
      setError("Erreur lors du changement de rôle.");
    } else {
      // Mettre à jour l'état local pour un retour visuel immédiat
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingId(null);
    }
  };

  const utilisateursFiltres = users.filter(user =>
    filtreRole === '' || user.role === filtreRole
  );

  if (isLoading) return <div className="text-center p-4">Chargement des utilisateurs...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        Retour à l'accueil admin
      </Link>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>

        {/* Barre de filtre */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-md border">
          <label htmlFor="filtre-role" className="block text-sm font-medium text-gray-700">Filtrer par Rôle :</label>
          <select
            id="filtre-role"
            value={filtreRole}
            onChange={(e) => setFiltreRole(e.target.value)}
            className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
          >
            <option value="">Tous les rôles</option>
            {ROLES_DISPONIBLES.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {utilisateursFiltres.map((user) => (                
                <tr key={user.id} onClick={() => navigate(`/admin/utilisateurs/${user.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{`${user.prenom || ''} ${user.nom_famille || ''}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <span className="text-blue-600 hover:text-blue-900 font-medium">Gérer</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}