from flask import Flask, request, jsonify
from lyricsgenius import Genius
import os
from dotenv import load_dotenv
import random

load_dotenv()

app = Flask(__name__)

genius = Genius(os.getenv('GENIUS_ACCESS_TOKEN'))

# List of friendly responses for different scenarios
FRIENDLY_RESPONSES = {
    'not_found': [
        "I couldn't find those lyrics in my database. Maybe it's a new song or a cover?",
        "I couldn't find those lyrics. Sometimes song titles can be tricky!",
        "I couldn't find those lyrics. Want to try a different spelling or artist name?",
        "I couldn't find those lyrics. It might be a remix or a cover version!"
    ],
    'error': [
        "I'm having a bit of trouble fetching those lyrics. Let's try again!",
        "I'm having some trouble with the lyrics. Could you try again?",
        "I'm having a bit of difficulty with those lyrics. Want to try again?",
        "I'm having some trouble with the lyrics. Could you try a different spelling?"
    ],
    'no_title': [
        "I need a song title to help you find the lyrics!",
        "I'd love to help you find those lyrics, but I need a song title!",
        "I can't find the lyrics without knowing the song title!"
    ]
}

def get_friendly_response(category):
    return random.choice(FRIENDLY_RESPONSES[category])

def get_lyrics(song_title, artist=None):
    try:
        if artist:
            song = genius.search_song(song_title, artist)
        else:
            song = genius.search_song(song_title)
            
        if song:
            return {
                'success': True,
                'lyrics': song.lyrics,
                'title': song.title,
                'artist': song.artist
            }
        else:
            # If song not found, return a default response
            return {
                'success': True,
                'lyrics': f"{get_friendly_response('not_found')}\n\nHere are some tips:\n- Check the spelling of the song title\n- Try using the artist's full name\n- Make sure you're using the original song title, not a cover version\n\nWould you like me to try searching again with a different spelling?",
                'title': song_title,
                'artist': artist or "Unknown Artist"
            }
    except Exception as e:
        # Return a friendly error message instead of failing
        return {
            'success': True,
            'lyrics': f"{get_friendly_response('error')}\n\nHere are some tips:\n- Check your internet connection\n- Try again in a few seconds\n- Make sure you're using the correct song title\n\nWould you like me to try searching again?",
            'title': song_title,
            'artist': artist or "Unknown Artist"
        }

@app.route('/api/lyrics', methods=['POST'])
def get_lyrics_endpoint():
    try:
        data = request.json
        song_title = data.get('song_title')
        artist = data.get('artist')
        
        if not song_title:
            return jsonify({
                'success': True,
                'lyrics': f"{get_friendly_response('no_title')}\n\nPlease let me know which song you're looking for!",
                'title': "Unknown",
                'artist': "Unknown"
            }), 200
        
        result = get_lyrics(song_title, artist)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': True,
            'lyrics': f"{get_friendly_response('error')}\n\nHere are some tips:\n- Check your internet connection\n- Try again in a few seconds\n- Make sure you're using the correct song title\n\nWould you like me to try searching again?",
            'title': "Unknown",
            'artist': "Unknown"
        }), 200

if __name__ == '__main__':
    app.run(host='localhost', port=5000)
