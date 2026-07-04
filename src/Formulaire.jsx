import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabaseClient'

export default function Formulaire({ user, profile }) {
  // --- ÉTATS POUR LES LISTES DÉROULANTES ---
  const [listePays, setListePays] = useState([])
  const [listeRegions, setListeRegions] = useState([])
  const [listeCommunes, setListeCommunes] = useState([])
  const [listeVillages, setListeVillages] = useState([])
  // --- NOUVEAU : États pour le cache en mémoire ---
  const [allRegions, setAllRegions] = useState([]);
  const [allCommunes, setAllCommunes] = useState([]);
  const [allVillages, setAllVillages] = useState([]);

  const [listeVarietes, setListeVarietes] = useState([])

  // --- ÉTAT POUR LE MODE HORS-LIGNE ---
  const [offlineQueue, setOfflineQueue] = useState([])

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
    chargerDonneesReferentiel()
    
    // Charger les données en attente depuis le stockage local de la tablette
    const savedQueue = localStorage.getItem('teranga_offline_queue')
    if (savedQueue) setOfflineQueue(JSON.parse(savedQueue))

    // Écouteur pour recharger automatiquement quand on repasse en ligne
    const handleOnline = () => {
      console.log("Connexion rétablie : Mise à jour du référentiel...")
      chargerDonneesReferentiel()
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  // NOUVEAU : Effet pour pré-remplir le formulaire en fonction du profil
  useEffect(() => {
    if (profile) {
      const paysSénégal = 1; // On assume que le Sénégal a l'ID 1
      setPaysId(paysSénégal);

      if (profile.role === 'manager' && profile.region?.id) {
        setRegionId(profile.region.id);
      }
      
      if (profile.role === 'benevole' && profile.commune?.id) {
        // Pour le bénévole, il faut trouver la région de sa commune
        const communeInfo = JSON.parse(localStorage.getItem('ref_communes') || '[]').find(c => c.id === profile.commune.id);
        if (communeInfo) {
          setRegionId(communeInfo.region_id);
          setCommuneId(profile.commune.id);
        }
      }
    }
  }, [profile]);

  // Mise à jour des listes en cascade lorsque les IDs sont pré-remplis
  useEffect(() => {
    if (paysId && allRegions.length > 0) {
      chargerRegions(paysId);
    }
    if (regionId && allCommunes.length > 0) {
      chargerCommunes(regionId);
    }
    if (communeId && allVillages.length > 0) {
      chargerVillages(communeId);
    }
  }, [paysId, regionId, communeId, allRegions, allCommunes, allVillages]);

  // Charge tout le référentiel (Pays, Régions, Communes, Villages, Variétés)
  // et le met en cache pour le mode hors-ligne
  async function chargerDonneesReferentiel() {
    // 1. Charger depuis le cache local (priorité offline)
    const cachedPays = localStorage.getItem('ref_pays')
    const cachedVarietes = localStorage.getItem('ref_variete')
    
    if (cachedPays) setListePays(JSON.parse(cachedPays))
    if (cachedVarietes) setListeVarietes(JSON.parse(cachedVarietes))

    // 2. Si en ligne, on télécharge TOUT pour mettre à jour le cache
    if (navigator.onLine) {
      try {
        console.log("Mise à jour du référentiel local...");

        const { data: pays, error: paysError } = await supabase.from('pays').select('*');
        if (paysError) console.error("Erreur chargement pays:", paysError);
        else if (pays) { 
          localStorage.setItem('ref_pays', JSON.stringify(pays)); 
          setListePays(pays); 
        }

        const { data: regions, error: regionsError } = await supabase.from('region').select('*');
        if (regionsError) console.error("Erreur chargement régions:", regionsError);
        else if (regions) {
          setAllRegions(regions); // Mise en cache mémoire
          localStorage.setItem('ref_regions', JSON.stringify(regions));
        }

        const { data: communes, error: communesError } = await supabase.from('commune').select('*');
        if (communesError) console.error("Erreur chargement communes:", communesError);
        else if (communes) {
          setAllCommunes(communes); // Mise en cache mémoire
          localStorage.setItem('ref_communes', JSON.stringify(communes));
        }

        const { data: villages, error: villagesError } = await supabase.from('village').select('*');
        if (villagesError) console.error("Erreur chargement villages:", villagesError);
        else if (villages) {
          setAllVillages(villages); // Mise en cache mémoire
          localStorage.setItem('ref_villages', JSON.stringify(villages));
        }

        const { data: varietes, error: varietesError } = await supabase.from('variete').select('*');
        if (varietesError) console.error("Erreur chargement variétés:", varietesError);
        else if (varietes) { 
          localStorage.setItem('ref_variete', JSON.stringify(varietes)); 
          setListeVarietes(varietes); 
        }

      } catch (error) {
        // This would catch network errors, not Supabase API errors which are handled above.
        console.error("Erreur réseau lors du chargement du référentiel:", error);
      }
    }
  }

  // Fonctions de chargement en cascade (optimisées)
  function chargerRegions(id_pays) {
    setPaysId(id_pays);
    // On ne réinitialise que si l'utilisateur change manuellement le pays
    if (id_pays !== paysId) {
      setRegionId(''); setCommuneId(''); setVillageId('');
      setListeCommunes([]); setListeVillages([]);
    }
    
    if (!id_pays) return;
    
    const paysIdNum = parseInt(id_pays, 10);
    // On filtre la liste complète des régions déjà en mémoire
    const regionsFiltrees = allRegions.filter(r => r.pays_id === paysIdNum);
    setListeRegions(regionsFiltrees);
  }

  function chargerCommunes(id_region) {
    setRegionId(id_region);
    if (id_region !== regionId) {
      setCommuneId(''); setVillageId('');
      setListeVillages([]);
    }
    
    if (!id_region) return;

    const regionIdNum = parseInt(id_region, 10);
    // On filtre la liste complète des communes déjà en mémoire
    const communesFiltrees = allCommunes.filter(c => c.region_id === regionIdNum);
    setListeCommunes(communesFiltrees);
  }

  function chargerVillages(id_commune) {
    setCommuneId(id_commune);
    if (id_commune !== communeId) {
      setVillageId('');
    }
    
    if (!id_commune) return;

    const communeIdNum = parseInt(id_commune, 10);
    // On filtre la liste complète des villages déjà en mémoire
    const villagesFiltres = allVillages.filter(v => v.commune_id === communeIdNum);
    setListeVillages(villagesFiltres);
  }

  // Fonction pour synchroniser les données locales vers Supabase
  const synchroniserTout = async () => {
    if (!navigator.onLine) {
      alert("Pas de connexion internet détectée. Impossible de synchroniser.")
      return
    }

    let successCount = 0
    const remaining = []

    for (const item of offlineQueue) {
      try {
        // 1. Création Parcelle
        const { data: parcelleData, error: parcelleError } = await supabase
          .from('parcelle')
          .insert([{ 
            village_id: item.village_id, 
            surface_totale_hectares: item.surface,
            nom_ou_reference: `Parcelle Offline ${new Date(item.date_saisie).toLocaleDateString()}`
          }])
          .select().single()
        
        if (parcelleError) throw parcelleError

        // 2. Création Récolte
        const { error: recolteError } = await supabase
          .from('recolte')
          .insert([{
            parcelle_id: parcelleData.id,
            variete_id: item.variete_id,
            quantite_kg: item.quantite_kg,
            surface_utilisee_hectares: item.surface,
            date_saisie: item.date_saisie,
            user_id: item.user_id
          }])

        if (recolteError) throw recolteError
        successCount++

      } catch (error) {
        console.error("Erreur synchro item:", item, error)
        remaining.push(item) // On garde ceux qui ont échoué
      }
    }

    setOfflineQueue(remaining)
    localStorage.setItem('teranga_offline_queue', JSON.stringify(remaining))
    alert(`${successCount} récoltes synchronisées avec succès !`)
  }

  // Validation du formulaire
  const soumettreRecolte = async (e) => {
    e.preventDefault()
    
    // Règle de gestion : On convertit les tonnes en Kg pour la base de données !
    let quantiteFinaleEnKg = parseFloat(quantite)
    if (unite === 'tonnes') {
      quantiteFinaleEnKg = quantiteFinaleEnKg * 1000
    }

    // GESTION MODE HORS-LIGNE
    if (!navigator.onLine) {
      const offlineData = {
        village_id: villageId,
        variete_id: varieteId,
        quantite_kg: quantiteFinaleEnKg,
        surface: parseFloat(surface),
        date_saisie: new Date().toISOString(),
        user_id: user.id,
        // Métadonnées pour l'affichage local
        nom_village: listeVillages.find(v => v.id == villageId)?.nom,
        nom_variete: listeVarietes.find(v => v.id == varieteId)?.nom
      }

      const newQueue = [...offlineQueue, offlineData]
      setOfflineQueue(newQueue)
      localStorage.setItem('teranga_offline_queue', JSON.stringify(newQueue))
      
      alert("⚠️ Pas de connexion : Récolte sauvegardée sur la tablette. Pensez à synchroniser plus tard !")
      setQuantite(''); setSurface(''); setVarieteId('');
      return
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
      
      {/* BANDEAU DE SYNCHRONISATION (Visible seulement si des données sont en attente) */}
      {offlineQueue.length > 0 && (
        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 flex justify-between items-center animate-pulse">
          <div>
            <p className="font-bold">Mode Hors-Ligne</p>
            <p className="text-sm">{offlineQueue.length} récolte(s) en attente d'envoi.</p>
          </div>
          <button type="button" onClick={synchroniserTout} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded">
            🔄 Synchroniser maintenant
          </button>
        </div>
      )}

      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <h3 className="text-lg font-bold text-green-800 mb-4">📍 Localisation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* PAYS */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pays
              {listePays.length === 0 && (
                <button type="button" onClick={chargerDonneesReferentiel} className="ml-2 text-xs text-green-600 underline hover:text-green-800">
                  🔄 Recharger la liste
                </button>
              )}
            </label>
            <select required value={paysId} onChange={(e) => chargerRegions(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border" disabled={profile?.role !== 'gestionnaire' && profile?.role !== 'gerant'}>
              <option value="">-- Choisir un pays --</option>
              {listePays.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>

          {/* RÉGION */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Région</label>
            <select required disabled={!paysId || (profile?.role === 'manager' || profile?.role === 'benevole')} value={regionId} onChange={(e) => chargerCommunes(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border disabled:bg-gray-100">
              <option value="">-- Choisir une région --</option>
              {listeRegions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
            </select>
          </div>

          {/* COMMUNE */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Commune</label>
            <select required disabled={!regionId || profile?.role === 'benevole'} value={communeId} onChange={(e) => chargerVillages(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border disabled:bg-gray-100">
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