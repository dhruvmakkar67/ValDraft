import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Eye, Flame, Info } from 'lucide-react';

const roleIcons = {
  Duelist: <Flame size={14} />,
  Initiator: <Eye size={14} />,
  Controller: <Zap size={14} />,
  Sentinel: <Shield size={14} />,
};

export default function AgentCard({ agent, roundNumber, isFlipping = false }) {
  const [selectedAbility, setSelectedAbility] = useState(null);

  if (!agent) {
    return (
      <div className="agent-card-placeholder glass-panel">
        <div className="placeholder-content">
          <div className="placeholder-spinner"></div>
          <p className="font-display">SUMMONING NEXT AGENT...</p>
        </div>
      </div>
    );
  }

  const role = agent.role || 'Flex';
  const tier = agent.tier || 'B';
  const primaryColor = agent.colors?.[0] ? `#${agent.colors[0]}` : '#ff4655';

  return (
    <div className="agent-card-container">
      <motion.div 
        className={`agent-card glass-panel tier-${tier.toLowerCase()}`}
        initial={{ rotateY: 90, scale: 0.85, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        exit={{ rotateY: -90, scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 120 }}
      >
        {/* Tier Glow Aura */}
        <div 
          className="card-glow-aura" 
          style={{ background: `radial-gradient(circle at 50% 30%, ${primaryColor}33, transparent 70%)` }}
        />

        {/* Card Header */}
        <div className="card-top-bar">
          <div className="round-tag font-display">
            ROUND #{roundNumber || 1}
          </div>
          <div className="tags-row">
            <span className={`badge badge-${role.toLowerCase()}`}>
              {roleIcons[role]} {role}
            </span>
            <span className={`badge badge-tier-${tier.toLowerCase()}`}>
              TIER {tier}
            </span>
          </div>
        </div>

        {/* Agent Portrait Visual */}
        <div className="portrait-wrapper">
          {agent.background && (
            <img 
              src={agent.background} 
              alt="Art Background" 
              className="portrait-bg-art"
            />
          )}
          <motion.img 
            src={agent.portrait || agent.icon} 
            alt={agent.name}
            className="agent-portrait-img"
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', damping: 15 }}
          />
        </div>

        {/* Card Details */}
        <div className="card-bottom-info">
          <div className="name-row">
            <h2 className="agent-name font-display">{agent.name}</h2>
            <div className="base-bid-chip font-display">
              <span className="chip-label">BASE BID:</span>
              <span className="chip-val">{agent.base_bid || 500} CR</span>
            </div>
          </div>

          <p className="agent-desc">{agent.description}</p>

          {/* Abilities row */}
          <div className="abilities-section">
            <span className="abilities-label font-display">SIGNATURE ABILITIES:</span>
            <div className="abilities-icons">
              {agent.abilities?.map((ab, idx) => (
                <div 
                  key={idx} 
                  className={`ability-item ${selectedAbility?.name === ab.name ? 'active' : ''}`}
                  onMouseEnter={() => setSelectedAbility(ab)}
                  onMouseLeave={() => setSelectedAbility(null)}
                >
                  {ab.icon ? (
                    <img src={ab.icon} alt={ab.name} className="ability-icon-img" />
                  ) : (
                    <div className="ability-placeholder">{ab.slot?.[0] || idx + 1}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Hover Tooltip */}
            <AnimatePresence>
              {selectedAbility && (
                <motion.div 
                  className="ability-tooltip glass-panel"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                >
                  <div className="tooltip-title font-display">{selectedAbility.name}</div>
                  <div className="tooltip-desc">{selectedAbility.description}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
