import React from 'react';
import { MapPin, Target } from 'lucide-react';

export default function MapBanner({ map }) {
  if (!map) return null;

  return (
    <div className="map-banner">
      <div 
        className="map-banner-bg" 
        style={{ backgroundImage: `url(${map.splash})` }} 
      />
      <div className="map-banner-overlay" />

      <div className="map-banner-content">
        <div className="map-meta-left">
          <div className="map-indicator font-display">
            <MapPin size={14} />
            <span>COMPETITIVE BATTLEGROUND</span>
          </div>
          <h1 className="map-title font-display">{map.name}</h1>
          <p className="map-subtitle">{map.subtitle}</p>
        </div>

        <div className="map-meta-right">
          <div className="site-badge font-display">
            <Target size={14} />
            <span>{map.sites} SPIKE SITES</span>
          </div>

          <div className="key-factors-row">
            {map.key_factors?.map((factor, idx) => (
              <span key={idx} className="factor-tag font-display">
                {factor}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
