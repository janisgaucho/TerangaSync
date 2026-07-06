import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Settings } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900">
        Espace Administration
      </h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {/* Carte Gestion des Lieux */}
        <Link to="/admin/lieux" className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 aspect-square group">
          <MapPin size={48} className="text-green-600 group-hover:scale-110 transition-transform" />
          <span className="font-medium mt-4 text-gray-800 text-center">Gestion des Lieux</span>
        </Link>

        {/* Carte Utilisateurs (fictive) */}
        <Link to="/admin/utilisateurs" className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 aspect-square group">
          <Users size={48} className="text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="font-medium mt-4 text-gray-800 text-center">Utilisateurs</span>
        </Link>
      </div>
    </div>
  );
}