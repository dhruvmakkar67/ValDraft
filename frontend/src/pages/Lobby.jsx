import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Users, Shield, User, Bot, Play, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function Lobby({ room, myPlayerId, onReadyUp }) {
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const players = room.players || [];
  const p1 = players[0];
  const p2 = players[1];

  const isMeReady = players.find((p) => p.id === myPlayerId)?.is_ready;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.room_code);
    setCopied(true);
    sounds.play('bid_raise');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReady = () => {
    sounds.play('bid_raise');
    onReadyUp();
  };

  return (
    <div className="lobby-page">
      <div className="lobby-container">
        {/* Room Code Share Header */}
        <motion.div 
          className="lobby-code-card glass-panel"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="code-meta">
            <span className="code-label font-display">LOBBY ACCESS CODE</span>
            <div className="code-value-row">
              <span className="room-code-display font-display">{room.room_code}</span>
              <button className="copy-btn font-display" onClick={handleCopyCode}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
              </button>
            </div>
          </div>
          <p className="code-sub">
            Share this code with your opponent or open a second browser window to test 2-player mode!
          </p>
        </motion.div>

        {/* Players Card Comparison */}
        <div className="lobby-players-grid">
          {/* Player 1 Card */}
          <motion.div 
            className={`lobby-player-card glass-panel ${p1?.is_ready ? 'ready' : ''}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="player-avatar-box">
              <User size={32} />
            </div>
            <div className="player-details">
              <span className="player-role-tag font-display">HOST // PLAYER 1</span>
              <h3 className="player-name font-display">{p1?.name || 'Waiting...'}</h3>
              <div className="player-status-badge font-display">
                <span className={`status-dot ${p1?.is_ready ? 'green' : 'amber'}`} />
                <span>{p1?.is_ready ? 'COMBAT READY' : 'PREPARING'}</span>
              </div>
            </div>
          </motion.div>

          <div className="vs-badge font-display">
            <span>VS</span>
          </div>

          {/* Player 2 Card */}
          <motion.div 
            className={`lobby-player-card glass-panel ${p2?.is_ready ? 'ready' : ''}`}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="player-avatar-box">
              {p2?.is_bot ? <Bot size={32} /> : <User size={32} />}
            </div>
            <div className="player-details">
              <span className="player-role-tag font-display">
                {p2?.is_bot ? 'AI OPPONENT' : 'CHALLENGER // PLAYER 2'}
              </span>
              <h3 className="player-name font-display">
                {p2?.name || 'WAITING FOR OPPONENT...'}
              </h3>
              <div className="player-status-badge font-display">
                <span className={`status-dot ${p2?.is_ready ? 'green' : 'amber'}`} />
                <span>
                  {p2 
                    ? (p2.is_ready ? 'COMBAT READY' : 'PREPARING') 
                    : 'AWAITING CONNECTION'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ready Action Bar */}
        <div className="lobby-actions">
          {players.length < 2 ? (
            <div className="lobby-waiting-banner glass-panel font-display">
              <div className="pulsing-spinner" />
              <span>WAITING FOR OPPONENT TO ENTER ROOM CODE...</span>
            </div>
          ) : (
            <button 
              className={`btn-val btn-large font-display ${isMeReady ? 'btn-secondary' : 'btn-cyan pulse-glow'}`}
              onClick={handleReady}
              disabled={isMeReady}
            >
              <Play size={20} />
              <span>{isMeReady ? 'READY! WAITING FOR OPPONENT...' : 'LOCK IN & READY UP'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
