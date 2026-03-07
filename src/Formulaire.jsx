import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Formulaire({ user }) {
  // --- ÉTATS POUR LES LISTES DÉROULANTES ---
  const [listePays, setListePays] = useState([])
  const [listeRegions, setListeRegions] = useState([])
  const [listeCommunes, setListeCommunes] = useState([])
  const [listeVillages, setListeVillages] = useState([])
  const [listeVarietes, setListeVarietes] = useState([])

  // --- ÉTATS POUR LES CHOIX DE L'UTILISATEUR ---
  const [paysId, setPaysId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [communeId, setCommuneId] = useState('')
  const [villageId, setVillageId] = useState('')
  const [varieteId, setVarieteId] = useState('')
  
  // --- ÉTATS POUR LES DONNÉES AGRICOLES ---
  const [quantite, setQuantite] = useState('')
  const [unite, setUnite] = useState('kg') // kg ou tonnes
  const [surface, setSurface] = useState('')

  // Chargement initial (Pays et Variétés)
  useEffect(() => {
    chargerPaysEtVarietes()
  }, [])

  async function chargerPaysEtVarietes() {
    const { data: paysData } = await supabase.from('pays').select('*')
    if (paysData) setListePays(paysData)

    const { data: varietesData } = await supabase.from('variete').select('*')
    if (varietesData) setListeVarietes(varietesData)
  }

  // Fonctions de chargement en cascade
  async function chargerRegions(id_pays) {
    setPaysId(id_pays); setRegionId(''); setCommuneId(''); setVillageId('');
    setListeRegions([]); setListeCommunes([]); setListeVillages([]);
    
    if (!id_pays) return;
    const { data } = await supabase.from('region').select('*').eq('pays_id', id_pays)
    if (data) setListeRegions(data)
  }

  async function chargerCommunes(id_region) {
    setRegionId(id_region); setCommuneId(''); setVillageId('');
    setListeCommunes([]); setListeVillages([]);
    
    if (!id_region) return;
    const { data } = await supabase.from('commune').select('*').eq('region_id', id_region)
    if (data) setListeCommunes(data)
  }

  async function chargerVillages(id_commune) {
    setCommuneId(id_commune); setVillageId('');
    setListeVillages([]);
    
    if (!id_commune) return;
    const { data } = await supabase.from('village').select('*').eq('commune_id', id_commune)
    if (data) setListeVillages(data)
  }

  // Validation du formulaire
  const soumettreRecolte = async (e) => {
    e.preventDefault()
    
    // Règle de gestion : On convertit les tonnes en Kg pour la base de données !
    let quantiteFinaleEnKg = parseFloat(quantite)
    if (unite === 'tonnes') {
      quantiteFinaleEnKg = quantiteFinaleEnKg * 1000
    }

    try {
      // 1. Création de la parcelle (simplifié : une parcelle par récolte pour l'instant)
      const { data: parcelleData, error: parcelleError } = await supabase
        .from('parcelle')
        .insert([
          { 
            village_id: villageId, 
            surface_totale_hectares: parseFloat(surface),
            nom_ou_reference: `Parcelle ${new Date().toLocaleDateString()}`
          }
        ])
        .select()
        .single()

      if (parcelleError) throw parcelleError

      // 2. Création de la récolte
      const { error: recolteError } = await supabase
        .from('recolte')
        .insert([
          {
            parcelle_id: parcelleData.id,
            variete_id: varieteId,
            quantite_kg: quantiteFinaleEnKg,
            surface_utilisee_hectares: parseFloat(surface),
            date_saisie: new Date().toISOString(),
            user_id: user.id
          }
        ])

      if (recolteError) throw recolteError

      alert("Récolte enregistrée avec succès !")
      setQuantite(''); setSurface(''); setVarieteId('');
      
    } catch (error) {
      console.error("Erreur lors de l'enregistrement", error)
      alert("Erreur lors de l'enregistrement : " + error.message)
    }
  }

  return (
    <form onSubmit={soumettreRecolte} className="space-y-6">
      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <h3 className="text-lg font-bold text-green-800 mb-4">📍 Localisation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* PAYS */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Pays</label>
            <select required value={paysId} onChange={(e) => chargerRegions(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border">
              <option value="">-- Choisir un pays --</option>
              {listePays.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          {/* RÉGION */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Région</label>
            <select required disabled={!paysId} value={regionId} onChange={(e) => chargerCommunes(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border disabled:bg-gray-100">
              <option value="">-- Choisir une région --</option>
              {listeRegions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
            </select>
          </div>

          {/* COMMUNE */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Commune</label>
            <select required disabled={!regionId} value={communeId} onChange={(e) => chargerVillages(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border disabled:bg-gray-100">
              <option value="">-- Choisir une commune --</option>
              {listeCommunes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          {/* VILLAGE */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Village</label>
            <select required disabled={!communeId} value={villageId} onChange={(e) => setVillageId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border disabled:bg-gray-100">
              <option value="">-- Choisir un village --</option>
              {listeVillages.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* MODULE RÉCOLTE (S'affiche uniquement si un village est choisi) */}
      {villageId && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 animate-fade-in-up">
          <h3 className="text-lg font-bold text-yellow-800 mb-4">🌾 Données de la récolte</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* VARIÉTÉ */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Spéculation (Variété)</label>
              <select required value={varieteId} onChange={(e) => setVarieteId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border">
                <option value="">-- Choisir la culture --</option>
                {listeVarietes.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
              </select>
            </div>

            {/* QUANTITÉ & UNITÉ */}
            <div className="md:col-span-2 flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Quantité récoltée</label>
                <input type="number" step="0.01" required value={quantite} onChange={(e) => setQuantite(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border" placeholder="Ex: 500" />
              </div>
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700">Unité</label>
                <select value={unite} onChange={(e) => setUnite(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border bg-gray-50">
                  <option value="kg">Kg</option>
                  <option value="tonnes">Tonnes</option>
                </select>
              </div>
            </div>

            {/* SURFACE */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Surface (Hectares)</label>
              <input type="number" step="0.01" required value={surface} onChange={(e) => setSurface(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-2 border" placeholder="Ex: 1.5" />
            </div>

          </div>

          <button type="submit" className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
            Enregistrer la récolte
          </button>
        </div>
      )}
    </form>
  )
}