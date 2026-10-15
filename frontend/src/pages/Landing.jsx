import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Users, Play, LogIn, Sparkles, HelpCircle, Shield, Gavel, Coins } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function Landing({ onCreateRoom, onJoinRoom, isConnected, onOpenServerModal }) {
  const [playerName, setPlayerName] = useState('RadiantPlayer');
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState('solo'); // 'solo' or 'multi'
  const [showRules, setShowRules] = useState(false);

  const handleSoloStart = () => {
    sounds.play('bid_raise');
    onCreateRoom(playerName.trim() || 'Player 1', true);
  };

  const handleCreateMulti = () => {
    sounds.play('bid_raise');
    onCreateRoom(playerName.trim() || 'Player 1', false);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    sounds.play('bid_raise');
    onJoinRoom(joinCode.trim().toUpperCase(), playerName.trim() || 'Player 2');
  };

  return (
    <div className="landing-page">
      {/* Background Graphic Elements */}
      <div className="cyber-grid-overlay" />
      <div className="radial-accent-red" />
      <div className="radial-accent-cyan" />

      <div className="landing-content">
        {/* Hero Title */}
        <motion.div 
          className="hero-header"
          initial={{ y: -25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-kicker font-display">
            <span className="kicker-tag">VALORANT DRAFT ROYALE</span>
            <span className="kicker-sub">SEASON 2026 // COMPETITIVE</span>
          </div>

          <h1 className="hero-title font-display">
            VAL<span className="accent-red">DRAFT</span>
          </h1>

          <p className="hero-subtitle">
            Turn-by-turn agent auction battleground. Bid with a 10,000 credit budget, draft a 5-agent squad on a random competitive map, and let AI evaluate your tactical synergy.
          </p>
        </motion.div>

        {/* Main Interactive Card */}
        <motion.div 
          className="action-card glass-panel"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {/* Player Name Input */}
          <div className="input-group">
            <label className="input-label font-display">YOUR AGENT CODENAME</label>
            <input 
              type="text" 
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              className="player-name-input font-display"
            />
          </div>

          {/* Mode Selector Tabs */}
          <div className="mode-tabs">
            <button 
              className={`mode-tab ${activeTab === 'solo' ? 'active' : ''} font-display`}
              onClick={() => setActiveTab('solo')}
            >
              <Bot size={18} />
              <span>SOLO VS AI BOT</span>
            </button>

            <button 
              className={`mode-tab ${activeTab === 'multi' ? 'active' : ''} font-display`}
              onClick={() => setActiveTab('multi')}
            >
              <Users size={18} />
              <span>2-PLAYER ONLINE</span>
            </button>
          </div>

          {/* Tab Content: Solo Mode */}
          {activeTab === 'solo' && (
            <div className="tab-pane">
              <p className="tab-desc">
                Practice against <strong>Viper Bot (AI)</strong>. Instant matchmaking with realistic incremental bidding, role balancing, and comp evaluation.
              </p>
              <button 
                className="btn-val btn-cyan w-full btn-large"
                onClick={handleSoloStart}
              >
                <Play size={20} />
                <span>START SOLO MATCH (VS BOT)</span>
              </button>
            </div>
          )}

          {/* Tab Content: Multi Mode */}
          {activeTab === 'multi' && (
            <div className="tab-pane multi-pane">
              {!isConnected && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(243, 178, 58, 0.1)',
                  border: '1px solid rgba(243, 178, 58, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '10px',
                  fontSize: '0.8rem',
                  color: 'var(--val-gold)'
                }}>
                  <span>Server offline or waking up.</span>
                  <button 
                    type="button" 
                    onClick={onOpenServerModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--val-cyan)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}
                  >
                    Configure Server
                  </button>
                </div>
              )}
              <button 
                className="btn-val w-full btn-large"
                onClick={handleCreateMulti}
              >
                <Users size={20} />
                <span>CREATE LOBBY & GET CODE</span>
              </button>


              <div className="or-divider font-display">
                <span>OR JOIN EXISTING ROOM</span>
              </div>

              <form onSubmit={handleJoinSubmit} className="join-room-form">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="ROOM CODE (E.G. VD1234)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="room-code-input font-display"
                />
                <button 
                  type="submit" 
                  className="btn-val btn-secondary"
                  disabled={!joinCode.trim()}
                >
                  <LogIn size={18} />
                  <span>JOIN</span>
                </button>
              </form>
            </div>
          )}
        </motion.div>

        {/* How It Works Guide Toggle */}
        <div className="rules-toggle-wrapper">
          <button 
            className="rules-toggle-btn font-display"
            onClick={() => setShowRules(!showRules)}
          >
            <HelpCircle size={16} />
            <span>{showRules ? 'HIDE TOURNAMENT RULES' : 'VIEW TOURNAMENT RULES & STRATEGY'}</span>
          </button>

          {showRules && (
            <motion.div 
              className="rules-card glass-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rules-grid">
                <div className="rule-item">
                  <div className="rule-icon"><Coins size={20} /></div>
                  <h4 className="font-display">10,000 STARTING CREDITS</h4>
                  <p>Every player begins with 10K. Manage your economy carefully across 5 required agent slots.</p>
                </div>

                <div className="rule-item">
                  <div className="rule-icon"><Sparkles size={20} /></div>
                  <h4 className="font-display">GACHA AGENT REVEALS</h4>
                  <p>Each round reveals one random Valorant agent with their competitive tier and base bid.</p>
                </div>

                <div className="rule-item">
                  <div className="rule-icon"><Gavel size={20} /></div>
                  <h4 className="font-display">INCREMENTAL AUCTION</h4>
                  <p>Turn-based raises (+100, +250, +500) with a live 9s turn clock. High bidder wins when opponent passes.</p>
                </div>

                <div className="rule-item">
                  <div className="rule-icon"><Shield size={20} /></div>
                  <h4 className="font-display">AI COMP EVALUATION</h4>
                  <p>Once both 5-agent squads are finalized, Gemini rates site executes, map control, and synergies.</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
