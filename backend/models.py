from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Ability(BaseModel):
    slot: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = ""
    icon: Optional[str] = None

class Agent(BaseModel):
    id: str
    name: str
    role: str
    tier: str
    base_bid: int
    description: str = ""
    portrait: Optional[str] = None
    icon: Optional[str] = None
    background: Optional[str] = None
    colors: List[str] = Field(default_factory=list)
    abilities: List[Ability] = Field(default_factory=list)

class ValorantMap(BaseModel):
    id: str
    name: str
    subtitle: str
    sites: int
    splash: str
    description: str
    key_factors: List[str] = Field(default_factory=list)

class Player(BaseModel):
    id: str
    name: str
    balance: int = 10000
    roster: List[Agent] = Field(default_factory=list)
    is_ready: bool = False
    is_bot: bool = False
    has_passed_current_turn: bool = False

class CurrentAuction(BaseModel):
    agent: Agent
    current_high_bid: int = 0
    high_bidder_id: Optional[str] = None
    active_turn_player_id: str
    turn_deadline_seconds: int = 10
    round_number: int = 1
    status: str = "active" # "active", "won", "discarded"
    bid_history: List[Dict[str, Any]] = Field(default_factory=list)

class CompScore(BaseModel):
    site_execution: int
    information_gathering: int
    map_control: int
    flexibility: int
    synergy: int
    total_score: int

class TeamAnalysis(BaseModel):
    player_id: str
    player_name: str
    scores: CompScore
    strengths: List[str]
    weaknesses: List[str]
    key_combos: List[str]
    role_breakdown: Dict[str, int]

class CompAnalysisResult(BaseModel):
    team1: TeamAnalysis
    team2: TeamAnalysis
    verdict: str
    winner_id: str
    winner_name: str
    win_probability: int
    tactical_summary: str
    map_context: str
