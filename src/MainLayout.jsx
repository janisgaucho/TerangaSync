import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function MainLayout({ profile, loading, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Détermine le chemin de la page d'accueil en fonction du rôle de l'utilisateur
  const getHomePath = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'benevole':
        return '/benevole';
      case 'gestionnaire':
      case 'gerant':
        return '/gestionnaire';
      case 'manager':
        return '/manager';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={getHomePath()} className="text-xl font-bold text-green-800">TerangaSync</Link>
            <div className="flex items-center gap-4 relative" ref={menuRef}>
              {profile && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold uppercase">
                  {profile.role}
                </span>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {menuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 top-full w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <Link
                      to="/mon-compte" // Note: cette route n'existe pas encore
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      Mon compte
                    </Link>                    
                    {profile.role === 'admin' ? (
                      <>
                        <Link to="/admin/lieux" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" onClick={() => setMenuOpen(false)}>
                          Gestion des Lieux
                        </Link>
                        <Link to="/admin/utilisateurs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" onClick={() => setMenuOpen(false)}>
                          Utilisateurs
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/saisir-recolte"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          Saisir une récolte
                        </Link>
                        <Link
                          to="/historique-personnel"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          Historique de récolte
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => { onLogout(); setMenuOpen(false); }}
                      disabled={loading}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50"
                      role="menuitem"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}