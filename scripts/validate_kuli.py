import requests
import re
import time
import urllib.parse

# Color codes
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
RESET = "\033[0m"

GAMES = [
    # Popular
    "Cyberpunk 2077",
    "The Witcher 3: Wild Hunt",
    "Hades",
    "Dota 2",
    "Counter-Strike 2",
    "Grand Theft Auto V",
    "Baldur's Gate 3",
    "Elden Ring",
    
    # Official Translations (Known)
    "S.T.A.L.K.E.R. 2: Heart of Chornobyl",
    "Factorio",
    "Metro Exodus",
    
    # Community Translations (Known)
    "Hollow Knight",
    "Disco Elysium",
    
    # Edge Cases (Punctuation)
    "PUBG: BATTLEGROUNDS",
    "Half-Life 2",
    "God of War",
    "Horizon Zero Dawn",
    "Door Kickers 2",
    "Bad 2 Bad: Apocalypse",
    "Intravenous",
    "Neon Abyss",
    "Soulstone Survivors",
    "West of Dead",
    "Hell Let Loose",
    "Insurgency: Sandstorm",
    "ABZU"
]

def clean_non_steam_name(name):
    """Matches plugin logic: cleanNonSteamName function"""
    if not name: return ""
    # Remove (Shortcut), (Non-Steam), etc.
    name = re.sub(r"\s*\((Shortcut|Non-Steam|App|Game)\)$", "", name, flags=re.IGNORECASE)
    # Remove version numbers like v1.0
    name = re.sub(r"\s*v\d+(\.\d+)*", "", name, flags=re.IGNORECASE)
    return name.strip()

def urlify_game_name(name):
    """Matches plugin logic: urlifyGameName function"""
    name = clean_non_steam_name(name)
    name = name.lower()
    name = re.sub(r"[':’]", "", name)
    name = re.sub(r"[^a-z0-9]+", "-", name)
    name = re.sub(r"-+", "-", name)
    name = name.strip("-")
    return name

def search_kuli_for_game(game_name):
    """Search kuli.com.ua and return (status, url) tuple"""
    try:
        search_url = f"https://kuli.com.ua/games?query={urllib.parse.quote(game_name)}"
        # Add headers to mimic browser/check_kuli behavior
        headers = {
            "Accept": "text/html",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        res = requests.get(search_url, timeout=10, headers=headers)
        
        if res.status_code != 200:
            print(f"    {RED}Search HTTP {res.status_code}{RESET}")
            return None, None
        
        html = res.text
        # Regex to match product-item link. Uses DOTALL to handle newlines between attributes.
        match = re.search(r'class="product-item[^"]*".*?href="([^"]+)"', html, re.DOTALL)
        
        if not match:
            # Try finding ANY product link if the strict class match fails
            match = re.search(r'class="product-item-full[^"]*".*?href="([^"]+)"', html, re.DOTALL)
            
        if not match:
             # Last resort: just find the first link inside a product-grid item
            match = re.search(r'class="item-grid".*?href="([^"]+)"', html, re.DOTALL)

        if not match:
            # Debug: check if we actually got the search page
            if "Horizon" in game_name and "Horizon" not in html:
                 print(f"    {RED}Search page seem empty/blocked{RESET}")
            return None, None
        
        href = match.group(1)
        if not href.startswith("http"):
            href = urllib.parse.urljoin("https://kuli.com.ua", href)
        
        # Now verify the found game page
        game_res = requests.get(href, timeout=10, headers=headers)
        if game_res.status_code != 200:
            return None, None
        
        game_html = game_res.text
        if "item__instruction-main" in game_html:
            return "COMMUNITY", href
        
        if any(m in game_html for m in ["html-product-details-page", "game-page", "item__title"]):
            return "OFFICIAL", href
        
        return None, None
    except Exception as e:
        print(f"    {RED}Search error: {e}{RESET}")
        return None, None

def check_kuli(game_name):
    """Check kuli.com.ua and return (status, url) tuple"""
    slug = urlify_game_name(game_name)
    url = f"https://kuli.com.ua/{slug}"
    print(f"Checking {game_name} -> {url} ... ", end="", flush=True)
    
    try:
        r = requests.get(url, timeout=10, headers={"Accept": "text/html"})
        
        if r.status_code == 404:
            print(f"{YELLOW}Direct 404. Searching...{RESET}", end="", flush=True)
            status, found_url = search_kuli_for_game(game_name)
            if status:
                print(f" {GREEN}Found via search ({status}){RESET}")
                print(f"    {CYAN}URL: {found_url}{RESET}")
                return status, found_url
            else:
                print(f" {RED}Not found in search{RESET}")
                return None, None
        
        if r.status_code != 200:
            print(f" {RED}HTTP {r.status_code}{RESET}")
            return None, None
        
        html = r.text
        if "item__instruction-main" in html:
            print(f" {GREEN}FOUND (COMMUNITY){RESET}")
            print(f"    {CYAN}URL: {url}{RESET}")
            return "COMMUNITY", url
        
        if any(m in html for m in ["html-product-details-page", "game-page", "item__title"]):
            print(f" {GREEN}FOUND (OFFICIAL){RESET}")
            print(f"    {CYAN}URL: {url}{RESET}")
            return "OFFICIAL", url
        
        print(f" {RED}Page found but no status detected{RESET}")
        return None, None
        
    except Exception as e:
        print(f" {RED}Exception: {e}{RESET}")
        return None, None

def main():
    print("Validating Kuli Integration (Production Logic)")
    print("=" * 60)
    results = {}
    
    for game in GAMES:
        status, url = check_kuli(game)
        results[game] = (status, url)
        time.sleep(0.5)  # Be nice to the server
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    official = 0
    community = 0
    not_found = 0
    
    for game, (status, url) in results.items():
        status_str = status or "NOT_FOUND"
        color = GREEN if status else RED
        url_str = f" -> {url}" if url else ""
        print(f"{game:40} {color}{status_str}{RESET}{url_str}")
        
        if status == "OFFICIAL":
            official += 1
        elif status == "COMMUNITY":
            community += 1
        else:
            not_found += 1
    
    total = len(GAMES)
    found = official + community
    
    print("=" * 60)
    print(f"Official:   {official}/{total}")
    print(f"Community:  {community}/{total}")
    print(f"Not Found:  {not_found}/{total}")
    print(f"Total Success Rate: {found}/{total} ({found*100//total}%)")

if __name__ == "__main__":
    main()
