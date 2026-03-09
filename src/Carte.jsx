// d:\TERANGASYNC\terangasync-app\src\Carte.jsx
import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Correction des icônes Leaflet par défaut (nécessaire avec Vite/Webpack)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Création de l'icône personnalisée avec animation Tailwind
const createBlinkingIcon = () => {
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative flex h-6 w-6 items-center justify-center">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-green-600 border-2 border-white shadow-sm"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

export default function Carte({ villages, onVillageSelect }) {
  // Centre par défaut sur le Sénégal
  const defaultCenter = [14.4974, -14.4524];

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer center={defaultCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Le MarkerClusterGroup gère automatiquement le regroupement des points proches */}
        <MarkerClusterGroup chunkedLoading>
          {villages.map((village, idx) => (
            <Marker 
              key={idx} 
              position={[village.lat, village.lng]}
              icon={createBlinkingIcon()}
              eventHandlers={{
                click: () => onVillageSelect(village.nom),
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong className="text-green-700 text-lg">{village.nom}</strong><br />
                  Production : <span className="font-bold">{village.kilos} kg</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
