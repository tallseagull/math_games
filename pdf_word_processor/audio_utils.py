from gtts import gTTS
import os


def create_audio_files(words: list, language: str = 'en', output_dir: str = 'audio_words'):
    """
    Creates an audio file for each word in a list using gTTS.

    Args:
        words: A list of strings (words) to convert to speech.
        language: The language of the words (default is 'en' for English).
        output_dir: The directory where the audio files will be saved.

    Returns:
        dict: A dictionary mapping words to their output file paths.
    """
    # Create the output directory if it doesn't already exist.
    # The 'exist_ok=True' prevents an error if the folder is already there.
    os.makedirs(output_dir, exist_ok=True)
    print(f"Audio files will be saved in the '{output_dir}' folder.")

    result_paths = {}
    
    # Loop through each word in the provided list.
    for word in words:
        # Sanitize the word to create a valid filename.
        # This replaces spaces with underscores and removes characters that are not
        # alphanumeric. You can adjust this as needed.
        safe_filename = "".join(c for c in word if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_filename = safe_filename.replace(' ', '_') + ".mp3"
        
        output_path = os.path.join(output_dir, safe_filename)
        result_paths[word] = output_path
        
        # Always create/overwrite the file (allows fixing bad files)
        try:
            # Create the gTTS object with the word and language.
            tts = gTTS(text=word, lang=language)
            
            # Save the audio file (will overwrite if exists).
            tts.save(output_path)
            
            if os.path.exists(output_path):
                print(f"Successfully created/updated audio for '{word}' -> {output_path}")
            else:
                print(f"Created audio for '{word}' -> {output_path}")
        
        except Exception as e:
            print(f"Could not create audio for '{word}'. Error: {e}")
            result_paths[word] = None
    
    return result_paths

