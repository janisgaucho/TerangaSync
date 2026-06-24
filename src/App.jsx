import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Formulaire from './Formulaire'
import Dashboard from './Dashboard'
import BenevoleDashboard from './BenevoleDashboard'
import GestionnaireDashboard from './GestionnaireDashboard'
import RegionPage from './RegionPage'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // Ajout pour stocker le profil utilisateur (et son rôle)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [selectedRegionId, setSelectedRegionId] = useState(null)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'formulaire' | 'login'

  // Cet effet s'exécute au chargement et à chaque changement d'état d'authentification
  useEffect(() => {
    // Fonction pour récupérer le profil de l'utilisateur connecté
    const fetchProfile = async (user) => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles') // On suppose une table 'profiles' avec une colonne 'role'
          .select('role, prenom, commune:commune_id (id, nom)')
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
      setSession(session) // Met à jour la session
      if (session?.user) {
        fetchProfile(session.user) // Récupère le profil associé
      } else {
        // Si l'utilisateur se déconnecte, on réinitialise tout
        setProfile(null)
        setEmail('')
        setPassword('')
        setSelectedRegionId(null)
        setView('dashboard') // Retour à la vue publique par défaut
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fonction pour se connecter
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErreur(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) setErreur("Email ou mot de passe incorrect.")
    setLoading(false)
  }

  // Fonction pour se déconnecter
  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    // Les états session et profile seront mis à null par onAuthStateChange
    setLoading(false)
  }

  // SI L'UTILISATEUR N'EST PAS CONNECTÉ
  if (!session) {
    // Si on est en mode "dashboard", on affiche le tableau de bord public
    if (view === 'dashboard') {
      return <Dashboard onLoginClick={() => setView('login')} />
    }

    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800">TerangaSync</h1>
            <p className="text-gray-500 mt-2">Espace Gérant - SCAT</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onClick={() => setView('dashboard')}
                className="text-sm text-green-600 hover:text-green-800 underline"
              >
                &larr; Retour au tableau de bord public
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // --- GESTION DES ACCÈS (RBAC) ---
  // Si le profil est en cours de chargement, on affiche un loader pour éviter les flashs de contenu
  if (!profile) {
    return <div className="text-center p-10 text-gray-500">Chargement du profil utilisateur...</div>
  }

  // Définition des permissions
  const canViewDashboard = ['manager', 'gestionnaire', 'gerant'].includes(profile.role);
  const canAccessForm = ['benevole', 'manager', 'gestionnaire', 'gerant'].includes(profile.role);

  // --- VUE SPÉCIFIQUE BÉNÉVOLE / GESTIONNAIRE ---
  if (profile.role === 'benevole') {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <span className="text-xl font-bold text-green-800">TerangaSync</span>
              <div className="flex items-center gap-4">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold uppercase">
                  {profile.role}
                </span>
                <button onClick={handleLogout} disabled={loading} className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50">
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main>
          <BenevoleDashboard profile={profile} user={session.user} />
        </main>
      </div>
    );
  }

  if (profile.role === 'gestionnaire') {
    // Si une région est sélectionnée, on affiche la page de détail
    if (selectedRegionId) {
      return <RegionPage regionId={selectedRegionId} onBackClick={() => setSelectedRegionId(null)} />;
    }

    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <span className="text-xl font-bold text-green-800">TerangaSync</span>
              <div className="flex items-center gap-4">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold uppercase">
                  {profile.role}
                </span>
                <button onClick={handleLogout} disabled={loading} className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50">
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main>
          <GestionnaireDashboard 
            profile={profile} 
            user={session.user} 
            onRegionClick={(id) => setSelectedRegionId(id)} />
        </main>
      </div>
    );
  }

  // SI L'UTILISATEUR EST CONNECTÉ : On affiche le tableau de bord (qui sera notre formulaire de saisie)
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Gérant */}
      <nav className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-green-800 mr-8">TerangaSync</span>
              <div className="hidden sm:flex space-x-4">
                {/* Le bouton "Vue d'ensemble" n'est visible que pour les rôles autorisés */}
                {canViewDashboard && (
                  <button
                    onClick={() => setView('dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${view === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Vue d'ensemble
                  </button>
                )}
                {/* Le bouton "Saisie" est visible pour tous les rôles connectés */}
                {canAccessForm && (
                  <button
                    onClick={() => setView('formulaire')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${view === 'formulaire' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Saisie Récolte
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Affiche le rôle de l'utilisateur s'il est chargé */}
              {profile && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold uppercase">
                  {profile.role}
                </span>
              )}
              <button onClick={handleLogout} disabled={loading} className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu Principal */}
      {/* On vérifie le droit d'accès avant d'afficher la vue */}
      {view === 'dashboard' && canViewDashboard && (
        <Dashboard isPublic={false} userRole={profile.role} />
      )}
      {view === 'formulaire' && canAccessForm && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 mx-4 sm:mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Formulaire de Récolte</h2>
          <Formulaire user={session.user} />      
        </div>
      )}
    </div>
  )
}

export default App