import streamlit as st
import os
import json
import shutil
import tempfile
import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from pdf_utils import process_pdf_images
from audio_utils import create_audio_files


# Set page config
st.set_page_config(page_title="PDF Word Processor", layout="wide")

# Initialize session state
if 'processed_data' not in st.session_state:
    st.session_state.processed_data = None
if 'accepted_words' not in st.session_state:
    st.session_state.accepted_words = []
if 'temp_dir' not in st.session_state:
    st.session_state.temp_dir = None


def sanitize_filename(word: str) -> str:
    """Sanitize word to create a valid filename."""
    safe = "".join(c for c in word if c.isalnum() or c in (' ', '-', '_')).rstrip()
    return safe.replace(' ', '_')


def get_project_root():
    """Get the project root directory (two levels up from this file)."""
    return Path(__file__).parent.parent


def load_json_file(filepath: str) -> dict:
    """Load a JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json_file(filepath: str, data: dict):
    """Save data to a JSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


st.title("PDF Word Processor")
st.markdown("Upload a PDF and provide words to generate images and audio files.")

# Main processing interface
with st.form("pdf_upload_form"):
    uploaded_pdf = st.file_uploader("Upload PDF File", type=['pdf'])
    words_input = st.text_input(
        "Enter words (comma-separated, one word per page)",
        placeholder="word1, word2, word3, ..."
    )
    process_button = st.form_submit_button("Process PDF")

    if process_button:
        if uploaded_pdf is None:
            st.error("Please upload a PDF file.")
        elif not words_input.strip():
            st.error("Please enter a list of words.")
        else:
            # Parse words
            words = [w.strip() for w in words_input.split(',') if w.strip()]
            
            # Create temporary directory
            temp_dir = tempfile.mkdtemp()
            st.session_state.temp_dir = temp_dir
            
            # Save uploaded PDF to temp directory
            pdf_path = os.path.join(temp_dir, "input.pdf")
            with open(pdf_path, "wb") as f:
                f.write(uploaded_pdf.getbuffer())
            
            # Count pages in PDF
            import fitz
            doc = fitz.open(pdf_path)
            page_count = len(doc)
            doc.close()
            
            if len(words) != page_count:
                st.error(f"Word count ({len(words)}) doesn't match page count ({page_count}). Please provide exactly {page_count} words.")
            else:
                with st.spinner("Processing PDF pages..."):
                    # Process images
                    images_dir = os.path.join(temp_dir, "images")
                    process_pdf_images(pdf_path, images_dir, target_width=200, words_list=words)
                
                with st.spinner("Generating audio files..."):
                    # Generate audio
                    audio_dir = os.path.join(temp_dir, "audio")
                    create_audio_files(words, language='en', output_dir=audio_dir)
                
                # Store processed data
                st.session_state.processed_data = {
                    'words': words,
                    'images_dir': images_dir,
                    'audio_dir': audio_dir
                }
                
                st.success(f"Processed {len(words)} pages successfully!")
                st.rerun()

# Review interface
if st.session_state.processed_data:
    st.header("Review Words")
    st.markdown("Review each word, image, and audio. Check the boxes for words you want to add to the repository.")
    
    words = st.session_state.processed_data['words']
    images_dir = st.session_state.processed_data['images_dir']
    audio_dir = st.session_state.processed_data['audio_dir']
    
    # Initialize accepted words in session state if not present
    if 'word_acceptance' not in st.session_state:
        st.session_state.word_acceptance = {word: False for word in words}
    
    # Display words in a scrollable container with 2-column layout
    with st.container():
        for idx, word in enumerate(words):
            with st.expander(f"Word {idx + 1}: {word}", expanded=True):
                col1, col2 = st.columns([1, 1])
                
                with col1:
                    # Checkbox for acceptance
                    accepted = st.checkbox(
                        f"Accept '{word}'",
                        value=st.session_state.word_acceptance.get(word, False),
                        key=f"accept_{idx}"
                    )
                    st.session_state.word_acceptance[word] = accepted
                    
                    # Display image (smaller size - max width 200px)
                    image_filename = sanitize_filename(word) + ".jpg"
                    image_path = os.path.join(images_dir, image_filename)
                    if os.path.exists(image_path):
                        st.image(image_path, caption=word, width=200)
                    else:
                        st.warning(f"Image not found: {image_filename}")
                
                with col2:
                    # Display audio player
                    audio_filename = sanitize_filename(word) + ".mp3"
                    audio_path = os.path.join(audio_dir, audio_filename)
                    if os.path.exists(audio_path):
                        with open(audio_path, "rb") as audio_file:
                            audio_bytes = audio_file.read()
                        st.audio(audio_bytes, format='audio/mp3')
                    else:
                        st.warning(f"Audio not found: {audio_filename}")
    
    # Save button - saves images and audio immediately (overwrites existing files)
    accepted_words = [word for word, accepted in st.session_state.word_acceptance.items() if accepted]
    
    if accepted_words:
        st.info(f"{len(accepted_words)} word(s) selected.")
        
        # Save button that immediately saves images and audio to shared/static directories
        if st.button("💾 Save Images & Audio", type="primary", use_container_width=True):
            with st.spinner("Saving images and audio files..."):
                project_root = get_project_root()
                shared_images_dir = project_root / "shared" / "static" / "images"
                shared_audio_dir = project_root / "shared" / "static" / "audio"
                
                # Log the save paths
                st.info(f"📁 **Save Paths:**\n- Images: `{shared_images_dir}`\n- Audio: `{shared_audio_dir}`")
                
                shared_images_dir.mkdir(parents=True, exist_ok=True)
                shared_audio_dir.mkdir(parents=True, exist_ok=True)
                
                saved_images = 0
                saved_audio = 0
                log_messages = []
                
                for word in accepted_words:
                    # Copy image (overwrites if exists)
                    image_filename = sanitize_filename(word) + ".jpg"
                    src_image = os.path.join(images_dir, image_filename)
                    dst_image = shared_images_dir / image_filename
                    
                    if os.path.exists(src_image):
                        src_size = os.path.getsize(src_image)
                        existed_before = dst_image.exists()
                        if existed_before:
                            old_size = os.path.getsize(dst_image)
                        
                        try:
                            shutil.copy2(src_image, dst_image)
                            dst_size = os.path.getsize(dst_image)
                            saved_images += 1
                            
                            status = "✅ OVERWRITTEN" if existed_before else "✅ CREATED"
                            log_msg = f"{status} Image: `{image_filename}`"
                            if existed_before:
                                log_msg += f" (old: {old_size} bytes → new: {dst_size} bytes)"
                            else:
                                log_msg += f" ({dst_size} bytes)"
                            log_messages.append(log_msg)
                        except Exception as e:
                            log_messages.append(f"❌ ERROR saving image `{image_filename}`: {e}")
                    else:
                        log_messages.append(f"⚠️ Source image not found: `{src_image}`")
                    
                    # Copy audio (overwrites if exists)
                    audio_filename = sanitize_filename(word) + ".mp3"
                    src_audio = os.path.join(audio_dir, audio_filename)
                    dst_audio = shared_audio_dir / audio_filename
                    
                    if os.path.exists(src_audio):
                        src_size = os.path.getsize(src_audio)
                        existed_before = dst_audio.exists()
                        if existed_before:
                            old_size = os.path.getsize(dst_audio)
                        
                        try:
                            shutil.copy2(src_audio, dst_audio)
                            dst_size = os.path.getsize(dst_audio)
                            saved_audio += 1
                            
                            status = "✅ OVERWRITTEN" if existed_before else "✅ CREATED"
                            log_msg = f"{status} Audio: `{audio_filename}`"
                            if existed_before:
                                log_msg += f" (old: {old_size} bytes → new: {dst_size} bytes)"
                            else:
                                log_msg += f" ({dst_size} bytes)"
                            log_messages.append(log_msg)
                        except Exception as e:
                            log_messages.append(f"❌ ERROR saving audio `{audio_filename}`: {e}")
                    else:
                        log_messages.append(f"⚠️ Source audio not found: `{src_audio}`")
                
                # Display detailed log
                with st.expander("📋 Detailed Save Log", expanded=True):
                    for msg in log_messages:
                        st.text(msg)
                
                st.success(f"✅ Saved {saved_images} image(s) and {saved_audio} audio file(s) to:\n- `{shared_images_dir}`\n- `{shared_audio_dir}`")
                
                # Store accepted words for JSON update step
                st.session_state.accepted_words = accepted_words
                st.rerun()
    else:
        st.info("Select words using the checkboxes above, then click 'Save Images & Audio' to save them to the repository.")

# JSON update interface
if st.session_state.accepted_words:
    st.header("Configure JSON File Updates")
    st.markdown("Select where to add the accepted words in the JSON files.")
    
    accepted_words = st.session_state.accepted_words
    project_root = get_project_root()
    
    # Target apps selection
    target_apps = st.multiselect(
        "Select target apps:",
        ["Audio Match", "Image Grid", "Connect4"],
        default=[]
    )
    
    json_updates = {}
    
    if "Audio Match" in target_apps:
        st.subheader("Audio Match Configuration")
        audio_match_group = st.selectbox(
            "Select group:",
            ["Partani", "Gimel", "numbers", "colors", "people"],
            key="audio_match_group"
        )
        json_updates['audio_match'] = {
            'file': project_root / "audio_match" / "words.json",
            'group': audio_match_group
        }
    
    if "Image Grid" in target_apps:
        st.subheader("Image Grid Configuration")
        image_grid_group = st.selectbox(
            "Select group:",
            ["Partani", "Gimel"],
            key="image_grid_group"
        )
        json_updates['image_grid'] = {
            'file': project_root / "image_grid" / "images.json",
            'group': image_grid_group
        }
    
    if "Connect4" in target_apps:
        st.subheader("Connect4 Configuration")
        connect4_group = st.selectbox(
            "Select group:",
            ["Gimel"],
            key="connect4_group"
        )
        json_updates['connect4'] = {
            'file': project_root / "connect4_words" / "images.json",
            'group': connect4_group
        }
    
    if json_updates and st.button("💾 Apply Updates to JSON Files", type="primary", use_container_width=True):
        with st.spinner("Updating JSON files..."):
            # Ensure images and audio are saved (in case user skipped the Save button)
            if st.session_state.processed_data:
                shared_images_dir = project_root / "shared" / "static" / "images"
                shared_audio_dir = project_root / "shared" / "static" / "audio"
                
                shared_images_dir.mkdir(parents=True, exist_ok=True)
                shared_audio_dir.mkdir(parents=True, exist_ok=True)
                
                images_dir = st.session_state.processed_data['images_dir']
                audio_dir = st.session_state.processed_data['audio_dir']
                
                log_messages = []
                for word in accepted_words:
                    # Copy image (overwrites if exists)
                    image_filename = sanitize_filename(word) + ".jpg"
                    src_image = os.path.join(images_dir, image_filename)
                    dst_image = shared_images_dir / image_filename
                    if os.path.exists(src_image):
                        existed_before = dst_image.exists()
                        shutil.copy2(src_image, dst_image)
                        status = "OVERWRITTEN" if existed_before else "CREATED"
                        log_messages.append(f"Image `{image_filename}`: {status}")
                    else:
                        log_messages.append(f"⚠️ Source image not found: `{src_image}`")
                    
                    # Copy audio (overwrites if exists)
                    audio_filename = sanitize_filename(word) + ".mp3"
                    src_audio = os.path.join(audio_dir, audio_filename)
                    dst_audio = shared_audio_dir / audio_filename
                    if os.path.exists(src_audio):
                        existed_before = dst_audio.exists()
                        shutil.copy2(src_audio, dst_audio)
                        status = "OVERWRITTEN" if existed_before else "CREATED"
                        log_messages.append(f"Audio `{audio_filename}`: {status}")
                    else:
                        log_messages.append(f"⚠️ Source audio not found: `{src_audio}`")
                
                if log_messages:
                    st.info(f"Files saved to:\n- Images: `{shared_images_dir}`\n- Audio: `{shared_audio_dir}`")
            
            # Update JSON files
            for app_name, config in json_updates.items():
                filepath = config['file']
                group = config['group']
                
                if not filepath.exists():
                    st.error(f"JSON file not found: {filepath}")
                    continue
                
                data = load_json_file(str(filepath))
                
                if app_name == 'audio_match':
                    # Add as {"word": "...", "weight": 1}
                    if group not in data:
                        data[group] = []
                    for word in accepted_words:
                        # Check if word already exists
                        if not any(item.get('word') == word for item in data[group]):
                            data[group].append({"word": word, "weight": 1})
                else:
                    # Add as string to array
                    if group not in data:
                        data[group] = []
                    for word in accepted_words:
                        if word not in data[group]:
                            data[group].append(word)
                
                save_json_file(str(filepath), data)
                st.success(f"Updated {app_name} - {group}")
            
            st.success("All updates completed successfully!")
            
            # Clear session state
            st.session_state.processed_data = None
            st.session_state.accepted_words = []
            st.session_state.word_acceptance = {}
            
            # Clean up temp directory
            if st.session_state.temp_dir and os.path.exists(st.session_state.temp_dir):
                shutil.rmtree(st.session_state.temp_dir)
                st.session_state.temp_dir = None
            
            st.rerun()

