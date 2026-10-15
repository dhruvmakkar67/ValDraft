import React, { useState, useEffect } from 'react';
import socket from './socket';
import { sounds } from './utils/audio';

import Navbar from './components/Navbar';
import ApiKeyModal from './components/ApiKeyModal';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import Draft from './pages/Draft';
import AIVerdict from './components/AIVerdict';

import './App.css';

import { LocalGameEngine } from './utils/localGameEngine';

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [room, setRoom] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(socket.id);
  const [timerSeconds, setTimerSeconds] = useState(9);
  const [lastAuctionResult, setLastAuctionResult] = useState(null);
  const [actionError, setActionError] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  const localEngineRef = React.useRef(null);

  // Room state updates
  function onRoomState(updatedRoom) {
    setRoom(updatedRoom);
    if (updatedRoom.ai_result) {
      setAiResult(updatedRoom.ai_result);
    }
  }

  // Turn timer tick
  function onTimerTick(data) {
    setTimerSeconds(data.seconds);
    if (data.seconds <= 3) {
      sounds.play('timer_urgent');
    } else {
      sounds.play('timer_tick');
    }
  }

  // Sound trigger from server/local
  function onPlaySound(data) {
    if (data?.sound) {
      sounds.play(data.sound);
    }
  }

  // Auction resolution (win or discard)
  function onAuctionResolved(result) {
    setLastAuctionResult(result);
    setTimeout(() => {
      setLastAuctionResult(null);
    }, 2600);
  }

  // Action error toast
  function onActionError(data) {
    setActionError(data.message || 'Action failed');
    setTimeout(() => setActionError(''), 3500);
  }

  // AI analysis result
  function onGameResult(result) {
    setAiResult(result);
  }

  useEffect(() => {
    localEngineRef.current = new LocalGameEngine((event, data) => {
      if (event === 'room_state') onRoomState(data);
      else if (event === 'timer_tick') onTimerTick(data);
      else if (event === 'play_sound') onPlaySound(data);
      else if (event === 'auction_resolved') onAuctionResolved(data);
      else if (event === 'action_error') onActionError(data);
      else if (event === 'game_result') onGameResult(data);
    });

    // Socket connection status
    function onConnect() {
      setIsConnected(true);
      setMyPlayerId(socket.id);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_state', onRoomState);
    socket.on('timer_tick', onTimerTick);
    socket.on('play_sound', onPlaySound);
    socket.on('auction_resolved', onAuctionResolved);
    socket.on('action_error', onActionError);
    socket.on('game_result', onGameResult);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_state', onRoomState);
      socket.off('timer_tick', onTimerTick);
      socket.off('play_sound', onPlaySound);
      socket.off('auction_resolved', onAuctionResolved);
      socket.off('action_error', onActionError);
      socket.off('game_result', onGameResult);
    };
  }, []);

  // Handlers
  const handleCreateRoom = (playerName, vsBot = false) => {
    if (vsBot && !socket.connected) {
      // Standalone in-browser simulation (e.g. deployed on Vercel without a persistent backend)
      setIsLocalMode(true);
      setMyPlayerId('local_player');
      localEngineRef.current?.createSoloRoom(playerName);
      return;
    }
    setIsLocalMode(false);
    socket.emit('create_room', { player_name: playerName, vs_bot: vsBot });
  };

  const handleJoinRoom = (roomCode, playerName) => {
    if (!socket.connected) {
      setActionError("Cannot connect to multiplayer server. Please ensure the backend is running!");
      return;
    }
    setIsLocalMode(false);
    socket.emit('join_room', { room_code: roomCode, player_name: playerName });
  };

  const handleReadyUp = () => {
    if (!room) return;
    if (isLocalMode) {
      // Local mode auto readies
      return;
    }
    socket.emit('player_ready', { room_code: room.room_code });
  };

  const handleRaiseBid = (amount) => {
    if (!room) return;
    if (isLocalMode) {
      localEngineRef.current?.handleRaise('local_player', amount);
    } else {
      socket.emit('raise_bid', { room_code: room.room_code, amount });
    }
  };

  const handlePassTurn = () => {
    if (!room) return;
    if (isLocalMode) {
      localEngineRef.current?.handlePass('local_player');
    } else {
      socket.emit('pass_turn', { room_code: room.room_code });
    }
  };

  const handleRematch = () => {
    if (!room) return;
    setAiResult(null);
    if (isLocalMode) {
      localEngineRef.current?.resetForRematch();
    } else {
      socket.emit('request_rematch', { room_code: room.room_code });
    }
  };

  const handleNewGame = () => {
    if (isLocalMode && localEngineRef.current) {
      localEngineRef.current.stopTimer();
    }
    setRoom(null);
    setAiResult(null);
    setIsLocalMode(false);
  };

  // Determine current screen
  const renderScreen = () => {
    if (!room) {
      return (
        <Landing 
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      );
    }

    if (room.status === 'lobby') {
      return (
        <Lobby 
          room={room}
          myPlayerId={myPlayerId}
          onReadyUp={handleReadyUp}
        />
      );
    }

    if (room.status === 'results' && aiResult) {
      return (
        <AIVerdict 
          result={aiResult}
          map={room.map}
          myPlayerId={myPlayerId}
          onRematch={handleRematch}
          onNewGame={handleNewGame}
        />
      );
    }

    // Default active draft screen (map_reveal, bidding, bid_resolve, ai_analysis)
    return (
      <Draft 
        room={room}
        myPlayerId={myPlayerId}
        timerSeconds={timerSeconds}
        lastAuctionResult={lastAuctionResult}
        actionError={actionError}
        onRaiseBid={handleRaiseBid}
        onPassTurn={handlePassTurn}
      />
    );
  };

  return (
    <div className="valdraft-app">
      <Navbar 
        roomCode={room?.room_code}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        isConnected={isConnected}
        isLocalMode={isLocalMode}
      />

      <main className="main-content">
        {renderScreen()}
      </main>

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}
