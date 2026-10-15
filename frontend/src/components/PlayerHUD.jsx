import React from 'react';
import { motion } from 'motion/react';
import { Coins, User, Bot, Crown, Shield, Flame, Eye, Zap } from 'lucide-react';

export default function PlayerHUD({ player, isMe, isActiveTurn, isHighBidder }) {
  if (!player) return null;

  const roster = player.roster || [];
  const roles = {
    Duelist: roster.filter((a) => a.role === 'Duelist').length,
    Initiator: roster.filter((a) => a.role === 'Initiator').length,
    Controller: roster.filter((a) => a.role === 'Controller').length,
    Sentinel: roster.filter((a) => a.role === 'Sentinel').length,
  };

  return (
    <div className={`player-hud glass-panel ${isActiveTurn ? 'hud-active' : ''} ${isMe ? 'hud-me' : 'hud-opp'}`}>
      <div className="hud-top">
        <div className="player-identity">
          <div className="avatar-circle">
            {player.is_bot ? <Bot size={22} /> : <User size={22} />}
          </div>
          <div className="player-text">
            <div className="name-wrapper">
              <span className="player-title font-display">{player.name}</span>
              {isMe && <span className="me-badge font-display">YOU</span>}
              {isHighBidder && (
                <span className="leader-crown" title="Current High Bidder">
                  <Crown size={14} />
                </span>
              )}
            </div>
            <div className="roster-count font-display">
              ROSTER: {roster.length} / 5 AGENTS
            </div>
          </div>
        </div>

        {/* Balance Counter */}
        <div className="balance-pill font-display">
          <Coins size={18} className="gold-icon" />
          <div className="balance-number">
            <span className="amount">{player.balance.toLocaleString()}</span>
            <span className="unit">CR</span>
          </div>
        </div>
      </div>

      {/* Role Distribution Bar */}
      <div className="hud-role-tracker">
        <div className="role-mini-chip duelist" title="Duelists">
          <Flame size={12} />
          <span>{roles.Duelist}</span>
        </div>
        <div className="role-mini-chip initiator" title="Initiators">
          <Eye size={12} />
          <span>{roles.Initiator}</span>
        </div>
        <div className="role-mini-chip controller" title="Controllers">
          <Zap size={12} />
          <span>{roles.Controller}</span>
        </div>
        <div className="role-mini-chip sentinel" title="Sentinels">
          <Shield size={12} />
          <span>{roles.Sentinel}</span>
        </div>
      </div>
    </div>
  );
}
