// d:\TERANGASYNC\terangasync-app\src\Dashboard.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Correction des icônes Leaflet par défaut qui buggent souvent avec les bundlers comme Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Création de l'icône personnalisée avec animation Tailwind
const createBlinkingIcon = () => {
  return L.divIcon({
    className: 'bg-transparent border-none', // Supprime le carré blanc par défaut de Leaflet
    html: `
      <div class="relative flex h-6 w-6 items-center justify-center">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-green-600 border-2 border-white shadow-sm"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12], // Centre l'icône sur les coordonnées
    popupAnchor: [0, -12] // La popup s'ouvre un peu au-dessus
  })
}

// Fonction utilitaire pour convertir le format Hexadécimal PostGIS (WKB) en Lat/Lng
const parsePostGISCoordinates = (hexString) => {
  if (!hexString || typeof hexString !== 'string') return null;
  try {
    // On vérifie si c'est bien du hex
    if (!/^[0-9A-Fa-f]+$/.test(hexString)) return null;

    // Conversion hex -> bytes
    const bytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const view = new DataView(bytes.buffer);
    
    // Lecture du format WKB (Little Endian pour 01)
    const littleEndian = view.getUint8(0) === 1;
    const type = view.getUint32(1, littleEndian);
    
    // Décalage : 1 byte (endian) + 4 bytes (type) + 4 bytes (SRID si présent)
    // Le flag SRID est 0x20000000
    const offset = (type & 0x20000000) ? 9 : 5;
    
    const lng = view.getFloat64(offset, littleEndian);
    const lat = view.getFloat64(offset + 8, littleEndian);
    
    return { lat, lng };
  } catch (e) {
    console.error("Erreur parsing coordonnées:", e);
    return null;
  }
}

export default function Dashboard({ onLoginClick, isPublic = true }) {
  const [loading, setLoading] = useState(true)
  const [statsVillage, setStatsVillage] = useState([])
  const [statsVariete, setStatsVariete] = useState([])
  const [mapMarkers, setMapMarkers] = useState([])
  const [rawData, setRawData] = useState([])
  const [selectedVillage, setSelectedVillage] = useState(null)
  const [totalRecolte, setTotalRecolte] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // On récupère les récoltes avec les relations : Variété et Parcelle -> Village
    // Note: !inner force la jointure pour s'assurer qu'on a bien les données liées
    const { data, error } = await supabase
      .from('recolte')
      .select(`
        quantite_kg,
        variete ( nom ),
        parcelle ( 
          village ( nom, coordonnees ) 
        )
      `)

    if (error) {
      console.error("Erreur chargement dashboard:", error)
    } else if (data) {
      console.log("Données reçues de Supabase :", data) // Pour vérifier dans la console (F12)
      setRawData(data)
      traiterDonnees(data)
    }
    setLoading(false)
  }

  // Fonction réutilisable pour calculer les stats (avec ou sans filtre)
  const traiterDonnees = (data, villageFiltre = null) => {
    // Si un village est sélectionné, on filtre les données brutes
    const dataAFiltre = villageFiltre 
      ? data.filter(item => item.parcelle?.village?.nom === villageFiltre)
      : data

    // 1. Calcul du total global
    const total = dataAFiltre.reduce((acc, curr) => acc + (curr.quantite_kg || 0), 0)
    setTotalRecolte(total)

    // 2. Agrégation par Village
    const mapVillage = {}
    dataAFiltre.forEach(item => {
      // Sécurisation : on vérifie que la chaîne de relation existe
      const villageNom = item.parcelle?.village?.nom || "Inconnu"
      if (!mapVillage[villageNom]) mapVillage[villageNom] = 0
      mapVillage[villageNom] += item.quantite_kg
    })

    // Transformation en tableau pour Recharts
    const dataVillage = Object.keys(mapVillage).map(key => ({
      name: key,
      kilos: mapVillage[key]
    })).sort((a, b) => b.kilos - a.kilos) // Tri décroissant

    setStatsVillage(dataVillage)

    // 3. Agrégation par Variété
    const mapVariete = {}
    dataAFiltre.forEach(item => {
      const varieteNom = item.variete?.nom || "Autre"
      if (!mapVariete[varieteNom]) mapVariete[varieteNom] = 0
      mapVariete[varieteNom] += item.quantite_kg
    })

    const dataVariete = Object.keys(mapVariete).map(key => ({
      name: key,
      value: mapVariete[key]
    }))

    setStatsVariete(dataVariete)

    // 4. Préparation des marqueurs pour la carte (Villages avec coordonnées)
    // Note : On garde TOUS les marqueurs sur la carte même si on filtre, pour pouvoir cliquer sur un autre
    const markersMap = {}
    data.forEach(item => {
      const v = item.parcelle?.village
      
      let coords = null;
      if (v && v.coordonnees) {
        // Cas 1 : Format Hexadécimal (WKB) de PostGIS (le cas actuel)
        if (typeof v.coordonnees === 'string') {
          coords = parsePostGISCoordinates(v.coordonnees);
        } 
        // Cas 2 : Format GeoJSON (si configuré autrement dans le futur)
        else if (v.coordonnees.coordinates) {
          coords = { lat: v.coordonnees.coordinates[1], lng: v.coordonnees.coordinates[0] };
        }
      }

      if (coords) {
        if (!markersMap[v.nom]) {
          markersMap[v.nom] = {
            nom: v.nom,
            lat: coords.lat,
            lng: coords.lng,
            kilos: 0
          }
        }
        markersMap[v.nom].kilos += item.quantite_kg
      }
    })
    setMapMarkers(Object.values(markersMap))
  }

  // Gestion du clic sur un marqueur
  const handleMarkerClick = (nomVillage) => {
    setSelectedVillage(nomVillage)
    traiterDonnees(rawData, nomVillage)
  }

  // Réinitialisation
  const handleReset = () => {
    setSelectedVillage(null)
    traiterDonnees(rawData, null)
  }

  // Couleurs pour le camembert (Pie Chart)
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) return <div className="text-center p-10 text-gray-500">Chargement des données publiques...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Public */}
      {isPublic && (
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-800">TerangaSync <span className="text-sm font-normal text-gray-500">| Portail Public</span></h1>
            <button 
              onClick={onLoginClick}
              className="text-sm font-medium text-green-600 hover:text-green-800"
            >
              Accès Gérant (Login) &rarr;
            </button>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Barre de filtre actif */}
        {selectedVillage && (
          <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 flex justify-between items-center" role="alert">
            <div>
              <p className="font-bold">Filtré sur le village : {selectedVillage}</p>
              <p className="text-sm">Les graphiques ci-dessous montrent uniquement les données de cette zone.</p>
            </div>
            <button onClick={handleReset} className="bg-white text-green-700 px-4 py-2 rounded shadow hover:bg-green-50 text-sm font-medium">
              &times; Voir tout le Sénégal
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Récolté {selectedVillage ? `(${selectedVillage})` : "(National)"}</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{(totalRecolte / 1000).toFixed(2)} Tonnes</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Villages Participants</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{statsVillage.length}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Variétés Cultivées</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{statsVariete.length}</dd>
            </div>
          </div>
        </div>

        {/* Carte Interactive */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Carte des Récoltes</h3>
          <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200">
            <MapContainer center={[14.4974, -14.4524]} zoom={7} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapMarkers.map((marker, idx) => (
                <Marker 
                  key={idx} 
                  position={[marker.lat, marker.lng]}
                  icon={createBlinkingIcon()}
                  eventHandlers={{
                    click: () => handleMarkerClick(marker.nom),
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="text-green-700 text-lg">{marker.nom}</strong><br />
                      Production : <span className="font-bold">{marker.kilos} kg</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Graphique 1 : Bar Chart par Village */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Production par Village (Kg)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={statsVillage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="kilos" fill="#16a34a" name="Quantité (Kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique 2 : Pie Chart par Variété */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Répartition par Variété</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={statsVariete}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statsVariete.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
