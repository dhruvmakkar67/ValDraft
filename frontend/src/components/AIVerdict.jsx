import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, AlertTriangle, CheckCircle, Flame, Shield, ArrowRight, RotateCcw, Home } from 'lucide-react';

export default function AIVerdict({ result, map, myPlayerId, onRematch, onNewGame }) {
  useEffect(() => {
    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF4655', '#00F0FF', '#F3B23A', '#00E599']
    });
  }, []);

  if (!result) return null;

  const t1 = result.team1;
  const t2 = result.team2;
  const isWinnerT1 = result.winner_id === t1.player_id;
  const isMeWinner = result.winner_id === myPlayerId;

  const renderScoreBar = (label, val1, val2) => (
    <div className="verdict-metric-row">
      <div className="metric-score-col left font-display">{val1}</div>
      <div className="metric-center">
        <span className="metric-label font-display">{label}</span>
        <div className="metric-bar-track">
          <div 
            className="metric-bar-fill left" 
            style={{ width: `${(val1 / (val1 + val2)) * 100}%` }}
          />
          <div 
            className="metric-bar-fill right" 
            style={{ width: `${(val2 / (val1 + val2)) * 100}%` }}
          />
        </div>
      </div>
      <div className="metric-score-col right font-display">{val2}</div>
    </div>
  );

  return (
    <div className="ai-verdict-screen">
      {/* Cinematic Map Header */}
      <div 
        className="verdict-hero-bg" 
        style={{ backgroundImage: `url(${map?.splash})` }}
      />
      <div className="verdict-hero-gradient" />

      <div className="verdict-container">
        {/* Top Trophy Banner */}
        <motion.div 
          className="verdict-headline glass-panel"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 14 }}
        >
          <div className="trophy-badge">
            <Trophy size={28} className="trophy-icon" />
          </div>

          <div className="headline-text">
            <div className="winner-tag font-display">VCT SIMULATION VERDICT</div>
            <h1 className="verdict-title font-display">
              {result.verdict}
            </h1>
            <div className="prob-pill font-display">
              <Sparkles size={14} />
              <span>{result.win_probability}% PROJECTED WIN PROBABILITY</span>
            </div>
          </div>
        </motion.div>

        {/* Narrative Broadcast Summary */}
        <motion.div 
          className="verdict-narrative-card glass-panel"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="narrative-badge font-display">
            <span className="gemini-sparkle">✦</span>
            <span>AI TACTICAL ANALYSIS // {map?.name?.toUpperCase()} META</span>
          </div>
          <p className="narrative-text">"{result.tactical_summary}"</p>
        </motion.div>

        {/* Tactical Head-to-Head Comparison */}
        <div className="h2h-teams-grid">
          {/* Team 1 Card */}
          <motion.div 
            className={`team-eval-card glass-panel ${isWinnerT1 ? 'card-winner' : 'card-loser'}`}
            initial={{ x: -25, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="team-eval-header">
              <div>
                <span className="font-display sub-tag">TEAM 01</span>
                <h3 className="team-eval-name font-display">{t1.player_name}</h3>
              </div>
              <div className="total-score-badge font-display">
                <span className="score-val">{t1.scores.total_score}</span>
                <span className="score-lbl">OVR</span>
              </div>
            </div>

            <div className="eval-section">
              <h4 className="eval-heading font-display">KEY STRENGTHS</h4>
              <ul className="eval-list">
                {t1.strengths.map((s, idx) => (
                  <li key={idx} className="strength-item">
                    <CheckCircle size={14} className="green-icon" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="eval-section">
              <h4 className="eval-heading font-display">VULNERABILITIES</h4>
              <ul className="eval-list">
                {t1.weaknesses.map((w, idx) => (
                  <li key={idx} className="weakness-item">
                    <AlertTriangle size={14} className="red-icon" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {t1.key_combos?.length > 0 && (
              <div className="eval-section">
                <h4 className="eval-heading font-display">SYNERGY COMBO</h4>
                <div className="combo-chip font-display">
                  <Flame size={14} />
                  <span>{t1.key_combos[0]}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Central Comparison Metrics */}
          <motion.div 
            className="metrics-center-panel glass-panel"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="center-heading font-display">TACTICAL BREAKDOWN</h3>

            <div className="metric-bars-stack">
              {renderScoreBar('Site Execution', t1.scores.site_execution, t2.scores.site_execution)}
              {renderScoreBar('Info Gathering', t1.scores.information_gathering, t2.scores.information_gathering)}
              {renderScoreBar('Map Control', t1.scores.map_control, t2.scores.map_control)}
              {renderScoreBar('Flexibility', t1.scores.flexibility, t2.scores.flexibility)}
              {renderScoreBar('Team Synergy', t1.scores.synergy, t2.scores.synergy)}
            </div>
          </motion.div>

          {/* Team 2 Card */}
          <motion.div 
            className={`team-eval-card glass-panel ${!isWinnerT1 ? 'card-winner' : 'card-loser'}`}
            initial={{ x: 25, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="team-eval-header">
              <div>
                <span className="font-display sub-tag">TEAM 02</span>
                <h3 className="team-eval-name font-display">{t2.player_name}</h3>
              </div>
              <div className="total-score-badge font-display">
                <span className="score-val">{t2.scores.total_score}</span>
                <span className="score-lbl">OVR</span>
              </div>
            </div>

            <div className="eval-section">
              <h4 className="eval-heading font-display">KEY STRENGTHS</h4>
              <ul className="eval-list">
                {t2.strengths.map((s, idx) => (
                  <li key={idx} className="strength-item">
                    <CheckCircle size={14} className="green-icon" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="eval-section">
              <h4 className="eval-heading font-display">VULNERABILITIES</h4>
              <ul className="eval-list">
                {t2.weaknesses.map((w, idx) => (
                  <li key={idx} className="weakness-item">
                    <AlertTriangle size={14} className="red-icon" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {t2.key_combos?.length > 0 && (
              <div className="eval-section">
                <h4 className="eval-heading font-display">SYNERGY COMBO</h4>
                <div className="combo-chip font-display">
                  <Flame size={14} />
                  <span>{t2.key_combos[0]}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Action Controls */}
        <div className="verdict-actions-row">
          <button className="btn-val btn-cyan" onClick={onRematch}>
            <RotateCcw size={18} />
            <span>PLAY REMATCH (NEW MAP)</span>
          </button>
          <button className="btn-val btn-secondary" onClick={onNewGame}>
            <Home size={18} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
}
