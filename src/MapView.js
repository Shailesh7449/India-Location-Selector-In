import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from 'leaflet';

// Import Leaflet CSS - REQUIRED for map to render correctly
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet marker icons in Webpack/React environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Pulsing Icon for SaaS look and reliability
const pulsingIcon = L.divIcon({
  className: 'custom-pulsing-marker',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-10 h-10 bg-blue-500 rounded-full animate-ping opacity-75"></div>
      <div class="relative w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Helper component to update map view dynamically when location changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      console.log("Updating map view to:", center);
      map.setView(center, zoom, {
        animate: true,
        duration: 1.5
      });
      
      // Force invalidateSize to fix rendering issues in hidden/resized containers
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [center, zoom, map]);

  return null;
}

function MapView({ location, zoom: controlledZoom }) {
  // Add console logs to verify location state as requested
  console.log("MapView Received Location:", location);

  const defaultPosition = [20.5937, 78.9629]; // India center coordinates
  const zoom = controlledZoom || (location ? 15 : 5);

  // Validate coordinates are valid numbers
  const isValidLocation = 
    Array.isArray(location) && 
    location.length === 2 && 
    typeof location[0] === 'number' && 
    typeof location[1] === 'number' &&
    !isNaN(location[0]) && 
    !isNaN(location[1]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl animate-fade-in relative z-0">
      <MapContainer 
        center={defaultPosition} 
        zoom={controlledZoom || 5} 
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <ChangeView center={isValidLocation ? location : null} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {isValidLocation && (
          <Marker position={location} icon={pulsingIcon}>
            <Popup className="custom-popup">
              <div className="p-2 font-semibold text-slate-800 text-center">
                <div className="text-blue-600 mb-1">Selected Location</div>
                <div className="text-xs text-slate-500">
                  Lat: {location[0].toFixed(4)}, Lng: {location[1].toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;

