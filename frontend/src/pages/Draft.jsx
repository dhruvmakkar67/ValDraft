import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MapBanner from '../components/MapBanner';
import AgentCard from '../components/AgentCard';
import BidPanel from '../components/BidPanel';
import PlayerHUD from '../components/PlayerHUD';
import TeamRoster from '../components/TeamRoster';
import AuctionHammerOverlay from '../components/AuctionHammerOverlay';
import { Sparkles, Brain, Cpu } from 'lucide-react';

export default function Draft({
  room,
  myPlayerId,
  timerSeconds,
  lastAuctionResult,
  actionError,
  onRaiseBid,
  onPassTurn,
}) {
  if (!room) return null;

  const map = room.map;
  const players = room.players || [];
  const p1 = players[0];
  const p2 = players[1];

  const myPlayer = players.find((p) => p.id === myPlayerId) || p1;
  const opponentPlayer = players.find((p) => p.id !== myPlayerId) || p2;

  const auction = room.current_auction;
  const isMapReveal = room.status === 'map_reveal';
  const isAiAnalyzing = room.status === 'ai_analysis';

  return (
    <div className="draft-arena">
      {/* Top Map Context Banner */}
      <MapBanner map={map} />

      {/* Main Draft Grid */}
      <div className="draft-grid-layout">
        {/* Left Column: Player 1 / My Team */}
        <div className="draft-col player-col">
          <PlayerHUD 
            player={myPlayer}
            isMe={true}
            isActiveTurn={auction?.active_turn_player_id === myPlayer?.id}
            isHighBidder={auction?.high_bidder_id === myPlayer?.id}
          />
          <TeamRoster 
            roster={myPlayer?.roster}
            playerName={myPlayer?.name || 'You'}
            isMe={true}
          />
        </div>

        {/* Center Column: Gacha Agent Reveal & Live Auction Panel */}
        <div className="draft-col center-col">
          {/* Map Reveal Dramatic Intro */}
          {isMapReveal && (
            <motion.div 
              className="map-reveal-overlay glass-panel"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <span className="font-display reveal-sub">MAP SELECTED</span>
              <h2 className="font-display reveal-title">{map?.name}</h2>
              <p className="reveal-desc">{map?.description}</p>
              <div className="reveal-counter font-display">
                <span>COMMENCING FIRST AUCTION ROUND...</span>
              </div>
            </motion.div>
          )}

          {/* AI Analyzing Intermission */}
          {isAiAnalyzing && (
            <motion.div 
              className="ai-analyzing-screen glass-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="ai-scanner-pulse">
                <Brain size={48} className="brain-icon" />
              </div>
              <h2 className="ai-scan-title font-display">AI TACTICAL ANALYSIS IN PROGRESS</h2>
              <p className="ai-scan-sub">
                Scanning agent roles, ability synergies, site executions, and flank denial on {map?.name}...
              </p>
              <div className="ai-scan-bar-track">
                <motion.div 
                  className="ai-scan-bar-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3.5, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}

          {/* Active Gacha & Bidding Arena */}
          {!isMapReveal && !isAiAnalyzing && (
            <>
              <AgentCard 
                agent={auction?.agent}
                roundNumber={room.round_number}
              />

              <BidPanel 
                auction={auction}
                roomStatus={room.status}
                myPlayerId={myPlayer?.id}
                myBalance={myPlayer?.balance || 0}
                myRosterCount={myPlayer?.roster?.length || 0}
                timerSeconds={timerSeconds}
                onRaiseBid={onRaiseBid}
                onPassTurn={onPassTurn}
                errorMessage={actionError}
              />
            </>
          )}

          {/* Auction Hammer Overlay on Win/Discard */}
          <AuctionHammerOverlay result={lastAuctionResult} />
        </div>

        {/* Right Column: Opponent Team */}
        <div className="draft-col player-col">
          <PlayerHUD 
            player={opponentPlayer}
            isMe={false}
            isActiveTurn={auction?.active_turn_player_id === opponentPlayer?.id}
            isHighBidder={auction?.high_bidder_id === opponentPlayer?.id}
          />
          <TeamRoster 
            roster={opponentPlayer?.roster}
            playerName={opponentPlayer?.name || 'Opponent'}
            isMe={false}
          />
        </div>
      </div>
    </div>
  );
}
