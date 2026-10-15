import { ALL_AGENTS } from '../data/agents.js';
import { VALORANT_MAPS } from '../data/maps.js';

// Map synergy data for in-browser evaluation
const MAP_SYNERGY = {
  ascent: {
    top_picks: ["Sova", "Omen", "Killjoy", "Jett", "KAY/O", "Cypher"],
    notes: "Ascent mid-control and B-site lockdown favor Sova recon arrows and Killjoy/Cypher anchor setups."
  },
  bind: {
    top_picks: ["Brimstone", "Viper", "Raze", "Skye", "Fade", "Cypher"],
    notes: "Bind has no mid, favoring heavy choke smokes (Brimstone/Viper) and explosive site takes with Raze satchels."
  },
  haven: {
    top_picks: ["Omen", "Breach", "Sova", "Jett", "Killjoy", "Fade"],
    notes: "Three sites demand quick rotations, Breach concuss/flashes down long corridors, and reliable info gathering."
  },
  split: {
    top_picks: ["Raze", "Breach", "Omen", "Astra", "Cypher", "Sage"],
    notes: "Vertical ropes and narrow chokepoints make Raze nades and Breach faultlines devastating."
  },
  icebox: {
    top_picks: ["Viper", "Sova", "Killjoy", "Jett", "Sage", "Gekko"],
    notes: "Viper wall is virtually mandatory for A-site and B-long coverage; vertical angles reward Jett updrafts."
  },
  breeze: {
    top_picks: ["Viper", "Sova", "Cypher", "Jett", "KAY/O"],
    notes: "Massive sightlines require Viper's Toxic Screen and long-distance Operator pressure from Jett."
  },
  lotus: {
    top_picks: ["Omen", "Fade", "Killjoy", "Raze", "Breach", "Clove"],
    notes: "3 sites and rotating doors allow aggressive fast rotates and multi-angle pinches with Fade prowlers."
  },
  sunset: {
    top_picks: ["Cypher", "Omen", "Raze", "Breach", "Fade", "Gekko"],
    notes: "Mid courtyard fights and tight B-main corridors elevate Cypher setups and flash-heavy entry."
  },
  abyss: {
    top_picks: ["Omen", "Astra", "Jett", "Sova", "Vyse", "Tejo"],
    notes: "Hazardous drop edges reward displacement abilities, Astra gravity pull, and Jett gliding."
  },
  pearl: {
    top_picks: ["Astra", "Viper", "Fade", "Jett", "Killjoy", "Skye"],
    notes: "B-long post-plant requires long-range stall and Astra cosmic divides to safely plant/defuse."
  }
};

export class LocalGameEngine {
  constructor(eventCallback) {
    this.emitEvent = eventCallback;
    this.room = null;
    this.timerInterval = null;
    this.botTimeout = null;
  }

  createSoloRoom(playerName) {
    this.stopTimer();
    const map = VALORANT_MAPS[Math.floor(Math.random() * VALORANT_MAPS.length)];
    const shuffledAgents = [...ALL_AGENTS].sort(() => 0.5 - Math.random());

    const p1 = {
      id: 'local_player',
      name: playerName || 'RadiantPlayer',
      balance: 10000,
      roster: [],
      is_ready: true,
      is_bot: false,
    };

    const p2 = {
      id: 'bot_viper',
      name: 'Viper Bot (AI)',
      balance: 10000,
      roster: [],
      is_ready: true,
      is_bot: true,
    };

    this.room = {
      room_code: `VD${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'map_reveal',
      players: [p1, p2],
      map: map,
      undrafted_agents: shuffledAgents,
      round_number: 0,
      round_opener_index: 0,
      current_auction: null,
      ai_result: null,
    };

    this.emitEvent('room_state', this.room);
    this.emitEvent('play_sound', { sound: 'map_reveal' });

    // After 3.2s, start round 1
    setTimeout(() => {
      this.startNextRound();
    }, 3200);
  }

  startNextRound() {
    this.stopTimer();
    if (!this.room) return;

    const p1 = this.room.players[0];
    const p2 = this.room.players[1];

    if (p1.roster.length >= 5 && p2.roster.length >= 5) {
      this.triggerAiAnalysis();
      return;
    }

    this.checkAutoFillIfNeeded();
    if (p1.roster.length >= 5 && p2.roster.length >= 5) {
      this.triggerAiAnalysis();
      return;
    }

    if (!this.room.undrafted_agents.length) {
      this.forceFillRemaining();
      this.triggerAiAnalysis();
      return;
    }

    const agent = this.room.undrafted_agents.shift();
    this.room.round_number += 1;

    let openerIdx = this.room.round_opener_index % 2;
    this.room.round_opener_index += 1;

    if (this.room.players[openerIdx].roster.length >= 5) {
      openerIdx = 1 - openerIdx;
    }

    const activePlayer = this.room.players[openerIdx];

    this.room.current_auction = {
      agent,
      current_high_bid: 0,
      min_open_bid: Math.min(agent.base_bid || 500, 500),
      high_bidder_id: null,
      high_bidder_name: null,
      active_turn_player_id: activePlayer.id,
      active_turn_player_name: activePlayer.name,
      turn_seconds_remaining: 10,
      round_number: this.room.round_number,
      status: 'bidding',
      consecutive_passes: 0,
      bid_history: [],
    };
    this.room.status = 'bidding';

    this.emitEvent('room_state', this.room);
    this.emitEvent('play_sound', { sound: 'card_reveal' });

    this.startTurnTimer();
    this.checkBotTurn();
  }

  startTurnTimer() {
    this.stopTimer();
    let seconds = 10;
    if (this.room?.current_auction) {
      this.room.current_auction.turn_seconds_remaining = seconds;
    }

    this.timerInterval = setInterval(() => {
      if (!this.room || this.room.status !== 'bidding') {
        this.stopTimer();
        return;
      }

      this.emitEvent('timer_tick', {
        seconds,
        active_turn_player_id: this.room.current_auction?.active_turn_player_id,
      });

      if (seconds <= 0) {
        this.stopTimer();
        this.handlePass(this.room.current_auction?.active_turn_player_id);
      } else {
        seconds -= 1;
        if (this.room.current_auction) {
          this.room.current_auction.turn_seconds_remaining = seconds;
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.botTimeout) {
      clearTimeout(this.botTimeout);
      this.botTimeout = null;
    }
  }

  checkBotTurn() {
    if (!this.room || this.room.status !== 'bidding') return;
    const auction = this.room.current_auction;
    if (!auction || auction.status !== 'bidding') return;

    if (auction.active_turn_player_id === 'bot_viper') {
      this.botTimeout = setTimeout(() => {
        this.executeBotMove();
      }, 1200);
    }
  }

  executeBotMove() {
    if (!this.room || this.room.status !== 'bidding') return;
    const auction = this.room.current_auction;
    if (!auction || auction.active_turn_player_id !== 'bot_viper') return;

    const bot = this.room.players[1];
    const agent = auction.agent;
    const botRoles = bot.roster.map(a => a.role);
    const roleCount = botRoles.filter(r => r === agent.role).length;

    let valuation = agent.base_bid || 900;
    if (roleCount === 0) valuation += 350;
    if (agent.tier === 'S') valuation += 300;

    const slotsNeeded = 5 - bot.roster.length;
    const maxSafe = bot.balance - ((slotsNeeded - 1) * 300);
    valuation = Math.min(valuation, maxSafe);

    const minReq = auction.current_high_bid > 0 ? auction.current_high_bid + 100 : auction.min_open_bid;

    if (minReq <= valuation && minReq <= bot.balance) {
      let step = 100;
      if (valuation - minReq >= 300 && Math.random() < 0.35) step = 250;
      const bidAmount = Math.min(minReq + (step - 100), bot.balance);
      this.handleRaise('bot_viper', bidAmount);
    } else {
      this.handlePass('bot_viper');
    }
  }

  handleRaise(playerId, amount) {
    if (!this.room || this.room.status !== 'bidding') return;
    const auction = this.room.current_auction;
    if (!auction || auction.active_turn_player_id !== playerId) return;

    const player = this.room.players.find(p => p.id === playerId);
    const opponent = this.room.players.find(p => p.id !== playerId);

    if (amount > player.balance) return;

    auction.current_high_bid = amount;
    auction.high_bidder_id = player.id;
    auction.high_bidder_name = player.name;
    auction.consecutive_passes = 0;
    auction.turn_seconds_remaining = 10;
    auction.bid_history.push({
      player_id: player.id,
      player_name: player.name,
      action: 'raise',
      amount,
    });

    if (opponent.roster.length < 5 && opponent.balance > amount) {
      auction.active_turn_player_id = opponent.id;
      auction.active_turn_player_name = opponent.name;
      this.emitEvent('room_state', this.room);
      this.emitEvent('play_sound', { sound: 'bid_raise' });
      this.startTurnTimer();
      this.checkBotTurn();
    } else {
      this.resolveWin(player, amount);
    }
  }

  handlePass(playerId) {
    if (!this.room || this.room.status !== 'bidding') return;
    const auction = this.room.current_auction;
    if (!auction || auction.active_turn_player_id !== playerId) return;

    const opponent = this.room.players.find(p => p.id !== playerId);
    auction.consecutive_passes += 1;

    if (auction.high_bidder_id && auction.high_bidder_id === opponent.id) {
      this.resolveWin(opponent, auction.current_high_bid);
      return;
    }

    if (auction.current_high_bid === 0) {
      if (auction.consecutive_passes >= 2) {
        this.resolveDiscard();
      } else {
        if (opponent.roster.length < 5 && opponent.balance >= auction.min_open_bid) {
          auction.active_turn_player_id = opponent.id;
          auction.active_turn_player_name = opponent.name;
          auction.turn_seconds_remaining = 10;
          this.emitEvent('room_state', this.room);
          this.emitEvent('play_sound', { sound: 'pass' });
          this.startTurnTimer();
          this.checkBotTurn();
        } else {
          this.resolveDiscard();
        }
      }
      return;
    }

    if (auction.high_bidder_id) {
      const winner = this.room.players.find(p => p.id === auction.high_bidder_id);
      this.resolveWin(winner, auction.current_high_bid);
    } else {
      this.resolveDiscard();
    }
  }

  resolveWin(winner, finalPrice) {
    this.stopTimer();
    const auction = this.room.current_auction;
    const agent = auction.agent;

    winner.balance = Math.max(0, winner.balance - finalPrice);
    winner.roster.push(agent);

    auction.status = 'won';
    auction.winner_id = winner.id;
    auction.winner_name = winner.name;
    auction.final_price = finalPrice;
    this.room.status = 'bid_resolve';

    this.checkAutoFillIfNeeded();

    const gameOver = this.room.players[0].roster.length >= 5 && this.room.players[1].roster.length >= 5;
    const result = {
      action: 'win',
      winner_id: winner.id,
      winner_name: winner.name,
      agent,
      final_price: finalPrice,
      players: this.room.players,
      game_over: gameOver,
    };

    this.emitEvent('auction_resolved', result);
    this.emitEvent('room_state', this.room);
    this.emitEvent('play_sound', { sound: 'hammer_sold' });

    setTimeout(() => {
      if (gameOver) {
        this.triggerAiAnalysis();
      } else {
        this.startNextRound();
      }
    }, 2800);
  }

  resolveDiscard() {
    this.stopTimer();
    const auction = this.room.current_auction;
    const agent = auction.agent;
    auction.status = 'discarded';
    this.room.status = 'bid_resolve';

    this.checkAutoFillIfNeeded();

    const gameOver = this.room.players[0].roster.length >= 5 && this.room.players[1].roster.length >= 5;
    const result = {
      action: 'discard',
      agent,
      players: this.room.players,
      game_over: gameOver,
    };

    this.emitEvent('auction_resolved', result);
    this.emitEvent('room_state', this.room);
    this.emitEvent('play_sound', { sound: 'discard' });

    setTimeout(() => {
      if (gameOver) {
        this.triggerAiAnalysis();
      } else {
        this.startNextRound();
      }
    }, 2800);
  }

  checkAutoFillIfNeeded() {
    for (const p of this.room.players) {
      if (p.roster.length < 5 && p.balance < 500) {
        while (p.roster.length < 5 && this.room.undrafted_agents.length) {
          p.roster.push(this.room.undrafted_agents.shift());
        }
      }
    }
  }

  forceFillRemaining() {
    const remaining = [...ALL_AGENTS].sort(() => 0.5 - Math.random());
    for (const p of this.room.players) {
      const existing = new Set(p.roster.map(a => a.id));
      while (p.roster.length < 5) {
        const next = remaining.find(a => !existing.has(a.id));
        if (next) {
          p.roster.push(next);
          existing.add(next.id);
        } else {
          break;
        }
      }
    }
  }

  triggerAiAnalysis() {
    this.stopTimer();
    this.room.status = 'ai_analysis';
    this.emitEvent('room_state', this.room);
    this.emitEvent('play_sound', { sound: 'analyzing' });

    setTimeout(() => {
      const result = this.evaluateComps();
      this.room.ai_result = result;
      this.room.status = 'results';
      this.emitEvent('room_state', this.room);
      this.emitEvent('game_result', result);
      this.emitEvent('play_sound', { sound: 'victory' });
    }, 2500);
  }

  evaluateComps() {
    const p1 = this.room.players[0];
    const p2 = this.room.players[1];
    const map = this.room.map;

    const evalTeam = (teamAgents) => {
      const roles = {};
      teamAgents.forEach(a => {
        roles[a.role] = (roles[a.role] || 0) + 1;
      });

      const numC = roles.Controller || 0;
      const numI = roles.Initiator || 0;
      const numD = roles.Duelist || 0;
      const numS = roles.Sentinel || 0;

      let siteExec = 55 + (numD * 9) + (numI * 8);
      let infoGather = 45 + (numI * 18) + (numS * 6);
      let mapControl = 35 + (numC * 22) + (numS * 10);
      let flexibility = 50 + (Object.keys(roles).length * 10);
      let synergy = 58;

      const strengths = [];
      const weaknesses = [];
      const combos = [];

      if (numC === 0) {
        mapControl -= 25;
        weaknesses.push("Zero Controller smokes: Executing onto sites will face severe sniper crossfires.");
      } else {
        strengths.push(`Solid vision denial with ${numC} Controller(s) for execute cover.`);
      }

      if (numI === 0) {
        infoGather -= 25;
        weaknesses.push("Lack of dedicated Initiator recon: Corners must be dry face-checked.");
      } else {
        strengths.push(`Reliable reconnaissance & flashes with ${numI} Initiator(s).`);
      }

      if (numS === 0) {
        weaknesses.push("No Sentinel flank traps: Vulnerable to aggressive enemy lurkers.");
      } else {
        strengths.push(`Flank protection and site lockdown guaranteed with ${numS} Sentinel(s).`);
      }

      const names = teamAgents.map(a => a.name);
      if (names.includes("Sova") && names.includes("Raze")) {
        combos.push("Sova Recon Dart + Raze Paint Shells grenade trap combo");
      }
      if (names.includes("Breach") && names.includes("Jett")) {
        combos.push("Breach Fault Line stun + Jett Tailwind entry dash");
      }
      if (!combos.length) {
        combos.push("Synchronized crossfire and utility-dump site take");
      }

      siteExec = Math.max(25, Math.min(97, siteExec));
      infoGather = Math.max(25, Math.min(97, infoGather));
      mapControl = Math.max(25, Math.min(97, mapControl));
      flexibility = Math.max(25, Math.min(97, flexibility));
      synergy = Math.max(25, Math.min(97, synergy));

      const total = Math.round((siteExec * 0.22) + (infoGather * 0.22) + (mapControl * 0.22) + (flexibility * 0.16) + (synergy * 0.18));

      return {
        scores: {
          site_execution: siteExec,
          information_gathering: infoGather,
          map_control: mapControl,
          flexibility: flexibility,
          synergy: synergy,
          total_score: total,
        },
        strengths,
        weaknesses: weaknesses.length ? weaknesses : ["Minor vulnerability to coordinated utility counters."],
        key_combos: combos,
        role_breakdown: roles,
      };
    };

    const t1Eval = evalTeam(p1.roster);
    const t2Eval = evalTeam(p2.roster);

    const s1 = t1Eval.scores.total_score;
    const s2 = t2Eval.scores.total_score;
    const diff = Math.abs(s1 - s2);
    const winProb = Math.min(88, 52 + Math.round(diff * 1.2));

    const isT1Win = s1 >= s2;
    const winnerId = isT1Win ? p1.id : p2.id;
    const winnerName = isT1Win ? p1.name : p2.name;

    const summary = `${winnerName} edges out the draft with a higher overall composition efficiency (${Math.max(s1, s2)} vs ${Math.min(s1, s2)}) on ${map.name}. Their superior role dispersion provides stronger site anchoring and post-plant utility.`;

    return {
      team1: {
        player_id: p1.id,
        player_name: p1.name,
        scores: t1Eval.scores,
        strengths: t1Eval.strengths,
        weaknesses: t1Eval.weaknesses,
        key_combos: t1Eval.key_combos,
        role_breakdown: t1Eval.role_breakdown,
      },
      team2: {
        player_id: p2.id,
        player_name: p2.name,
        scores: t2Eval.scores,
        strengths: t2Eval.strengths,
        weaknesses: t2Eval.weaknesses,
        key_combos: t2Eval.key_combos,
        role_breakdown: t2Eval.role_breakdown,
      },
      verdict: `${winnerName} claims victory on ${map.name}!`,
      winner_id: winnerId,
      winner_name: winnerName,
      win_probability: winProb,
      tactical_summary: summary,
      map_context: map.description,
    };
  }

  resetForRematch() {
    this.createSoloRoom(this.room?.players[0]?.name || 'RadiantPlayer');
  }
}
