import React from 'react';
import { motion } from 'motion/react';
import { Plus, Flame, Eye, Zap, Shield } from 'lucide-react';

const roleIcons = {
  Duelist: <Flame size={12} />,
  Initiator: <Eye size={12} />,
  Controller: <Zap size={12} />,
  Sentinel: <Shield size={12} />,
};

export default function TeamRoster({ roster = [], playerName, isMe }) {
  const slots = [0, 1, 2, 3, 4];

  return (
    <div className="team-roster-container">
      <div className="roster-header font-display">
        <span>{playerName}'S COMPOSITION</span>
        <span className="roster-counter">{roster.length}/5</span>
      </div>

      <div className="roster-slots-grid">
        {slots.map((idx) => {
          const agent = roster[idx];
          if (!agent) {
            return (
              <div key={idx} className="roster-slot empty-slot glass-panel">
                <div className="slot-empty-content">
                  <div className="slot-num font-display">SLOT 0{idx + 1}</div>
                  <Plus size={16} className="empty-plus" />
                </div>
              </div>
            );
          }

          const role = agent.role || 'Flex';
          const tier = agent.tier || 'B';

          return (
            <motion.div
              key={agent.id || idx}
              className={`roster-slot filled-slot glass-panel tier-${tier.toLowerCase()}`}
              initial={{ scale: 0.7, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 150 }}
            >
              <img
                src={agent.portrait || agent.icon}
                alt={agent.name}
                className="roster-slot-img"
              />
              <div className="slot-gradient-overlay" />
              
              <div className="slot-info-overlay">
                <div className="slot-badges">
                  <span className={`mini-badge badge-${role.toLowerCase()}`}>
                    {roleIcons[role]}
                  </span>
                  <span className={`mini-badge badge-tier-${tier.toLowerCase()}`}>
                    {tier}
                  </span>
                </div>
                <div className="slot-name font-display">{agent.name}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
