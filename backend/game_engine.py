import random
import time
import asyncio
from typing import Dict, Any, List, Optional
from data.agents import ALL_AGENTS
from data.maps import get_random_map
from ai_service import evaluate_matchup

class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, Any]] = {}

    def create_room(self, host_name: str, host_sid: str, vs_bot: bool = False) -> Dict[str, Any]:
        room_code = f"VD{random.randint(1000, 9999)}"
        host_player = {
            "id": host_sid,
            "name": host_name,
            "balance": 10000,
            "roster": [],
            "is_ready": False,
            "is_bot": False,
            "has_passed_current_turn": False
        }
        
        players = [host_player]
        if vs_bot:
            bot_player = {
                "id": "bot_viper",
                "name": "Viper Bot (AI)",
                "balance": 10000,
                "roster": [],
                "is_ready": True,
                "is_bot": True,
                "has_passed_current_turn": False
            }
            players.append(bot_player)
            host_player["is_ready"] = True  # Auto ready in solo mode

        room = {
            "room_code": room_code,
            "status": "lobby",
            "players": players,
            "map": None,
            "undrafted_agents": [dict(a) for a in ALL_AGENTS],
            "round_number": 0,
            "round_opener_index": 0,
            "current_auction": None,
            "timer_task": None,
            "ai_result": None,
            "created_at": time.time()
        }
        random.shuffle(room["undrafted_agents"])
        self.rooms[room_code] = room
        return room

    def join_room(self, room_code: str, player_name: str, player_sid: str) -> Optional[Dict[str, Any]]:
        room = self.rooms.get(room_code)
        if not room:
            return None
        if len(room["players"]) >= 2:
            return None
            
        player = {
            "id": player_sid,
            "name": player_name,
            "balance": 10000,
            "roster": [],
            "is_ready": False,
            "is_bot": False,
            "has_passed_current_turn": False
        }
        room["players"].append(player)
        return room

    def set_player_ready(self, room_code: str, player_sid: str) -> Optional[Dict[str, Any]]:
        room = self.rooms.get(room_code)
        if not room:
            return None
            
        for p in room["players"]:
            if p["id"] == player_sid:
                p["is_ready"] = True
                break
                
        # If 2 players and both ready, can start!
        if len(room["players"]) == 2 and all(p["is_ready"] for p in room["players"]):
            room["map"] = get_random_map()
            room["status"] = "map_reveal"
            
        return room

    def start_next_auction(self, room_code: str) -> Optional[Dict[str, Any]]:
        room = self.rooms.get(room_code)
        if not room:
            return None
            
        # Check if both players already have 5 agents
        p1 = room["players"][0]
        p2 = room["players"][1]
        
        if len(p1["roster"]) >= 5 and len(p2["roster"]) >= 5:
            room["status"] = "ai_analysis"
            return room
            
        # Check if one player has 5 and the other can't afford any more or pool is low
        self._check_and_auto_fill_if_needed(room)
        if len(p1["roster"]) >= 5 and len(p2["roster"]) >= 5:
            room["status"] = "ai_analysis"
            return room

        if not room["undrafted_agents"]:
            self._force_fill_remaining(room)
            room["status"] = "ai_analysis"
            return room

        # Pick next random agent
        agent = room["undrafted_agents"].pop(0)
        room["round_number"] += 1
        
        # Decide who opens the bidding
        opener_idx = room["round_opener_index"] % 2
        room["round_opener_index"] += 1
        
        # If opener already has 5 agents, the other player opens
        if len(room["players"][opener_idx]["roster"]) >= 5:
            opener_idx = 1 - opener_idx
            
        active_player = room["players"][opener_idx]
        
        # Reset passes
        for p in room["players"]:
            p["has_passed_current_turn"] = False

        room["current_auction"] = {
            "agent": agent,
            "current_high_bid": 0,
            "min_open_bid": min(agent.get("base_bid", 500), 500),
            "high_bidder_id": None,
            "high_bidder_name": None,
            "active_turn_player_id": active_player["id"],
            "active_turn_player_name": active_player["name"],
            "turn_seconds_remaining": 10,
            "round_number": room["round_number"],
            "status": "bidding",
            "consecutive_passes": 0,
            "bid_history": []
        }
        room["status"] = "bidding"
        return room

    def process_raise_bid(self, room_code: str, player_sid: str, bid_amount: int) -> Dict[str, Any]:
        """Handles an incremental raise action."""
        room = self.rooms.get(room_code)
        if not room or room["status"] != "bidding":
            return {"error": "Auction not active"}
            
        auction = room["current_auction"]
        if not auction or auction["status"] != "bidding":
            return {"error": "Auction not active"}

        if auction["active_turn_player_id"] != player_sid:
            return {"error": "Not your turn to bid"}

        player = next((p for p in room["players"] if p["id"] == player_sid), None)
        opponent = next((p for p in room["players"] if p["id"] != player_sid), None)
        if not player or not opponent:
            return {"error": "Player not found"}

        if len(player["roster"]) >= 5:
            return {"error": "Your roster is already full (5 agents)"}

        # Check balance
        if bid_amount > player["balance"]:
            return {"error": f"Insufficient balance. You have {player['balance']} credits"}

        # Validate minimum bid
        min_required = auction["current_high_bid"] + 100 if auction["current_high_bid"] > 0 else auction["min_open_bid"]
        if bid_amount < min_required:
            return {"error": f"Minimum bid is {min_required} credits"}

        # Accept the raise!
        auction["current_high_bid"] = bid_amount
        auction["high_bidder_id"] = player["id"]
        auction["high_bidder_name"] = player["name"]
        auction["consecutive_passes"] = 0
        auction["turn_seconds_remaining"] = 9
        auction["bid_history"].append({
            "player_id": player["id"],
            "player_name": player["name"],
            "action": "raise",
            "amount": bid_amount,
            "timestamp": time.time()
        })

        # Switch turn to opponent if opponent has space and credits
        if len(opponent["roster"]) < 5 and opponent["balance"] > bid_amount:
            auction["active_turn_player_id"] = opponent["id"]
            auction["active_turn_player_name"] = opponent["name"]
            return {"success": True, "action": "raise", "auction": auction, "next_turn": opponent["id"]}
        else:
            # Opponent cannot counter (either full roster or insufficient credits) -> High bidder wins!
            return self._resolve_auction_win(room, player, auction["current_high_bid"])

    def process_pass_turn(self, room_code: str, player_sid: str) -> Dict[str, Any]:
        """Handles a pass action in the incremental auction."""
        room = self.rooms.get(room_code)
        if not room or room["status"] != "bidding":
            return {"error": "Auction not active"}
            
        auction = room["current_auction"]
        if not auction or auction["status"] != "bidding":
            return {"error": "Auction not active"}

        if auction["active_turn_player_id"] != player_sid:
            return {"error": "Not your turn"}

        player = next((p for p in room["players"] if p["id"] == player_sid), None)
        opponent = next((p for p in room["players"] if p["id"] != player_sid), None)
        if not player or not opponent:
            return {"error": "Player not found"}

        auction["bid_history"].append({
            "player_id": player["id"],
            "player_name": player["name"],
            "action": "pass",
            "timestamp": time.time()
        })
        auction["consecutive_passes"] += 1

        # Case 1: Opponent already had a bid, and current player passes -> Opponent WINS!
        if auction["high_bidder_id"] and auction["high_bidder_id"] == opponent["id"]:
            return self._resolve_auction_win(room, opponent, auction["current_high_bid"])

        # Case 2: Neither player has bid yet
        if auction["current_high_bid"] == 0:
            if auction["consecutive_passes"] >= 2:
                # Both passed without bidding -> Agent discarded
                return self._resolve_auction_discard(room)
            else:
                # Switch turn to opponent so they get a chance to open or pass
                if len(opponent["roster"]) < 5 and opponent["balance"] >= auction["min_open_bid"]:
                    auction["active_turn_player_id"] = opponent["id"]
                    auction["active_turn_player_name"] = opponent["name"]
                    auction["turn_seconds_remaining"] = 9
                    return {"success": True, "action": "pass", "auction": auction, "next_turn": opponent["id"]}
                else:
                    # Opponent cannot open -> discard
                    return self._resolve_auction_discard(room)

        # Fallback win
        if auction["high_bidder_id"]:
            winner = next((p for p in room["players"] if p["id"] == auction["high_bidder_id"]), None)
            if winner:
                return self._resolve_auction_win(room, winner, auction["current_high_bid"])

        return self._resolve_auction_discard(room)

    def _resolve_auction_win(self, room: Dict[str, Any], winner: Dict[str, Any], final_price: int) -> Dict[str, Any]:
        auction = room["current_auction"]
        agent = auction["agent"]
        
        # Deduct balance
        winner["balance"] = max(0, winner["balance"] - final_price)
        winner["roster"].append(agent)
        
        auction["status"] = "won"
        auction["winner_id"] = winner["id"]
        auction["winner_name"] = winner["name"]
        auction["final_price"] = final_price
        room["status"] = "bid_resolve"
        
        # Check auto fill conditions
        self._check_and_auto_fill_if_needed(room)
        
        # Check game end
        p1, p2 = room["players"][0], room["players"][1]
        game_over = (len(p1["roster"]) >= 5 and len(p2["roster"]) >= 5)

        return {
            "success": True,
            "action": "win",
            "winner_id": winner["id"],
            "winner_name": winner["name"],
            "agent": agent,
            "final_price": final_price,
            "players": room["players"],
            "game_over": game_over
        }

    def _resolve_auction_discard(self, room: Dict[str, Any]) -> Dict[str, Any]:
        auction = room["current_auction"]
        agent = auction["agent"]
        auction["status"] = "discarded"
        room["status"] = "bid_resolve"
        
        self._check_and_auto_fill_if_needed(room)
        p1, p2 = room["players"][0], room["players"][1]
        game_over = (len(p1["roster"]) >= 5 and len(p2["roster"]) >= 5)

        return {
            "success": True,
            "action": "discard",
            "agent": agent,
            "message": f"Both players passed on {agent['name']}. Agent discarded.",
            "players": room["players"],
            "game_over": game_over
        }

    def _check_and_auto_fill_if_needed(self, room: Dict[str, Any]):
        """If a player has 0 balance or cannot bid on remaining agents, auto fill from undrafted pool."""
        for p in room["players"]:
            slots_needed = 5 - len(p["roster"])
            # If balance is 0 or less than 500 and still needs agents
            if slots_needed > 0 and p["balance"] < 500:
                filled = []
                while len(p["roster"]) < 5 and room["undrafted_agents"]:
                    ag = room["undrafted_agents"].pop(0)
                    p["roster"].append(ag)
                    filled.append(ag)
                if filled:
                    p["last_auto_filled"] = filled

    def _force_fill_remaining(self, room: Dict[str, Any]):
        """Ensure both players have exactly 5 agents even if card pool ran dry."""
        all_remaining = [dict(a) for a in ALL_AGENTS]
        random.shuffle(all_remaining)
        for p in room["players"]:
            existing_ids = {a["id"] for a in p["roster"]}
            while len(p["roster"]) < 5:
                for cand in all_remaining:
                    if cand["id"] not in existing_ids:
                        p["roster"].append(cand)
                        existing_ids.add(cand["id"])
                        break

    def make_bot_decision(self, room_code: str) -> Optional[Dict[str, Any]]:
        """AI Bot decision logic for solo play mode."""
        room = self.rooms.get(room_code)
        if not room or room["status"] != "bidding":
            return None
            
        auction = room["current_auction"]
        if not auction or auction["status"] != "bidding":
            return None

        bot = next((p for p in room["players"] if p.get("is_bot")), None)
        if not bot or auction["active_turn_player_id"] != bot["id"]:
            return None

        agent = auction["agent"]
        role = agent.get("role", "Flex")
        tier = agent.get("tier", "B")
        
        # Analyze bot's current roster roles
        bot_roles = [a.get("role") for a in bot["roster"]]
        role_count = bot_roles.count(role)
        
        # Valuation calculation
        base_value = agent.get("base_bid", 900)
        if role_count == 0:
            base_value += 400  # Bot values filling unrepresented roles highly
        if tier == "S":
            base_value += 350
        elif tier == "A":
            base_value += 150
            
        # Don't spend too much if roster still needs slots
        slots_needed = 5 - len(bot["roster"])
        max_safe_bid = bot["balance"] - ((slots_needed - 1) * 300)
        valuation = min(base_value, max_safe_bid)

        current_bid = auction["current_high_bid"]
        min_required = current_bid + 100 if current_bid > 0 else auction["min_open_bid"]

        if min_required <= valuation and min_required <= bot["balance"]:
            # Bot raises!
            # Occasionally raise +200 or +100
            step = 100
            if valuation - min_required >= 300 and random.random() < 0.35:
                step = 250
            bid_amount = min(min_required + (step - 100), bot["balance"])
            return {"action": "raise", "amount": bid_amount}
        else:
            # Bot passes
            return {"action": "pass"}

    def run_ai_analysis(self, room_code: str) -> Optional[Dict[str, Any]]:
        room = self.rooms.get(room_code)
        if not room:
            return None
            
        p1 = room["players"][0]
        p2 = room["players"][1]
        
        result = evaluate_matchup(
            player1_id=p1["id"],
            player1_name=p1["name"],
            team1_agents=p1["roster"],
            player2_id=p2["id"],
            player2_name=p2["name"],
            team2_agents=p2["roster"],
            map_data=room["map"]
        )
        room["ai_result"] = result
        room["status"] = "results"
        return result

    def reset_for_rematch(self, room_code: str) -> Optional[Dict[str, Any]]:
        room = self.rooms.get(room_code)
        if not room:
            return None
            
        for p in room["players"]:
            p["balance"] = 10000
            p["roster"] = []
            p["is_ready"] = p.get("is_bot", False)
            p["has_passed_current_turn"] = False
            
        room["status"] = "lobby"
        room["map"] = None
        room["undrafted_agents"] = [dict(a) for a in ALL_AGENTS]
        random.shuffle(room["undrafted_agents"])
        room["round_number"] = 0
        room["current_auction"] = None
        room["ai_result"] = None
        return room

game_manager = GameManager()
