import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import VillagesManager from './VillagesManager';
import CommunesManager from './CommunesManager';
import RegionsManager from './RegionsManager';

export default function GestionLieux() {
  const [activeTab, setActiveTab] = useState('villages');

  const renderContent = () => {
    switch (activeTab) {
      case 'regions':
        return <RegionsManager />;
      case 'communes':
        return <CommunesManager />;
      case 'villages':
      default:
        return <VillagesManager />;
    }
  };

  const getTabClass = (tabName) => {
    return activeTab === tabName
      ? "py-2 px-4 text-green-600 font-medium border-b-2 border-green-600 -mb-px"
      : "py-2 px-4 text-gray-500 hover:text-gray-700 border-b-2 border-transparent";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        Retour à l'accueil admin
      </Link>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Gestion des Lieux
        </h1>
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('regions')} className={getTabClass('regions')}>
            Régions
          </button>
          <button onClick={() => setActiveTab('communes')} className={getTabClass('communes')}>
            Communes
          </button>
          <button onClick={() => setActiveTab('villages')} className={getTabClass('villages')}>
            Villages
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}