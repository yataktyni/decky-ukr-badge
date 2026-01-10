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
    # Same logic as utils.ts
    name = name.lower()
    name = re.sub(r"[':’]", "", name)
    name = re.sub(r"[^a-z0-9]+", "-", name)
    name = name.strip("-")
    return name

def check_kuli(game_name):
    slug = urlify_game_name(game_name)
    url = f"https://kuli.com.ua/{slug}"
    print(f"Checking {game_name} -> {url} ...")
    
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            # Check for "official" vs "community"
            soup = BeautifulSoup(r.text, 'html.parser')
            # Look for specific badges/text
            # Logic from utils.ts: 
            # if html contains "OFFICIAL" indicators?
            # Actually utils.ts checks for specific elements. 
            # Let's just say 200 means FOUND (Community or Official).
            
            # Refined check based on utils.ts
            # const isOfficial = !!doc.querySelector(".html-product-details-page");
            # Wait, utils.ts logic for "OFFICIAL" check:
            # if (doc.querySelector(".html-product-details-page")) return "OFFICIAL"? No.
            # "html-product-details-page" seems to imply a valid product page.
            
            # Real logic:
            # If page exists, check content.
            # Kuli usually lists translations.
            # We assume COMMUNITY unless evidence of OFFICIAL?
            # Or always COMMUNITY if on Kuli?
            # utils.ts returns "COMMUNITY" if found, unless we have logic for "Official" there?
            # utils.ts: "if (doc) return 'COMMUNITY';" -> So currently it returns COMMUNITY if found.
            
            return "FOUND"
        elif r.status_code == 404:
            # Try search
            print(f"  Direct 404. searching...", end="")
            search_url = f"https://kuli.com.ua/search?q={urllib.parse.quote(game_name)}"
            sr = requests.get(search_url, timeout=10)
            if sr.status_code == 200:
                ssoup = BeautifulSoup(sr.text, 'html.parser')
                # Find results
                # search-page-results > a (href)
                results = ssoup.select(".search-page-results a")
                if results:
                    first_link = results[0]['href']
                    print(f" Found search result: {first_link}")
                    return "FOUND_BY_SEARCH"
            
            return "NOT_FOUND"
        else:
            return f"ERROR_{r.status_code}"
            
    except Exception as e:
        return f"EXCEPTION: {e}"

def main():
    print("Validating Kuli Integration...")
    results = {}
    for game in GAMES:
        status = check_kuli(game)
        results[game] = status
        print(f"Result: {status}\n")
        time.sleep(1) # Be nice
        
    print("\n--- SUMMARY ---")
    found = 0
    total = len(GAMES)
    for game, status in results.items():
        print(f"{game}: {status}")
        if "FOUND" in status:
            found += 1
            
    print(f"\nFound {found}/{total} games.")

if __name__ == "__main__":
    main()
