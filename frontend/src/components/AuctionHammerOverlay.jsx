import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gavel, CheckCircle2, XCircle } from 'lucide-react';

export default function AuctionHammerOverlay({ result }) {
  if (!result) return null;

  const isWin = result.action === 'win';
  const isDiscard = result.action === 'discard';

  return (
    <AnimatePresence>
      <div className="hammer-overlay-container">
        <motion.div 
          className={`hammer-modal glass-panel ${isWin ? 'hammer-win' : 'hammer-discard'}`}
          initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        >
          <div className="hammer-icon-circle">
            {isWin ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
          </div>

          <div className="hammer-title font-display">
            {isWin ? 'AUCTION WON // HAMMER DOWN!' : 'AGENT DISCARDED'}
          </div>

          {isWin && (
            <div className="hammer-details">
              <span className="winner-highlight font-display">
                {result.winner_name}
              </span>
              <span className="action-text"> secured </span>
              <span className="agent-highlight font-display">
                {result.agent?.name}
              </span>
              <span className="price-tag font-display">
                for {result.final_price?.toLocaleString()} CR
              </span>
            </div>
          )}

          {isDiscard && (
            <div className="hammer-details">
              <span className="discard-text">
                Both players passed on <strong>{result.agent?.name}</strong>. Returning to pool.
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
