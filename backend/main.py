import asyncio
import os
import logging
from typing import Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from dotenv import load_dotenv

load_dotenv()

from game_engine import game_manager
from data.agents import ALL_AGENTS
from data.maps import VALORANT_MAPS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("valdraft")

# Create Socket.IO async server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    ping_timeout=20,
    ping_interval=10
)

fastapi_app = FastAPI(title="ValDraft Backend API", version="1.0.0")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active timer tasks by room_code
active_room_timers: Dict[str, asyncio.Task] = {}

# Map socket id to room_code
sid_to_room: Dict[str, str] = {}


@fastapi_app.get("/api/health")
async def health_check():
    has_gemini = bool(os.environ.get("GEMINI_API_KEY"))
    return {
        "status": "healthy",
        "service": "valdraft",
        "has_gemini_key": has_gemini,
        "agents_count": len(ALL_AGENTS),
        "maps_count": len(VALORANT_MAPS)
    }

@fastapi_app.get("/api/agents")
async def get_agents():
    return {"agents": ALL_AGENTS}

@fastapi_app.get("/api/maps")
async def get_maps():
    return {"maps": VALORANT_MAPS}

@fastapi_app.post("/api/set_gemini_key")
async def set_gemini_key(payload: Dict[str, str]):
    key = payload.get("key", "").strip()
    if key:
        os.environ["GEMINI_API_KEY"] = key
        return {"success": True, "message": "Gemini API key updated"}
    return {"success": False, "message": "Empty key provided"}


# --- SOCKET.IO EVENT HANDLERS ---

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")
    room_code = sid_to_room.get(sid)
    if room_code:
        await sio.emit("player_disconnected", {"sid": sid}, room=room_code)


@sio.event
async def create_room(sid, data):
    player_name = data.get("player_name", "Player 1")
    vs_bot = data.get("vs_bot", False)
    
    room = game_manager.create_room(player_name, sid, vs_bot=vs_bot)
    room_code = room["room_code"]
    sid_to_room[sid] = room_code
    
    await sio.enter_room(sid, room_code)
    logger.info(f"Room created: {room_code} by {player_name} (vs_bot={vs_bot})")
    
    await sio.emit("room_state", room, room=room_code)
    
    # If vs_bot, both players are ready immediately! Start map reveal after 1s
    if vs_bot:
        asyncio.create_task(trigger_map_reveal(room_code))


@sio.event
async def join_room(sid, data):
    room_code = data.get("room_code", "").strip().upper()
    player_name = data.get("player_name", "Player 2")
    
    room = game_manager.join_room(room_code, player_name, sid)
    if not room:
        await sio.emit("error", {"message": "Room not found or already full"}, to=sid)
        return
        
    sid_to_room[sid] = room_code
    await sio.enter_room(sid, room_code)
    logger.info(f"Player {player_name} joined room {room_code}")
    
    await sio.emit("room_state", room, room=room_code)


@sio.event
async def player_ready(sid, data):
    room_code = data.get("room_code")
    room = game_manager.set_player_ready(room_code, sid)
    if not room:
        return
        
    await sio.emit("room_state", room, room=room_code)
    
    # If both ready, start the sequence
    if room["status"] == "map_reveal":
        asyncio.create_task(trigger_map_reveal(room_code))


async def trigger_map_reveal(room_code: str):
    """Triggers map reveal sequence, then after 3s launches the first agent auction."""
    room = game_manager.rooms.get(room_code)
    if not room:
        return
    room["status"] = "map_reveal"
    if not room.get("map"):
        from data.maps import get_random_map
        room["map"] = get_random_map()
        
    await sio.emit("room_state", room, room=room_code)
    await sio.emit("play_sound", {"sound": "map_reveal"}, room=room_code)
    
    await asyncio.sleep(3.2)
    await start_next_round(room_code)


async def start_next_round(room_code: str):
    """Starts the next gacha agent reveal and auction."""
    room = game_manager.start_next_auction(room_code)
    if not room:
        return
        
    if room["status"] == "ai_analysis":
        await trigger_ai_analysis(room_code)
        return
        
    await sio.emit("room_state", room, room=room_code)
    await sio.emit("play_sound", {"sound": "card_reveal"}, room=room_code)
    
    # Start the turn timer
    start_turn_timer(room_code)
    
    # If it's a bot turn, schedule bot move
    check_schedule_bot_move(room_code)


def cancel_turn_timer(room_code: str):
    """Safely cancels active timer without self-cancelling the current coroutine."""
    task = active_room_timers.pop(room_code, None)
    if task and not task.done():
        current = asyncio.current_task()
        if task is not current:
            task.cancel()


def start_turn_timer(room_code: str):
    """Cancels any existing timer and starts an async countdown for the current turn."""
    cancel_turn_timer(room_code)
    active_room_timers[room_code] = asyncio.create_task(turn_timer_loop(room_code))


async def turn_timer_loop(room_code: str):
    try:
        room = game_manager.rooms.get(room_code)
        if not room or room["status"] != "bidding":
            return
            
        auction = room.get("current_auction")
        if not auction or auction["status"] != "bidding":
            return

        seconds = auction.get("turn_seconds_remaining", 10)
        while seconds > 0:
            await sio.emit("timer_tick", {
                "seconds": seconds,
                "active_turn_player_id": auction["active_turn_player_id"]
            }, room=room_code)
            await asyncio.sleep(1.0)
            seconds -= 1
            auction["turn_seconds_remaining"] = seconds
            
        # Emit final 0s tick
        await sio.emit("timer_tick", {
            "seconds": 0,
            "active_turn_player_id": auction["active_turn_player_id"]
        }, room=room_code)

        # Timer expired! Active player auto-passes in a separate task so cancellation cannot abort resolution!
        logger.info(f"Turn timer expired for room {room_code}. Auto-passing turn.")
        asyncio.create_task(handle_pass(room_code, auction["active_turn_player_id"], is_timeout=True))
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Error in turn_timer_loop: {e}")


def check_schedule_bot_move(room_code: str):
    """If the active turn belongs to a bot, schedule bot action after a natural delay (1-2s)."""
    room = game_manager.rooms.get(room_code)
    if not room or room["status"] != "bidding":
        return
    auction = room.get("current_auction")
    if not auction or auction["status"] != "bidding":
        return
        
    active_id = auction["active_turn_player_id"]
    bot = next((p for p in room["players"] if p["id"] == active_id and p.get("is_bot")), None)
    if bot:
        asyncio.create_task(execute_bot_move(room_code, bot["id"]))


async def execute_bot_move(room_code: str, bot_id: str):
    # Natural human-like pause
    await asyncio.sleep(1.2)
    room = game_manager.rooms.get(room_code)
    if not room or room["status"] != "bidding":
        return
    auction = room.get("current_auction")
    if not auction or auction["active_turn_player_id"] != bot_id:
        return

    decision = game_manager.make_bot_decision(room_code)
    if not decision:
        return

    if decision["action"] == "raise":
        await handle_raise(room_code, bot_id, decision["amount"])
    else:
        await handle_pass(room_code, bot_id, is_timeout=False)


@sio.event
async def raise_bid(sid, data):
    room_code = data.get("room_code") or sid_to_room.get(sid)
    amount = int(data.get("amount", 0))
    await handle_raise(room_code, sid, amount)


async def handle_raise(room_code: str, player_sid: str, amount: int):
    room = game_manager.rooms.get(room_code)
    if not room:
        return

    result = game_manager.process_raise_bid(room_code, player_sid, amount)
    if "error" in result:
        await sio.emit("action_error", {"message": result["error"]}, to=player_sid)
        return

    if result.get("action") == "win":
        # Hammer dropped, winner determined!
        await resolve_and_proceed(room_code, result)
    else:
        # Raise accepted, turn switched
        await sio.emit("room_state", room, room=room_code)
        await sio.emit("play_sound", {"sound": "bid_raise"}, room=room_code)
        start_turn_timer(room_code)
        check_schedule_bot_move(room_code)


@sio.event
async def pass_turn(sid, data):
    room_code = data.get("room_code") or sid_to_room.get(sid)
    await handle_pass(room_code, sid, is_timeout=False)


async def handle_pass(room_code: str, player_sid: str, is_timeout: bool = False):
    room = game_manager.rooms.get(room_code)
    if not room:
        return

    result = game_manager.process_pass_turn(room_code, player_sid)
    if "error" in result:
        return

    if result.get("action") in ["win", "discard"]:
        await resolve_and_proceed(room_code, result)
    else:
        # Pass accepted, turn transferred
        await sio.emit("room_state", room, room=room_code)
        await sio.emit("play_sound", {"sound": "pass"}, room=room_code)
        start_turn_timer(room_code)
        check_schedule_bot_move(room_code)


async def resolve_and_proceed(room_code: str, result: Dict[str, Any]):
    """Broadcasts auction outcome (win or discard), plays sound, and moves to next round or AI analysis."""
    cancel_turn_timer(room_code)

    room = game_manager.rooms.get(room_code)
    if not room:
        return

    await sio.emit("auction_resolved", result, room=room_code)
    await sio.emit("room_state", room, room=room_code)

    sound_name = "hammer_sold" if result.get("action") == "win" else "discard"
    await sio.emit("play_sound", {"sound": sound_name}, room=room_code)

    # Delay for victory/discard animation to breathe
    await asyncio.sleep(2.8)

    # Refetch room in case state changed
    room = game_manager.rooms.get(room_code)
    if not room:
        return

    if result.get("game_over") or (len(room["players"][0]["roster"]) >= 5 and len(room["players"][1]["roster"]) >= 5):
        await trigger_ai_analysis(room_code)
    else:
        await start_next_round(room_code)


async def trigger_ai_analysis(room_code: str):
    """Executes the AI composition evaluation with Gemini/tactical engine and broadcasts."""
    room = game_manager.rooms.get(room_code)
    if not room:
        return
        
    room["status"] = "ai_analysis"
    await sio.emit("room_state", room, room=room_code)
    await sio.emit("play_sound", {"sound": "analyzing"}, room=room_code)

    # Run AI evaluation asynchronously in executor so it doesn't block event loop
    loop = asyncio.get_running_loop()
    ai_result = await loop.run_in_executor(None, game_manager.run_ai_analysis, room_code)

    await sio.emit("room_state", room, room=room_code)
    await sio.emit("game_result", ai_result, room=room_code)
    await sio.emit("play_sound", {"sound": "victory"}, room=room_code)


@sio.event
async def request_rematch(sid, data):
    room_code = data.get("room_code") or sid_to_room.get(sid)
    room = game_manager.reset_for_rematch(room_code)
    if not room:
        return
        
    await sio.emit("room_state", room, room=room_code)
    # If vs_bot, auto-ready and restart
    if any(p.get("is_bot") for p in room["players"]):
        asyncio.create_task(trigger_map_reveal(room_code))


# Mount Socket.IO app to FastAPI
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
