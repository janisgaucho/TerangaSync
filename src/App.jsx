import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Formulaire from './Formulaire'
import Dashboard from './Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'login'

  // Vérifie si un utilisateur est déjà connecté au chargement de la page
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
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
    await supabase.auth.signOut()
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

  // SI L'UTILISATEUR EST CONNECTÉ : On affiche le tableau de bord (qui sera notre formulaire de saisie)
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Gérant */}
      <nav className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-green-800 mr-8">TerangaSync <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Admin</span></span>
              <div className="hidden sm:flex space-x-4">
                <button
                  onClick={() => setView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${view === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Vue d'ensemble
                </button>
                <button
                  onClick={() => setView('formulaire')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${view === 'formulaire' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Saisie Récolte
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 text-sm font-medium">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu Principal */}
      {view === 'dashboard' ? (
        <Dashboard isPublic={false} />
      ) : (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 mx-4 sm:mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Formulaire de Récolte</h2>
          <Formulaire user={session.user} />      
        </div>
      )}
    </div>
  )
}

export default App