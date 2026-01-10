import requests
from bs4 import BeautifulSoup
import re
import time
import urllib.parse

GAMES = [
    "Cyberpunk 2077",
    "The Witcher 3: Wild Hunt",
    "Hades",
    "Stardew Valley",
    "Baldur's Gate 3",
    "Dota 2",
    "Counter-Strike 2",
    "Grand Theft Auto V",
    "Red Dead Redemption 2",
    "Elden Ring",
    "Apex Legends",
    "PUBG: BATTLEGROUNDS",
    "Team Fortress 2",
    "Among Us",
    "Terraria",
    "Portal 2",
    "Half-Life 2",
    "God of War",
    "Horizon Zero Dawn",
    "Disco Elysium",
    "Metro Exodus",
    "S.T.A.L.K.E.R. 2: Heart of Chornobyl",
    "Factorio",
    "Hollow Knight"
]

def urlify_game_name(name):
    """Matches utils.ts urlifyGameName function exactly"""
    name = name.lower()
    name = re.sub(r"[':']", "", name)
    name = re.sub(r"[^a-z0-9]+", "-", name)
    name = name.strip("-")
    return name

def search_kuli_for_game(game_name):
    """Matches utils.ts searchKuliForGame function"""
    try:
        # CORRECTED: Plugin uses /games?query= not /search?q=
        search_url = f"https://kuli.com.ua/games?query={urllib.parse.quote(game_name)}"
        res = requests.get(search_url, timeout=10)
        if res.status_code != 200:
            return None
        
        html = res.text
        
        # CORRECTED: Plugin uses regex to find product-item links
        match = re.search(r'class="product-item[^"]*".*?href="([^"]+)"', html, re.DOTALL)
        if not match:
            return None
        
        href = match.group(1)
        if not href.startswith("http"):
            href = f"https://kuli.com.ua{'' if href.startswith('/') else '/'}{href}"
        
        # Fetch the found page
        game_res = requests.get(href, timeout=10)
        if game_res.status_code != 200:
            return None
        
        game_html = game_res.text
        
        # CORRECTED: Check for COMMUNITY vs OFFICIAL markers
        if "item__instruction-main" in game_html:
            return "COMMUNITY"
        
        if ("html-product-details-page" in game_html or 
            "game-page" in game_html or 
            "item__title" in game_html):
            return "OFFICIAL"
        
        return None
    except Exception as e:
        print(f"    Search error: {e}")
        return None

def check_kuli(game_name):
    """Matches utils.ts fetchKuliTranslationStatus function exactly"""
    slug = urlify_game_name(game_name)
    url = f"https://kuli.com.ua/{slug}"
    print(f"Checking {game_name} -> {url} ...")
    
    try:
        r = requests.get(url, timeout=10, headers={"Accept": "text/html"})
        
        if r.status_code == 404:
            print(f"  Direct 404. Trying search...", end="")
            result = search_kuli_for_game(game_name)
            if result:
                print(f" Found via search: {result}")
            else:
                print(f" Not found in search")
            return result
        
        if r.status_code != 200:
            print(f"  HTTP {r.status_code}")
            return None
        
        html = r.text
        
        # CORRECTED: Check for COMMUNITY marker first
        if "item__instruction-main" in html:
            return "COMMUNITY"
        
        # CORRECTED: Check if it's a valid game page for OFFICIAL
        if ("html-product-details-page" in html or 
            "game-page" in html or 
            "item__title" in html):
            return "OFFICIAL"
        
        return None
        
    except Exception as e:
        print(f"  Exception: {e}")
        return None

def main():
    print("Validating Kuli Integration (CORRECTED VERSION)")
    print("=" * 60)
    results = {}
    
    for game in GAMES:
        status = check_kuli(game)
        results[game] = status
        print(f"Result: {status or 'NOT_FOUND'}\n")
        time.sleep(1)  # Be nice to the server
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    official = 0
    community = 0
    not_found = 0
    
    for game, status in results.items():
        status_str = status or "NOT_FOUND"
        print(f"{game:40} {status_str}")
        
        if status == "OFFICIAL":
            official += 1
        elif status == "COMMUNITY":
            community += 1
        else:
            not_found += 1
    
    total = len(GAMES)
    found = official + community
    
    print("=" * 60)
    print(f"Official:   {official}/{total} ({official*100//total}%)")
    print(f"Community:  {community}/{total} ({community*100//total}%)")
    print(f"Not Found:  {not_found}/{total} ({not_found*100//total}%)")
    print(f"Total Found: {found}/{total} ({found*100//total}%)")

if __name__ == "__main__":
    main()
