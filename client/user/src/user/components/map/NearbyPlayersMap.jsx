import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import { Activity, Users, MapPin, User } from "lucide-react";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default icon issue in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ 
  iconUrl, 
  shadowUrl: iconShadow 
});

const mapStyles = `
  .pulsing-marker {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #55DEE8;
    border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(85,222,232,0.3);
    animation: pulse 2s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .pulsing-marker img {
    width: 100%;
    height: 100%;
    object-cover: cover;
  }
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(85,222,232,0.7); }
    70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(85,222,232,0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(85,222,232,0); }
  }
  .leaflet-container {
    width: 100%;
    height: 100%;
    background: #0a0a0a !important;
  }
  .premium-map-popup .leaflet-popup-content-wrapper {
    background: rgba(10, 10, 10, 0.9) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(85, 222, 232, 0.3);
    border-radius: 20px;
    padding: 2px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  }
  .premium-map-popup .leaflet-popup-tip {
    background: rgba(10, 10, 10, 0.9) !important;
    border: 1px solid rgba(85, 222, 232, 0.3);
  }
  .premium-map-popup .leaflet-popup-content {
    margin: 12px;
  }
`;

const MapEventsHandler = ({ onMapMove }) => {
  const map = useMapEvents({
    moveend: () => {
      onMapMove?.(map.getBounds(), map.getZoom());
    },
    zoomend: () => {
      onMapMove?.(map.getBounds(), map.getZoom());
    }
  });

  useEffect(() => {
    onMapMove?.(map.getBounds(), map.getZoom());
  }, []);

  return null;
};

const MapController = ({ userLocation, radiusKm }) => {
  const map = useMap();
  const circleRef = useRef(null);

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation, map]);

  useEffect(() => {
    if (userLocation && radiusKm) {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
      circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: radiusKm * 1000,
        color: '#55DEE8',
        fillOpacity: 0.05,
        strokeOpacity: 0.3,
        weight: 1
      }).addTo(map);
    }
    return () => {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
    };
  }, [userLocation, radiusKm, map]);

  return null;
};

const createClusterIcon = (count, previews) => {
  const avatarsHtml = previews.map(p => 
    `<img src="${p.profilePicture || 'https://pngimg.com/d/cricket_PNG102.png'}" 
          style="width:14px;height:14px;border-radius:50%;object-fit:cover;border:1px solid #55DEE8" />`
  ).join('');

  const html = `
    <div style="position:relative; cursor:pointer">
      <div style="
        width: 56px; height: 56px;
        border-radius: 50%;
        background: rgba(0,0,0,0.85);
        border: 2.5px solid #55DEE8;
        display: flex; align-items: center; justify-content: center;
        flex-wrap: wrap; gap: 2px; padding: 4px;
        box-shadow: 0 0 0 3px rgba(85,222,232,0.2);
      ">
        ${avatarsHtml}
        <div style="
          position:absolute; top:-6px; right:-6px;
          background:#55DEE8; color:black;
          border-radius:99px; padding:1px 5px;
          font-size:10px; font-weight:900;
        ">${count}</div>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [56, 56],
    iconAnchor: [28, 56]
  });
};

const createPlayerIcon = (profilePicture) => {
  const fallback = "https://pngimg.com/d/cricket_PNG102.png";
  const markerHtml = `
    <div style="position:relative; cursor:pointer">
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2.5px solid #55DEE8;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        background: #0a0a0a;
      ">
        <img src="${profilePicture || fallback}" 
             style="width:100%;height:100%;object-fit:cover" 
             onerror="this.src='${fallback}'"
        />
      </div>
      <div style="
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #55DEE8;
        margin: 0 auto;
      "></div>
    </div>
  `;
  return L.divIcon({
    html: markerHtml,
    className: "",
    iconSize: [40, 48],
    iconAnchor: [20, 48]
  });
};

const PlayerMarker = ({ player, onPlayerClick }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([player.lat, player.lng]);
    }
  }, [player.lat, player.lng]);

  const icon = useMemo(() => createPlayerIcon(player.profilePicture), [player.profilePicture]);

  return (
    <Marker 
      ref={markerRef}
      position={[player.lat, player.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onPlayerClick?.(player._id)
      }}
    >
      <Popup closeButton={false} className="premium-map-popup">
        <div className="flex flex-col items-center gap-2 p-1 min-w-[120px]">
          <div className="w-12 h-12 rounded-full border-2 border-[#55DEE8] overflow-hidden">
             <img 
               src={player.profilePicture || "https://pngimg.com/d/cricket_PNG102.png"} 
               className="w-full h-full object-cover" 
               alt=""
             />
          </div>
          <div className="text-center">
            <h4 className="text-white font-black uppercase text-[10px] tracking-widest leading-tight">{player.name}</h4>
            <div className="flex items-center justify-center gap-1 mt-1">
               <Activity size={10} className="text-[#55DEE8]" />
               <span className="text-[#55DEE8] text-[8px] font-black uppercase tracking-tighter">
                {player.sportTypes?.[0] || 'Active Player'}
               </span>
            </div>
          </div>
          <div className="w-full h-px bg-white/10 my-1" />
          <div className="flex items-center gap-1.5 text-white/40 text-[7px] font-bold uppercase tracking-widest">
            <MapPin size={8} />
            {player.distanceKm?.toFixed(1)}km Away
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const MapInner = ({ nearbyPlayers, onPlayerClick, userLocation, radiusKm, onMapMove }) => {
  const map = useMap();
  
  const userIcon = L.divIcon({
    className: 'pulsing-marker-container',
    html: `
      <div class="pulsing-marker">
        <img src="${userLocation?.profilePicture || 'https://pngimg.com/d/cricket_PNG102.png'}" />
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CartoDB</a>'
        updateWhenIdle={true}
        keepBuffer={2}
      />
      
      <MapController userLocation={userLocation} radiusKm={radiusKm} />
      <MapEventsHandler onMapMove={onMapMove} />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {nearbyPlayers.map(item => {
        if (item.type === "cluster") {
          return (
            <Marker 
              key={item._id}
              position={[item.lat, item.lng]}
              icon={createClusterIcon(item.count, item.previews)}
              eventHandlers={{
                click: () => map.flyTo([item.lat, item.lng], map.getZoom() + 2, { duration: 0.5 })
              }}
            />
          );
        }
        return (
          <PlayerMarker 
            key={item._id} 
            player={item} 
            onPlayerClick={onPlayerClick} 
          />
        );
      })}

    </>
  );
};

const NearbyPlayersMap = ({ 
  userLocation, 
  nearbyPlayers = [], 
  radiusKm, 
  onMapMove, 
  onPlayerClick 
}) => {
  const defaultCenter = userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629];
  
  return (
    <div className="w-full h-full relative">
      <style>{mapStyles}</style>
      <MapContainer 
        center={defaultCenter} 
        zoom={14} 
        scrollWheelZoom={true}
        minZoom={10}
        maxZoom={18}
        zoomControl={false}
        preferCanvas={true}
      >
        <MapInner 
          nearbyPlayers={nearbyPlayers}
          onPlayerClick={onPlayerClick}
          userLocation={userLocation}
          radiusKm={radiusKm}
          onMapMove={onMapMove}
        />
      </MapContainer>
    </div>
  );
};

export default NearbyPlayersMap;
