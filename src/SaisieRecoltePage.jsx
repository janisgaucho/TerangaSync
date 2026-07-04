import React from 'react';
import Formulaire from './Formulaire';

export default function SaisieRecoltePage({ user, profile }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Saisir une nouvelle récolte
        </h1>
        <Formulaire user={user} profile={profile} />
      </div>
    </div>
  );
}