# 5 Million Songs Integration Guide

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
