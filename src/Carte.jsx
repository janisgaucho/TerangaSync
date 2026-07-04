// d:\TERANGASYNC\terangasync-app\src\Carte.jsx
import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
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

// NOUVEAU: Composant pour ajuster automatiquement la vue de la carte
function FitBounds({ villages }) {
  const map = useMap();
  useEffect(() => {
    if (villages && villages.length > 1) {
      const bounds = L.latLngBounds(villages.map(v => [v.lat, v.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [villages, map]);
  return null;
}

export default function Carte({ villages, onVillageSelect, zoom = 7 }) {
  // Centre par défaut sur le Sénégal
  const mapCenter = villages.length === 1 ? [villages[0].lat, villages[0].lng] : [14.4974, -14.4524];

  return (
    <div className="h-full w-full">
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Le MarkerClusterGroup gère automatiquement le regroupement des points proches */}
        <FitBounds villages={villages} />
        <MarkerClusterGroup
          chunkedLoading
          // Force le dégroupement des clusters pour une meilleure visibilité
          zoomToBoundsOnClick={true}
        >
          {villages.map((village, idx) => {
            const markerProps = {
              position: [village.lat, village.lng],
              icon: createBlinkingIcon(),
            };

            if (onVillageSelect) {
              markerProps.eventHandlers = { click: () => onVillageSelect(village.nom) };
            }

            return (
            <Marker key={idx} {...markerProps}>
              {onVillageSelect && (
                <Popup>
                  <div className="text-center">
                    <strong className="text-green-700 text-lg">{village.nom}</strong><br />
                    {village.kilos !== undefined && `Production : ${village.kilos} kg`}
                  </div>
                </Popup>
              )}
            </Marker>);
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
