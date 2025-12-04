import streamlit as st
import os
import shutil
from pathlib import Path
import sys

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from audio_utils import create_audio_files


# Set page config
st.set_page_config(page_title="Review Static Media", layout="wide")


def get_project_root():
    """Get the project root directory (two levels up from this file)."""
    return Path(__file__).parent.parent


def sanitize_filename(word: str) -> str:
    """Sanitize word to create a valid filename."""
    safe = "".join(c for c in word if c.isalnum() or c in (' ', '-', '_')).rstrip()
    return safe.replace(' ', '_')


def get_image_audio_pairs():
    """Get all image/audio pairs from shared/static directories."""
    project_root = get_project_root()
    images_dir = project_root / "shared" / "static" / "images"
    audio_dir = project_root / "shared" / "static" / "audio"
    
    pairs = []
    
    if not images_dir.exists() or not audio_dir.exists():
        return pairs
    
    # Get all image files
    image_files = list(images_dir.glob("*.jpg"))
    
    for image_file in image_files:
        # Get base name without extension
        base_name = image_file.stem
        
        # Check if corresponding audio exists
        audio_file = audio_dir / f"{base_name}.mp3"
        
        if audio_file.exists():
            pairs.append({
                'name': base_name,
                'image_path': image_file,
                'audio_path': audio_file
            })
    
    # Sort by name for consistent ordering
    pairs.sort(key=lambda x: x['name'])
    
    return pairs


def rename_file(old_path: Path, new_name: str, extension: str) -> Path:
    """Rename a file to a new name with the given extension."""
    new_path = old_path.parent / f"{new_name}.{extension}"
    if old_path.exists():
        shutil.move(str(old_path), str(new_path))
    return new_path


# Initialize session state
if 'pairs' not in st.session_state:
    st.session_state.pairs = get_image_audio_pairs()

if 'mismatches' not in st.session_state:
    st.session_state.mismatches = {}

if 'current_page' not in st.session_state:
    st.session_state.current_page = 0

if 'editing_item' not in st.session_state:
    st.session_state.editing_item = None


st.title("Review Static Audio & Image Matching")
st.markdown("Review image and audio pairs. Mark mismatches and fix them.")

# Get all pairs
pairs = st.session_state.pairs
total_items = len(pairs)
items_per_page = 20
total_pages = (total_items + items_per_page - 1) // items_per_page if total_items > 0 else 1

if total_items == 0:
    st.warning("No image/audio pairs found in shared/static directories.")
    st.stop()

# Pagination controls
col1, col2, col3, col4 = st.columns([1, 1, 2, 1])
with col1:
    if st.button("◀ Previous", disabled=st.session_state.current_page == 0):
        st.session_state.current_page = max(0, st.session_state.current_page - 1)
        st.rerun()

with col2:
    if st.button("Next ▶", disabled=st.session_state.current_page >= total_pages - 1):
        st.session_state.current_page = min(total_pages - 1, st.session_state.current_page + 1)
        st.rerun()

with col3:
    st.markdown(f"**Page {st.session_state.current_page + 1} of {total_pages}** ({total_items} total items)")

with col4:
    if st.button("🔄 Refresh List"):
        st.session_state.pairs = get_image_audio_pairs()
        st.rerun()

# Calculate page range
start_idx = st.session_state.current_page * items_per_page
end_idx = min(start_idx + items_per_page, total_items)
page_pairs = pairs[start_idx:end_idx]

# Display items on current page
st.divider()

for idx, pair in enumerate(page_pairs):
    global_idx = start_idx + idx
    item_key = f"item_{global_idx}"
    name = pair['name']
    image_path = pair['image_path']
    audio_path = pair['audio_path']
    
    # Check if this item is being edited
    is_editing = st.session_state.editing_item == global_idx
    is_mismatch = st.session_state.mismatches.get(global_idx, False)
    
    with st.container():
        col1, col2, col3 = st.columns([2, 2, 1])
        
        with col1:
            st.subheader(f"{global_idx + 1}. {name}")
            if os.path.exists(image_path):
                st.image(str(image_path), caption=name, width=200)
            else:
                st.error(f"Image not found: {image_path}")
        
        with col2:
            st.markdown("### Audio")
            if os.path.exists(audio_path):
                with open(audio_path, "rb") as audio_file:
                    audio_bytes = audio_file.read()
                st.audio(audio_bytes, format='audio/mp3')
            else:
                st.error(f"Audio not found: {audio_path}")
        
        with col3:
            # Mismatch checkbox
            mismatch = st.checkbox(
                "Mark as Mismatch",
                value=is_mismatch,
                key=f"mismatch_{global_idx}"
            )
            
            if mismatch != is_mismatch:
                st.session_state.mismatches[global_idx] = mismatch
                if mismatch:
                    st.session_state.editing_item = global_idx
                else:
                    if st.session_state.editing_item == global_idx:
                        st.session_state.editing_item = None
                st.rerun()
            
            # Show edit options if marked as mismatch
            if mismatch:
                st.markdown("---")
                st.markdown("**Fix Options:**")
                
                option = st.radio(
                    "Choose fix option:",
                    ["Change Name", "Recreate Audio"],
                    key=f"option_{global_idx}",
                    index=0 if not is_editing else None
                )
                
                if option == "Change Name":
                    new_name = st.text_input(
                        "Enter new word name:",
                        value=name if not is_editing else "",
                        key=f"new_name_{global_idx}",
                        placeholder="Enter word..."
                    )
                    
                    if st.button("Apply Change", key=f"apply_change_{global_idx}"):
                        if new_name and new_name.strip():
                            new_name_clean = sanitize_filename(new_name.strip())
                            
                            if new_name_clean != name:
                                project_root = get_project_root()
                                images_dir = project_root / "shared" / "static" / "images"
                                audio_dir = project_root / "shared" / "static" / "audio"
                                
                                # Check if new name already exists
                                new_image_path = images_dir / f"{new_name_clean}.jpg"
                                new_audio_path = audio_dir / f"{new_name_clean}.mp3"
                                
                                if new_image_path.exists() or new_audio_path.exists():
                                    st.warning(f"⚠️ Files with name '{new_name_clean}' already exist. Please choose a different name.")
                                else:
                                    with st.spinner("Renaming files and creating new audio..."):
                                        try:
                                            # Rename image
                                            old_image_path = images_dir / f"{name}.jpg"
                                            
                                            if old_image_path.exists():
                                                shutil.move(str(old_image_path), str(new_image_path))
                                            else:
                                                st.warning(f"Original image not found: {old_image_path}")
                                            
                                            # Create new audio file
                                            create_audio_files(
                                                [new_name.strip()],
                                                language='en',
                                                output_dir=str(audio_dir)
                                            )
                                            
                                            # Verify new audio was created
                                            if not new_audio_path.exists():
                                                st.error("Failed to create new audio file.")
                                                # Try to restore image if audio creation failed
                                                if new_image_path.exists() and not old_image_path.exists():
                                                    shutil.move(str(new_image_path), str(old_image_path))
                                                st.stop()
                                            
                                            # Remove old audio if it exists and has different name
                                            old_audio_path = audio_dir / f"{name}.mp3"
                                            if old_audio_path.exists() and old_audio_path != new_audio_path:
                                                old_audio_path.unlink()
                                            
                                            st.success(f"✅ Renamed to '{new_name_clean}' and created new audio!")
                                            
                                            # Update session state
                                            st.session_state.mismatches[global_idx] = False
                                            st.session_state.editing_item = None
                                            
                                            # Refresh pairs list
                                            st.session_state.pairs = get_image_audio_pairs()
                                            
                                            st.rerun()
                                            
                                        except Exception as e:
                                            st.error(f"Error: {e}")
                            else:
                                st.warning("New name must be different from current name.")
                        else:
                            st.warning("Please enter a valid word name.")
                
                elif option == "Recreate Audio":
                    st.info(f"Will recreate audio for: **{name}**")
                    
                    if st.button("Recreate Audio", key=f"recreate_{global_idx}"):
                        project_root = get_project_root()
                        audio_dir = project_root / "shared" / "static" / "audio"
                        
                        with st.spinner("Recreating audio file..."):
                            try:
                                # Recreate audio using the original name
                                create_audio_files(
                                    [name],
                                    language='en',
                                    output_dir=str(audio_dir)
                                )
                                
                                st.success(f"✅ Audio recreated for '{name}'!")
                                
                                # Update session state
                                st.session_state.mismatches[global_idx] = False
                                st.session_state.editing_item = None
                                
                                st.rerun()
                                
                            except Exception as e:
                                st.error(f"Error: {e}")
        
        st.divider()

# Summary
if st.session_state.mismatches:
    mismatch_count = sum(1 for v in st.session_state.mismatches.values() if v)
    st.info(f"📊 {mismatch_count} item(s) marked as mismatch")

