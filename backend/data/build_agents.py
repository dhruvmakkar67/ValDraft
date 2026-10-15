import urllib.request
import json
import os

# Tier classification based on competitive/VCT meta
AGENT_TIERS = {
    # S-Tier: Meta-defining, dominant picks on multiple maps
    "Jett": ("S", 1500),
    "Omen": ("S", 1500),
    "Sova": ("S", 1500),
    "Cypher": ("S", 1500),
    "Viper": ("S", 1500),
    "Killjoy": ("S", 1500),
    "Tejo": ("S", 1500),
    
    # A-Tier: Extremely strong, essential on specific maps
    "Raze": ("A", 1200),
    "Fade": ("A", 1200),
    "Breach": ("A", 1200),
    "KAY/O": ("A", 1200),
    "Skye": ("A", 1200),
    "Gekko": ("A", 1200),
    "Clove": ("A", 1200),
    "Astra": ("A", 1200),
    "Vyse": ("A", 1200),
    "Neon": ("A", 1200),
    
    # B-Tier: Solid tactical flex picks
    "Brimstone": ("B", 900),
    "Chamber": ("B", 900),
    "Deadlock": ("B", 900),
    "Yoru": ("B", 900),
    "Iso": ("B", 900),
    "Reyna": ("B", 900),
    "Phoenix": ("B", 900),
    "Harbor": ("B", 900),
    
    # C-Tier: Situational / niche picks
    "Sage": ("C", 600),
    "Waylay": ("C", 600),
    "Miks": ("C", 600),
    "Veto": ("C", 600),
}

def generate_agents():
    url = "https://valorant-api.com/v1/agents?isPlayableCharacter=true"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))["data"]

    agents = []
    for a in data:
        name = a["displayName"]
        role = a["role"]["displayName"] if a.get("role") else "Flex"
        tier, base_bid = AGENT_TIERS.get(name, ("B", 900))
        
        abilities = []
        for ab in a.get("abilities", []):
            abilities.append({
                "slot": ab.get("slot"),
                "name": ab.get("displayName"),
                "description": ab.get("description", ""),
                "icon": ab.get("displayIcon")
            })
            
        agents.append({
            "id": a["uuid"],
            "name": name,
            "role": role,
            "tier": tier,
            "base_bid": base_bid,
            "description": a.get("description", ""),
            "portrait": a.get("fullPortrait") or a.get("displayIconLarge") or a.get("displayIcon"),
            "icon": a.get("displayIcon"),
            "background": a.get("background"),
            "colors": a.get("backgroundGradientColors") or ["0F1923", "FF4655"],
            "abilities": abilities[:4]
        })

    # Sort alphabetically
    agents.sort(key=lambda x: x["name"])

    output_path = os.path.join(os.path.dirname(__file__), "agents.py")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write('"""\nValorant 29 Playable Agents Data\nOfficial assets, roles, tiers, and base auction bids.\n"""\n\n')
        f.write(f"ALL_AGENTS = {json.dumps(agents, indent=4)}\n\n")
        f.write("def get_agent_by_id(agent_id: str):\n")
        f.write("    for a in ALL_AGENTS:\n")
        f.write("        if a['id'] == agent_id:\n")
        f.write("            return a\n")
        f.write("    return None\n")
        
    print(f"Successfully generated {len(agents)} agents in {output_path}")

if __name__ == "__main__":
    generate_agents()
