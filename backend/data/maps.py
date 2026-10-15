"""
Valorant Competitive Maps Data
Contains official splash arts, callouts, and tactical meta descriptions.
"""

VALORANT_MAPS = [
    {
        "id": "ascent",
        "name": "Ascent",
        "subtitle": "San Marco, Venice, Italy",
        "sites": 2,
        "splash": "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
        "description": "An open playground for small wars of position and attrition divides two sites on Ascent. Mid control is paramount.",
        "key_factors": ["Mid control", "Sova recon dominance", "Killjoy/Cypher lock down on B", "Omen/Astra smokes"]
    },
    {
        "id": "bind",
        "name": "Bind",
        "subtitle": "Rabat, Morocco",
        "sites": 2,
        "splash": "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
        "description": "Two sites. No middle. Gotta pick left or right. What's it going to be then? Both offer direct paths for attackers and a pair of one-way teleporters.",
        "key_factors": ["One-way teleporters", "Brimstone/Viper wall smokes", "Raze nade value", "Skye/Fade info"]
    },
    {
        "id": "haven",
        "name": "Haven",
        "subtitle": "Thimphu, Bhutan",
        "sites": 3,
        "splash": "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png",
        "description": "Beneath a forgotten monastery, a emergent clamor erupts. Three sites require defenders to stretch thin and rotate quickly.",
        "key_factors": ["3 Spike sites (A, B, C)", "Flank control", "Fast rotations", "Breach/Fade util combos"]
    },
    {
        "id": "split",
        "name": "Split",
        "subtitle": "Shinjuku, Tokyo, Japan",
        "sites": 2,
        "splash": "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
        "description": "If you want to go far, you'll have to go up. A pair of sites separated by an elevated center and quick ropes.",
        "key_factors": ["Vertical ropes", "Heavy choke points", "Raze/Breach dominance", "Sage slow orb/wall utility"]
    },
    {
        "id": "icebox",
        "name": "Icebox",
        "subtitle": "Bennett Island, Russia",
        "sites": 2,
        "splash": "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
        "description": "Your next battleground is a secret Kingdom excavation site overtaken by the arctic. The two plant sites emphasize verticality and zip-lines.",
        "key_factors": ["Long-range sightlines", "Viper solo controller requirement", "Sova recon", "Killjoy setup"]
    },
    {
        "id": "breeze",
        "name": "Breeze",
        "subtitle": "Bermuda Triangle, Atlantic Ocean",
        "sites": 2,
        "splash": "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
        "description": "Take in the sights of historic ruins and breezy seaside caves on this tropical island. Wide-open spaces and long-range encounters.",
        "key_factors": ["Massive sightlines", "Viper wall mandatory", "Jett Operator supremacy", "Cypher trapwires"]
    },
    {
        "id": "lotus",
        "name": "Lotus",
        "subtitle": "Western Ghats, India",
        "sites": 3,
        "splash": "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png",
        "description": "A mysterious structure housing an astral conduit radiates with ancient power. Great stone doors unlock dynamic rotation routes.",
        "key_factors": ["3 Spike sites", "Rotating doors", "Destructible door", "Omen/Fade/Killjoy staple comp"]
    },
    {
        "id": "sunset",
        "name": "Sunset",
        "subtitle": "Los Angeles, California, USA",
        "sites": 2,
        "splash": "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png",
        "description": "A stroll through an evening-lit neighborhood features traditional three-lane design with B-main choke and dynamic mid courtyards.",
        "key_factors": ["Mid control wins rounds", "Cypher B-site anchor", "Raze/Neon entry", "Omen/Breach flashes"]
    },
    {
        "id": "abyss",
        "name": "Abyss",
        "subtitle": "Secret Scion of the Earth facility",
        "sites": 2,
        "splash": "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
        "description": "No boundary rails. One wrong step means plummeting into the void. High-risk vertical drops and long jumps.",
        "key_factors": ["No fall barriers", "Omen Shrouded Step jumps", "Astra concuss/gravity well", "Jett float escapes"]
    },
    {
        "id": "pearl",
        "name": "Pearl",
        "subtitle": "Lisbon, Portugal (Omega Earth)",
        "sites": 2,
        "splash": "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png",
        "description": "An underwater dome shields a Portuguese city. Two sites with intricate B-long lanes and close-quarter art rooms.",
        "key_factors": ["B-long sniper duels", "Astra/Viper control", "Fade haunt lineups", "Killjoy lockdown B"]
    }
]

def get_random_map():
    import random
    return random.choice(VALORANT_MAPS)
