import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gavel, Clock, ArrowUpRight, Ban, Coins, AlertCircle } from 'lucide-react';

export default function BidPanel({
  auction,
  roomStatus,
  myPlayerId,
  myBalance,
  myRosterCount,
  onRaiseBid,
  onPassTurn,
  timerSeconds,
  errorMessage,
}) {
  const isAuctionActive = roomStatus === 'bidding' && auction?.status === 'bidding';
  const isMyTurn = isAuctionActive && auction?.active_turn_player_id === myPlayerId;
  const currentHighBid = auction?.current_high_bid || 0;
  const minRequired = currentHighBid > 0 
    ? currentHighBid + 100 
    : (auction?.min_open_bid || 500);

  const [bidInput, setBidInput] = useState(minRequired);

  // Sync input when high bid updates
  useEffect(() => {
    setBidInput(minRequired);
  }, [minRequired]);

  const handleQuickAdd = (delta) => {
    setBidInput((prev) => Math.min(myBalance, Math.max(minRequired, prev + delta)));
  };

  const handleAllIn = () => {
    setBidInput(myBalance);
  };

  const handleRaiseSubmit = (e) => {
    e?.preventDefault();
    if (!isMyTurn || !isAuctionActive) return;
    onRaiseBid(Number(bidInput));
  };

  const isRosterFull = myRosterCount >= 5;
  const canAffordMin = myBalance >= minRequired;
  const canAct = isMyTurn && !isRosterFull && canAffordMin && isAuctionActive;

  const secondsLeft = timerSeconds !== undefined ? timerSeconds : (auction?.turn_seconds_remaining || 0);
  const isUrgent = isAuctionActive && secondsLeft <= 3;

  return (
    <div className={`bid-panel glass-panel ${isMyTurn ? 'panel-active-turn' : ''}`}>
      {/* Top Turn & High Bid Status Banner */}
      <div className="bid-status-header">
        <div className="turn-indicator">
          {!isAuctionActive ? (
            <div className="turn-pill opponent-turn font-display">
              <div className="status-dot amber"></div>
              <span>AUCTION RESOLVING...</span>
            </div>
          ) : isMyTurn ? (
            <motion.div 
              className="turn-pill my-turn font-display"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              <div className="status-dot green"></div>
              <span>YOUR TURN TO BID</span>
            </motion.div>
          ) : (
            <div className="turn-pill opponent-turn font-display">
              <div className="status-dot red"></div>
              <span>WAITING FOR {auction?.active_turn_player_name || 'OPPONENT'}...</span>
            </div>
          )}
        </div>

        {/* Turn Countdown Ring */}
        <div className={`turn-timer font-display ${isUrgent ? 'timer-urgent' : ''}`}>
          <Clock size={16} />
          <span>00:{String(Math.max(0, secondsLeft)).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Current Auction State */}
      <div className="auction-stats-box">
        <div className="stat-col">
          <span className="stat-label font-display">CURRENT HIGH BID</span>
          <div className="stat-value font-display">
            <Coins size={20} className="coin-icon" />
            <span>{currentHighBid > 0 ? `${currentHighBid.toLocaleString()} CR` : 'NONE'}</span>
          </div>
        </div>

        <div className="stat-divider" />

        <div className="stat-col">
          <span className="stat-label font-display">HIGH BIDDER</span>
          <div className="stat-value font-display leader-name">
            {auction?.high_bidder_name ? (
              auction.high_bidder_id === myPlayerId ? '⭐ YOU' : auction.high_bidder_name
            ) : (
              'UNCONTESTED'
            )}
          </div>
        </div>
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <motion.div 
          className="bid-error-alert font-display"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* Roster Full / Out of Balance warnings */}
      {isRosterFull ? (
        <div className="special-notice-box font-display">
          <span>YOUR ROSTER IS FULL (5/5 AGENTS DRAFTED)</span>
        </div>
      ) : !canAffordMin && isMyTurn ? (
        <div className="special-notice-box warning font-display">
          <span>INSUFFICIENT CREDITS ({myBalance} CR). YOU MUST PASS. RANDOM AGENTS WILL BE ASSIGNED FOR FREE.</span>
        </div>
      ) : null}

      {/* Bid Actions Form */}
      <form onSubmit={handleRaiseSubmit} className="bid-controls-form">
        {/* Quick Bid Increment Buttons */}
        <div className="quick-bid-row">
          <button 
            type="button" 
            className="quick-btn font-display"
            onClick={() => handleQuickAdd(100)}
            disabled={!canAct || bidInput + 100 > myBalance}
          >
            +100
          </button>
          <button 
            type="button" 
            className="quick-btn font-display"
            onClick={() => handleQuickAdd(250)}
            disabled={!canAct || bidInput + 250 > myBalance}
          >
            +250
          </button>
          <button 
            type="button" 
            className="quick-btn font-display"
            onClick={() => handleQuickAdd(500)}
            disabled={!canAct || bidInput + 500 > myBalance}
          >
            +500
          </button>
          <button 
            type="button" 
            className="quick-btn all-in font-display"
            onClick={handleAllIn}
            disabled={!canAct || myBalance < minRequired}
          >
            ALL IN ({myBalance})
          </button>
        </div>

        {/* Input & Action Buttons */}
        <div className="bid-input-row">
          <div className="bid-input-wrapper">
            <span className="input-currency font-display">CR</span>
            <input 
              type="number"
              min={minRequired}
              max={myBalance}
              step={50}
              value={bidInput}
              onChange={(e) => setBidInput(Number(e.target.value))}
              disabled={!canAct}
              className="bid-number-input font-display"
            />
          </div>

          <button 
            type="submit"
            className="btn-val btn-raise"
            disabled={!canAct || bidInput < minRequired || bidInput > myBalance}
          >
            <Gavel size={18} />
            <span>RAISE BID</span>
          </button>

          <button 
            type="button"
            className="btn-val btn-pass"
            onClick={onPassTurn}
            disabled={!isMyTurn || !isAuctionActive}
          >
            <Ban size={18} />
            <span>PASS</span>
          </button>
        </div>
      </form>
    </div>
  );
}
