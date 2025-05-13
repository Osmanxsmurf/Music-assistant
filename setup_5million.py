# 5 million songs integration script
# This script integrates the generated songs into the Music Assistant API
import json
import os
import shutil
import random

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

def main():
    # Main integration function
    print("Starting 5 million songs integration...")
    
    # Check if songs_index.json exists
    index_path = os.path.join(BASE_DIR, "songs_index.json")
    if not os.path.exists(index_path):
        print("Error: songs_index.json not found!")
        print("Please run generate_music_database.py first.")
        return False
    
    # Load the index file
    with open(index_path, "r", encoding="utf-8") as f:
        index_data = json.load(f)
    
    total_songs = index_data.get("total_songs", 0)
    batches = index_data.get("batches", [])
    
    print(f"Found {total_songs:,} songs and {len(batches)} batches.")
    
    # Create API loader module
    create_api_loader()
    
    # Create integration guide
    create_integration_guide()
    
    # Update AI dataset with sample songs
    update_ai_dataset(batches)
    
    print("\n✅ 5 million songs integration completed!")
    print("\nNext steps:")
    print("1. Read the INTEGRATION_GUIDE.md file")
    print("2. Update your API with the new song data")
    print("3. Restart your application and test it")
    
    return True

def create_api_loader():
    # Create API song loader module
    print("\nCreating API song loader module...")
    
    loader_path = os.path.join(BASE_DIR, "api", "load_songs.py")
    
    loader_code = """# 5 million songs loader module
import json
import os
import time
import random
from typing import List, Dict, Any, Optional

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "songs_index.json")
CACHE = {}

def get_all_songs(limit: int = 5000000, use_cache: bool = True):
    # Load all songs from chunked data files
    global CACHE
    
    if use_cache and "all_songs" in CACHE and len(CACHE["all_songs"]) >= limit:
        return CACHE["all_songs"][:limit]
    
    start_time = time.time()
    
    if not os.path.exists(INDEX_PATH):
        print("Error: songs_index.json not found!")
        return []
    
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        index_data = json.load(f)
    
    total_songs = index_data.get("total_songs", 0)
    batches = index_data.get("batches", [])
    actual_limit = min(total_songs, limit)
    
    songs = []
    songs_loaded = 0
    
    print(f"Found {total_songs:,} songs, loading {actual_limit:,} songs...")
    
    # Load batches sequentially (up to the active limit)
    for batch in batches:
        if songs_loaded >= actual_limit:
            break
        
        batch_path = os.path.join(BASE_DIR, batch["filename"])
        
        if not os.path.exists(batch_path):
            print(f"Warning: {batch_path} not found, skipping...")
            continue
        
        try:
            with open(batch_path, "r", encoding="utf-8") as f:
                batch_data = json.load(f)
                batch_songs = batch_data.get("songs", [])
                
                # Check remaining limit
                remaining = actual_limit - songs_loaded
                to_add = batch_songs[:remaining]
                songs.extend(to_add)
                songs_loaded += len(to_add)
                
                print(f"Loaded batch {batch['batch_id']}: {len(to_add)} songs. Total: {songs_loaded:,}/{actual_limit:,}")
                
        except Exception as e:
            print(f"Error loading {batch_path}: {e}")
    
    end_time = time.time()
    print(f"Data loading completed. Time: {end_time - start_time:.2f} seconds")
    
    # Cache (limited amount)
    if use_cache:
        cache_limit = min(100000, len(songs))  # Max 100k songs in cache
        CACHE["all_songs"] = songs[:cache_limit]
    
    return songs

def get_songs_by_mood(mood: str, limit: int = 100):
    # Get songs by mood
    all_songs = get_all_songs(limit=100000, use_cache=True)
    
    # Filter by mood
    mood_songs = [song for song in all_songs if song.get("mood", "").lower() == mood.lower()]
    
    # If not enough results, check tags
    if len(mood_songs) < limit:
        tag_matches = [
            song for song in all_songs 
            if song not in mood_songs and 
            any(tag.lower() == mood.lower() for tag in song.get("tags", []))
        ]
        mood_songs.extend(tag_matches[:limit - len(mood_songs)])
    
    # Randomize and apply limit
    random.shuffle(mood_songs)
    return mood_songs[:limit]

def get_songs_by_genre(genre: str, limit: int = 100):
    # Get songs by genre
    all_songs = get_all_songs(limit=100000, use_cache=True)
    
    # Filter by genre
    genre_songs = [
        song for song in all_songs 
        if song.get("genre", "").lower() == genre.lower()
    ]
    
    # If not enough results, check tags
    if len(genre_songs) < limit:
        tag_matches = [
            song for song in all_songs 
            if song not in genre_songs and 
            any(tag.lower() == genre.lower() for tag in song.get("tags", []))
        ]
        genre_songs.extend(tag_matches[:limit - len(genre_songs)])
    
    # Randomize and apply limit
    random.shuffle(genre_songs)
    return genre_songs[:limit]

def search_songs(query: str, limit: int = 100):
    # Search songs by title or artist
    all_songs = get_all_songs(limit=100000, use_cache=True)
    
    # Normalize query
    query_lower = query.lower()
    
    # Search
    matches = [
        song for song in all_songs
        if query_lower in song.get("title", "").lower() or 
           query_lower in song.get("artist", "").lower()
    ]
    
    # Randomize and apply limit
    random.shuffle(matches)
    return matches[:limit]

# Initialize module
print("Preparing song database module...")
"""
    
    with open(loader_path, "w", encoding="utf-8") as f:
        f.write(loader_code)
    
    print(f"API song loader module created: {loader_path}")
    return True

def create_integration_guide():
    # Create integration guide
    guide_path = os.path.join(BASE_DIR, "INTEGRATION_GUIDE.md")
    
    guide_content = """# 5 Million Songs Integration Guide

This guide explains how to integrate the 5 million songs dataset with your Music Assistant application.

## Dataset Structure

- **songs_index.json**: Contains the index of the entire dataset (5 million songs)
- **data/temp/songs_batch_*.json**: Songs in each batch (500,000 songs/batch)
- **api/load_songs.py**: Module created for API integration

## Steps for API Integration

1. **In main.py, add the following changes**:

```python
# Add at the beginning of the file:
from api.load_songs import get_all_songs, get_songs_by_mood, get_songs_by_genre, search_songs

# Change the get_songs function:
@app.get("/songs")
def get_songs(limit: int = 100000):
    return get_all_songs(limit=limit)
```

2. **Modify the Mood Recommendation function**:

```python
@app.get("/recommendations/mood/{mood}")
async def get_recommendations_by_mood(mood: str):
    # Keep existing mood values and other code
    # ...
    
    # Change the final part:
    mood_songs = get_songs_by_mood(mood, limit=20)
    
    return {"mood": mood, "recommendations": mood_songs}
```

3. **Modify the Search function**:

```python
@app.get("/search")
def search_songs_endpoint(q: str):
    results = search_songs(q, limit=50)
    return {"results": results}
```

## Performance and Memory Management

- The `get_all_songs()` function uses caching to reduce repeated file reading operations.
- The first request may be slow, but subsequent requests will be faster.
- By default, 100,000 songs are cached, enabling fast performance for common usage scenarios.

## Validation

To test the integration:

1. Open this URL in your browser: `http://localhost:8000/songs?limit=10`
2. You should see 10 songs.

## Important Considerations

- The dataset is very large, so loading all songs at once is not possible.
- Search and filtering operations use the first 100,000 songs cached in memory.
- You can adjust the number of songs or cache size as needed.
"""
    
    with open(guide_path, "w", encoding="utf-8") as f:
        f.write(guide_content)
    
    print(f"Integration guide created: {guide_path}")
    return True

def update_ai_dataset(batches):
    # Add sample songs to the AI dataset
    print("\nAdding song examples to the AI assistant dataset...")
    
    ai_dataset_path = os.path.join(BASE_DIR, "music_assistant_dataset.json")
    
    if not os.path.exists(ai_dataset_path):
        print("Warning: music_assistant_dataset.json not found!")
        return False
    
    # Load dataset
    with open(ai_dataset_path, "r", encoding="utf-8") as f:
        ai_dataset = json.load(f)
    
    # Load sample songs
    sample_songs = []
    for batch in batches[:1]:  # Just the first batch
        batch_path = os.path.join(BASE_DIR, batch["filename"])
        if os.path.exists(batch_path):
            with open(batch_path, "r", encoding="utf-8") as f:
                batch_data = json.load(f)
                sample_songs.extend(batch_data["songs"][:50])  # First 50 songs
    
    if not sample_songs:
        print("Warning: No sample songs found!")
        return False
    
    # Backup dataset
    backup_path = ai_dataset_path + ".backup"
    shutil.copy2(ai_dataset_path, backup_path)
    
    # Add sample songs
    mood_examples_updated = 0
    
    for part in ai_dataset:
        if part["type"] == "mood_based":
            for example in part["examples"]:
                if "response" in example and "Oneriler:" in example["response"]:
                    # Find mood/tag
                    mood = None
                    if "tags" in example and example["tags"]:
                        mood = example["tags"][0]
                    elif "intent" in example and example["intent"].startswith("mood_"):
                        mood = example["intent"].replace("mood_", "")
                    
                    if not mood:
                        continue
                        
                    # Filter songs by mood
                    mood_songs = [s for s in sample_songs if 
                                  s.get("mood") == mood or 
                                  mood in s.get("tags", [])]
                    
                    if not mood_songs and sample_songs:
                        mood_songs = random.sample(sample_songs, min(3, len(sample_songs)))
                    
                    # List up to 3 songs
                    if mood_songs:
                        songs_text = ", ".join([f"{s['title']} - {s['artist']}" for s in mood_songs[:3]])
                        example["response"] = f"Bu ruh haline uygun sarkilar buldum. Oneriler: {songs_text}"
                        mood_examples_updated += 1
    
    # Save updated dataset
    with open(ai_dataset_path, "w", encoding="utf-8") as f:
        json.dump(ai_dataset, f, ensure_ascii=False, indent=2)
    
    print(f"AI dataset updated: added songs to {mood_examples_updated} examples.")
    print(f"Original dataset backed up: {backup_path}")
    
    return True

if __name__ == "__main__":
    main()
