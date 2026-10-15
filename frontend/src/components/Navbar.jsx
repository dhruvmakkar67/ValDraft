import React, { useState } from 'react';
import { Volume2, VolumeX, Key, Shield, Radio, Server } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function Navbar({ roomCode, onOpenApiKeyModal, onOpenServerModal, isConnected, isLocalMode }) {
  const [muted, setMuted] = useState(sounds.muted);

  const toggleAudio = () => {
    const isMuted = sounds.toggleMute();
    setMuted(isMuted);
    if (!isMuted) {
      sounds.play('bid_raise');
    }
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="val-logo">
          <div className="logo-symbol">
            <span>V</span>
          </div>
          <div className="logo-text">
            <span className="logo-title font-display">VALDRAFT</span>
            <span className="logo-sub font-display">VCT AUCTION & COMP DUEL</span>
          </div>
        </div>

        {roomCode && (
          <div className="room-badge">
            <span className="room-label font-display">ROOM:</span>
            <span className="room-code font-display">{roomCode}</span>
          </div>
        )}
      </div>

      <div className="nav-right">
        {isLocalMode ? (
          <div 
            className="status-pill online" 
            onClick={onOpenServerModal}
            title="Click to configure backend server for multiplayer"
            style={{ cursor: 'pointer' }}
          >
            <Radio size={14} className="pulse-icon" />
            <span className="font-display">SOLO READY</span>
          </div>
        ) : (
          <div 
            className={`status-pill ${isConnected ? 'online' : 'offline'}`}
            onClick={onOpenServerModal}
            title="Click to configure backend server connection"
            style={{ cursor: 'pointer' }}
          >
            <Radio size={14} className={isConnected ? 'pulse-icon' : ''} />
            <span className="font-display">{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
          </div>
        )}

        <button 
          className="icon-btn" 
          onClick={onOpenServerModal} 
          title="Configure Multiplayer Backend Server"
        >
          <Server size={18} />
          <span className="btn-label font-display">SERVER</span>
        </button>

        <button 
          className="icon-btn" 
          onClick={onOpenApiKeyModal} 
          title="Configure Gemini API Key"
        >
          <Key size={18} />
          <span className="btn-label font-display">GEMINI AI</span>
        </button>

        <button 
          className={`icon-btn ${muted ? 'muted' : ''}`} 
          onClick={toggleAudio}
          title={muted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
    </header>
  );
}

