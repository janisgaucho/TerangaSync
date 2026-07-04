import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Formulaire from './Formulaire'
import Dashboard from './Dashboard'
import BenevoleDashboard from './BenevoleDashboard'
import GestionnaireDashboard from './GestionnaireDashboard'
import ManagerDashboard from './ManagerDashboard'
import RegionPage from './RegionPage'
import CommunePage from './CommunePage' // Ajout de l'import
import VillagePage from './VillagePage'
import SaisieRecoltePage from './SaisieRecoltePage'
import HistoriquePersonnelPage from './HistoriquePersonnelPage'
import LandingPage from './LandingPage'
import MainLayout from './MainLayout'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // Ajout pour stocker le profil utilisateur (et son rôle)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [authLoading, setAuthLoading] = useState(true);
  
  const navigate = useNavigate();

  // Cet effet s'exécute au chargement et à chaque changement d'état d'authentification
  useEffect(() => {
    // Fonction pour récupérer le profil de l'utilisateur connecté
    const fetchProfile = async (user) => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles') // On suppose une table 'profiles' avec une colonne 'role'
          .select('role, prenom, commune:commune_id (id, nom), region:region_id (id, nom)')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error("Erreur lors de la récupération du profil:", error)
          setProfile(null)
        } else if (data) {
          setProfile(data)
        }
      } else {
        setProfile(null) // Pas d'utilisateur, pas de profil
      }
    }

    // Écouteur de changement d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthLoading(true);
      setSession(session) // Met à jour la session
      if (session?.user) {
        fetchProfile(session.user).finally(() => setAuthLoading(false)); // Récupère le profil associé
      } else {
        // Si l'utilisateur se déconnecte, on réinitialise tout
        setProfile(null)
        setAuthLoading(false);
        navigate('/'); // Redirige vers la page publique après déconnexion
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fonction pour se connecter
  const handleLogin = async (e, email, password) => {
    e.preventDefault()
    setLoading(true)
    setErreur(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErreur("Email ou mot de passe incorrect.")
    }
    // La redirection se fera automatiquement via le changement de session
    setLoading(false)
  }

  // Fonction pour se déconnecter
  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    // Les états session et profile seront mis à null par onAuthStateChange
    setLoading(false)
  }

  // --- Composant pour la page de Login ---
  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return(
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800">TerangaSync</h1>
            <p className="text-gray-500 mt-2">Espace Gérant - SCAT</p>
          </div>

          <form onSubmit={(e) => handleLogin(e, email, password)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {erreur && <p className="text-red-500 text-sm">{erreur}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-green-600 hover:text-green-800 underline"
              >
                &larr; Retour au tableau de bord public
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  };

  // --- Composant pour la redirection basée sur le rôle ---
  const RoleBasedRedirect = () => {
    if (!profile) return null; // Attendre que le profil soit chargé

    switch (profile.role) {
      case 'benevole':
        return <Navigate to="/benevole" replace />;
      case 'gestionnaire':
      case 'gerant':
        return <Navigate to="/gestionnaire" replace />;
      case 'manager':
        return <Navigate to="/manager" replace />;
      default:
        return <Navigate to="/" replace />; // Page par défaut si rôle inconnu
    }
  };

  // --- Affichage principal ---
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-10 text-gray-500">Chargement de l'application...</div>
  }

  return (
    <Routes>
      {/* Routes Publiques */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!session ? <LoginPage /> : <RoleBasedRedirect />} />

      {/* Routes Protégées */}
      {session && (
        <Route element={<MainLayout profile={profile} loading={loading} onLogout={handleLogout} />}>
          <Route path="/benevole" element={profile.role === 'benevole' ? <BenevoleDashboard profile={profile} user={session.user} /> : <Navigate to="/" />} />          
          <Route path="/gestionnaire" element={['gestionnaire', 'gerant'].includes(profile.role) ? <GestionnaireDashboard profile={profile} user={session.user} /> : <Navigate to="/" />} />
          <Route path="/region/:id" element={<RegionPage profile={profile} />} />
          <Route path="/commune/:id" element={<CommunePage profile={profile} />} />
          <Route path="/village/:id" element={<VillagePage profile={profile} />} />
          <Route path="/saisir-recolte" element={<SaisieRecoltePage user={session.user} profile={profile} />} />
          <Route path="/historique-personnel" element={<HistoriquePersonnelPage user={session.user} />} />
          {/* Ajoutez ici les routes pour manager, gerant, etc. */}
          <Route path="/manager" element={profile.role === 'manager' ? <ManagerDashboard profile={profile} user={session.user} /> : <Navigate to="/" />} />
        </Route>
      )}

      {/* Redirection pour les utilisateurs connectés arrivant sur la racine */}
      {session && <Route path="/" element={<RoleBasedRedirect />} />}
    </Routes>
  )
}

export default App