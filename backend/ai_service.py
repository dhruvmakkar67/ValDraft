import os
import json
import logging
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Map specific synergy matrices
MAP_SYNERGY = {
    "ascent": {
        "top_picks": ["Sova", "Omen", "Killjoy", "Jett", "KAY/O", "Cypher"],
        "notes": "Ascent mid-control and B-site lockdown favor Sova recon arrows and Killjoy/Cypher anchor setups."
    },
    "bind": {
        "top_picks": ["Brimstone", "Viper", "Raze", "Skye", "Fade", "Cypher"],
        "notes": "Bind has no mid, favoring heavy choke smokes (Brimstone/Viper) and explosive site takes with Raze satchels."
    },
    "haven": {
        "top_picks": ["Omen", "Breach", "Sova", "Jett", "Killjoy", "Fade"],
        "notes": "Three sites demand quick rotations, Breach concuss/flashes down long corridors, and reliable info gathering."
    },
    "split": {
        "top_picks": ["Raze", "Breach", "Omen", "Astra", "Cypher", "Sage"],
        "notes": "Vertical ropes and narrow chokepoints make Raze nades and Breach faultlines devastating."
    },
    "icebox": {
        "top_picks": ["Viper", "Sova", "Killjoy", "Jett", "Sage", "Gekko"],
        "notes": "Viper wall is virtually mandatory for A-site and B-long coverage; vertical angles reward Jett updrafts."
    },
    "breeze": {
        "top_picks": ["Viper", "Sova", "Cypher", "Jett", "KAY/O"],
        "notes": "Massive sightlines require Viper's Toxic Screen and long-distance Operator pressure from Jett."
    },
    "lotus": {
        "top_picks": ["Omen", "Fade", "Killjoy", "Raze", "Breach", "Clove"],
        "notes": "3 sites and rotating doors allow aggressive fast rotates and multi-angle pinches with Fade prowlers."
    },
    "sunset": {
        "top_picks": ["Cypher", "Omen", "Raze", "Breach", "Fade", "Gekko"],
        "notes": "Mid courtyard fights and tight B-main corridors elevate Cypher setups and flash-heavy entry."
    },
    "abyss": {
        "top_picks": ["Omen", "Astra", "Jett", "Sova", "Vyse", "Tejo"],
        "notes": "Hazardous drop edges reward displacement abilities, Astra gravity pull, and Jett gliding."
    },
    "pearl": {
        "top_picks": ["Astra", "Viper", "Fade", "Jett", "Killjoy", "Skye"],
        "notes": "B-long post-plant requires long-range stall and Astra cosmic divides to safely plant/defuse."
    }
}

def rule_based_evaluate(team_agents: List[Dict[str, Any]], map_data: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback tactical evaluation engine based on competitive Valorant meta."""
    map_id = map_data.get("id", "").lower()
    synergy_info = MAP_SYNERGY.get(map_id, {
        "top_picks": ["Omen", "Jett", "Sova", "Killjoy"],
        "notes": "Standard balanced composition required for map control and site execution."
    })
    
    roles = {}
    names = []
    for a in team_agents:
        role = a.get("role", "Flex")
        roles[role] = roles.get(role, 0) + 1
        names.append(a.get("name"))
        
    num_controllers = roles.get("Controller", 0)
    num_initiators = roles.get("Initiator", 0)
    num_duelists = roles.get("Duelist", 0)
    num_sentinels = roles.get("Sentinel", 0)
    
    # Base scores
    site_exec = 50 + (num_duelists * 10) + (num_initiators * 8)
    info_gather = 40 + (num_initiators * 18) + (num_sentinels * 6)
    map_control = 35 + (num_controllers * 22) + (num_sentinels * 10)
    flexibility = 50 + (len(roles) * 10)
    synergy = 55
    
    strengths = []
    weaknesses = []
    combos = []
    
    # Smokes check (vital in Valorant)
    if num_controllers == 0:
        map_control -= 25
        site_exec -= 15
        weaknesses.append("🚨 Zero Controller smokes: Crossing open sightlines and executing onto sites will be suicidal against snipers.")
    elif num_controllers >= 1:
        strengths.append(f"Solid vision denial with {num_controllers} Controller(s) to cut off defensive crossfires.")
        if num_controllers == 2:
            strengths.append("Double Controller setup enables deep lurk smokes and full site-splitting walls.")
            
    # Info check
    if num_initiators == 0:
        info_gather -= 25
        weaknesses.append("Lack of dedicated Initiator recon: The team must face-check corners and blind-enter chokepoints.")
    else:
        strengths.append(f"Reliable intel & flash utility with {num_initiators} Initiator(s) clearing out anchor positions.")
        
    # Sentinel anchor check
    if num_sentinels == 0:
        map_control -= 10
        weaknesses.append("No Sentinel flank traps: Vulnerable to aggressive defender pushes and lurking attackers.")
    else:
        strengths.append(f"Flank protection and site lockdown guaranteed with {num_sentinels} Sentinel(s).")
        
    # Duelist entry check
    if num_duelists == 0:
        site_exec -= 10
        weaknesses.append("No Duelist: Lacks explosive space-creation, forcing support agents to take first contact duels.")
    elif num_duelists > 2:
        flexibility -= 10
        weaknesses.append(f"Overloaded on {num_duelists} Duelists: Prone to running dry on defensive utility and stall power.")
        
    # Map synergy bonuses
    top_picks = synergy_info.get("top_picks", [])
    matched_top = [n for n in names if n in top_picks]
    if matched_top:
        bonus = len(matched_top) * 5
        synergy += bonus
        strengths.append(f"High map affinity: {', '.join(matched_top)} thrive on {map_data.get('name')} geometry.")
        
    # Synergistic Combos detection
    if "Sova" in names and "Raze" in names:
        combos.append("Sova Recon Dart + Raze Paint Shells grenade trap combo")
    if "Breach" in names and "Jett" in names:
        combos.append("Breach Fault Line stun + Jett Tailwind entry dash")
    if "Fade" in names and "Raze" in names:
        combos.append("Fade Seize tether + Raze Showstopper/Grenade lethal combo")
    if "Omen" in names and "Flash" in [r for r in names if r in ["Reyna", "Phoenix", "Skye", "KAY/O"]]:
        combos.append("Omen Dark Cover smoke + Blind entry pop-flash")
    if "Killjoy" in names and "Viper" in names:
        combos.append("Killjoy Nanoswarm + Viper Snake Bite decay post-plant denial")
        
    if not combos:
        combos.append("Standard tactical trade-fragging and synchronized crossfire setup")

    # Clamp scores
    site_exec = max(20, min(98, site_exec))
    info_gather = max(20, min(98, info_gather))
    map_control = max(20, min(98, map_control))
    flexibility = max(20, min(98, flexibility))
    synergy = max(20, min(98, synergy))
    
    total = int((site_exec * 0.22) + (info_gather * 0.22) + (map_control * 0.22) + (flexibility * 0.16) + (synergy * 0.18))
    
    return {
        "scores": {
            "site_execution": site_exec,
            "information_gathering": info_gather,
            "map_control": map_control,
            "flexibility": flexibility,
            "synergy": synergy,
            "total_score": total
        },
        "strengths": strengths[:4],
        "weaknesses": weaknesses[:3] if weaknesses else ["Minor vulnerabilities to coordinated utility counter-dumps."],
        "key_combos": combos[:3],
        "role_breakdown": roles
    }


def analyze_with_gemini(
    team1_name: str,
    team1_agents: List[Dict[str, Any]],
    team2_name: str,
    team2_agents: List[Dict[str, Any]],
    map_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Uses official google-genai SDK to analyze team compositions."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.info("No GEMINI_API_KEY found, using local tactical engine.")
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        
        t1_str = ", ".join([f"{a['name']} ({a['role']})" for a in team1_agents])
        t2_str = ", ".join([f"{a['name']} ({a['role']})" for a in team2_agents])
        
        prompt = f"""
You are an elite VCT (Valorant Champions Tour) head coach and tactical analyst.
Analyze a head-to-head match between two drafted 5-agent compositions on the competitive map: {map_data.get('name')} ({map_data.get('subtitle', '')}).

Map Meta Context:
{map_data.get('description', '')}
Key Tactical Map Factors: {", ".join(map_data.get('key_factors', []))}

Team 1 - {team1_name}:
{t1_str}

Team 2 - {team2_name}:
{t2_str}

Provide a deep tactical breakdown and declare a winner based on:
1. Site Execution & Retake potential on {map_data.get('name')}
2. Information gathering & Early round reconnaissance
3. Map Control (smokes, space denial, flank security)
4. Overall composition balance and ability synergy

Respond with a strictly valid JSON object matching this schema:
{{
  "team1_scores": {{
    "site_execution": <number 0-100>,
    "information_gathering": <number 0-100>,
    "map_control": <number 0-100>,
    "flexibility": <number 0-100>,
    "synergy": <number 0-100>,
    "total_score": <number 0-100>
  }},
  "team1_strengths": [<string>, <string>],
  "team1_weaknesses": [<string>, <string>],
  "team1_key_combos": [<string>, <string>],
  "team2_scores": {{
    "site_execution": <number 0-100>,
    "information_gathering": <number 0-100>,
    "map_control": <number 0-100>,
    "flexibility": <number 0-100>,
    "synergy": <number 0-100>,
    "total_score": <number 0-100>
  }},
  "team2_strengths": [<string>, <string>],
  "team2_weaknesses": [<string>, <string>],
  "team2_key_combos": [<string>, <string>],
  "verdict_winner": "<'team1' or 'team2'>",
  "win_probability": <number 50-85>,
  "tactical_summary": "<engaging 3-4 sentence esports broadcast-style analysis explaining why the winner wins on this specific map>"
}}
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        
        parsed = json.loads(response.text)
        return parsed
    except Exception as e:
        logger.warning(f"Gemini API call failed or timed out: {e}. Falling back to tactical evaluator.")
        return None


def evaluate_matchup(
    player1_id: str,
    player1_name: str,
    team1_agents: List[Dict[str, Any]],
    player2_id: str,
    player2_name: str,
    team2_agents: List[Dict[str, Any]],
    map_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Generates the complete composition analysis, attempting Gemini first, then falling back."""
    
    # Try Gemini analysis first
    gemini_result = analyze_with_gemini(
        player1_name, team1_agents,
        player2_name, team2_agents,
        map_data
    )
    
    if gemini_result:
        winner_key = gemini_result.get("verdict_winner", "team1")
        is_p1 = (winner_key == "team1")
        winner_id = player1_id if is_p1 else player2_id
        winner_name = player1_name if is_p1 else player2_name
        win_prob = gemini_result.get("win_probability", 58)
        
        # Build roles
        r1 = {}
        for a in team1_agents:
            r = a.get("role", "Flex")
            r1[r] = r1.get(r, 0) + 1
        r2 = {}
        for a in team2_agents:
            r = a.get("role", "Flex")
            r2[r] = r2.get(r, 0) + 1
            
        return {
            "team1": {
                "player_id": player1_id,
                "player_name": player1_name,
                "scores": gemini_result.get("team1_scores"),
                "strengths": gemini_result.get("team1_strengths", []),
                "weaknesses": gemini_result.get("team1_weaknesses", []),
                "key_combos": gemini_result.get("team1_key_combos", []),
                "role_breakdown": r1
            },
            "team2": {
                "player_id": player2_id,
                "player_name": player2_name,
                "scores": gemini_result.get("team2_scores"),
                "strengths": gemini_result.get("team2_strengths", []),
                "weaknesses": gemini_result.get("team2_weaknesses", []),
                "key_combos": gemini_result.get("team2_key_combos", []),
                "role_breakdown": r2
            },
            "verdict": f"{winner_name} claims victory on {map_data.get('name')}!",
            "winner_id": winner_id,
            "winner_name": winner_name,
            "win_probability": win_prob,
            "tactical_summary": gemini_result.get("tactical_summary", ""),
            "map_context": map_data.get("description", "")
        }

    # Rule-based fallback
    t1_eval = rule_based_evaluate(team1_agents, map_data)
    t2_eval = rule_based_evaluate(team2_agents, map_data)
    
    score1 = t1_eval["scores"]["total_score"]
    score2 = t2_eval["scores"]["total_score"]
    
    diff = abs(score1 - score2)
    win_prob = min(88, 52 + int(diff * 1.2))
    
    if score1 >= score2:
        winner_id = player1_id
        winner_name = player1_name
        winner_score = score1
        loser_score = score2
    else:
        winner_id = player2_id
        winner_name = player2_name
        winner_score = score2
        loser_score = score1
        
    summary = (
        f"{winner_name} edges out the draft with a higher overall composition efficiency ({winner_score} vs {loser_score}) "
        f"on {map_data.get('name')}. Their superior role dispersion and critical ability synergies "
        f"provide better site anchoring and execute utility under high-pressure competitive rounds."
    )
    
    return {
        "team1": {
            "player_id": player1_id,
            "player_name": player1_name,
            "scores": t1_eval["scores"],
            "strengths": t1_eval["strengths"],
            "weaknesses": t1_eval["weaknesses"],
            "key_combos": t1_eval["key_combos"],
            "role_breakdown": t1_eval["role_breakdown"]
        },
        "team2": {
            "player_id": player2_id,
            "player_name": player2_name,
            "scores": t2_eval["scores"],
            "strengths": t2_eval["strengths"],
            "weaknesses": t2_eval["weaknesses"],
            "key_combos": t2_eval["key_combos"],
            "role_breakdown": t2_eval["role_breakdown"]
        },
        "verdict": f"{winner_name} wins on {map_data.get('name')}!",
        "winner_id": winner_id,
        "winner_name": winner_name,
        "win_probability": win_prob,
        "tactical_summary": summary,
        "map_context": map_data.get("description", "")
    }
