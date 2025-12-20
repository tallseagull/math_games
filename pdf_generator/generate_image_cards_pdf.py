import os
from pathlib import Path
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


def generate_image_cards_pdf(images_dir="shared/static/images", output_file="image_cards.pdf"):
    """
    Generate a PDF with image cards arranged in a 4x6 grid for printing.
    
    Args:
        images_dir: Path to directory containing image files
        output_file: Output PDF filename
    """
    # A4 dimensions in cm
    A4_WIDTH = 21 * cm
    A4_HEIGHT = 29.7 * cm
    
    # Card dimensions
    CARD_SIZE = 4 * cm
    CARDS_PER_ROW = 4
    CARDS_PER_COL = 6
    CARDS_PER_PAGE = CARDS_PER_ROW * CARDS_PER_COL
    
    # Image area within card (with margins)
    IMAGE_MARGIN = 0.25 * cm
    IMAGE_SIZE = CARD_SIZE - (2 * IMAGE_MARGIN)
    
    # Calculate total grid dimensions
    GRID_WIDTH = CARDS_PER_ROW * CARD_SIZE
    GRID_HEIGHT = CARDS_PER_COL * CARD_SIZE
    
    # Calculate margins to center grid on page
    MARGIN_X = (A4_WIDTH - GRID_WIDTH) / 2
    MARGIN_Y = (A4_HEIGHT - GRID_HEIGHT) / 2
    
    # Get all image files
    images_path = Path(images_dir)
    if not images_path.exists():
        raise FileNotFoundError(f"Images directory not found: {images_dir}")
    
    image_files = sorted([f for f in images_path.glob("*.jpg")])
    
    if not image_files:
        raise ValueError(f"No .jpg files found in {images_dir}")
    
    print(f"Found {len(image_files)} images. Generating PDF...")
    
    # Create PDF canvas
    c = canvas.Canvas(output_file, pagesize=A4)
    
    # Process images in batches of CARDS_PER_PAGE
    for page_num, start_idx in enumerate(range(0, len(image_files), CARDS_PER_PAGE)):
        print(f"Processing page {page_num + 1}...")
        
        # Get images for this page
        page_images = image_files[start_idx:start_idx + CARDS_PER_PAGE]
        
        # Draw cutting lines first (so they're behind the images)
        draw_cutting_lines(c, MARGIN_X, MARGIN_Y, CARDS_PER_ROW, CARDS_PER_COL, CARD_SIZE)
        
        # Place images on grid
        for idx, image_file in enumerate(page_images):
            row = idx // CARDS_PER_ROW
            col = idx % CARDS_PER_ROW
            
            # Calculate card position (reportlab uses bottom-left origin)
            x = MARGIN_X + (col * CARD_SIZE)
            y = MARGIN_Y + ((CARDS_PER_COL - row - 1) * CARD_SIZE)
            
            # Load and process image
            try:
                img = Image.open(image_file)
                
                # Convert to RGB if needed
                if img.mode != "RGB":
                    img = img.convert("RGB")
                
                # Resize image to fit within card (maintaining aspect ratio)
                img.thumbnail((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.LANCZOS)
                
                # Calculate position to center image in card
                img_width, img_height = img.size
                img_x = x + IMAGE_MARGIN + (IMAGE_SIZE - img_width) / 2
                img_y = y + IMAGE_MARGIN + (IMAGE_SIZE - img_height) / 2
                
                # Draw image
                c.drawImage(ImageReader(img), img_x, img_y, width=img_width, height=img_height)
                
            except Exception as e:
                print(f"  Warning: Could not process {image_file.name}: {e}")
                # Draw placeholder rectangle
                c.setStrokeColorRGB(0.8, 0.8, 0.8)
                c.setFillColorRGB(0.95, 0.95, 0.95)
                c.rect(x + IMAGE_MARGIN, y + IMAGE_MARGIN, IMAGE_SIZE, IMAGE_SIZE, fill=1, stroke=1)
        
        # Start new page if there are more images
        if start_idx + CARDS_PER_PAGE < len(image_files):
            c.showPage()
    
    # Save PDF
    c.save()
    print(f"\nPDF generated successfully: {output_file}")
    print(f"Total pages: {(len(image_files) + CARDS_PER_PAGE - 1) // CARDS_PER_PAGE}")


def draw_cutting_lines(canvas_obj, start_x, start_y, cols, rows, card_size):
    """
    Draw cutting lines between cards.
    
    Args:
        canvas_obj: reportlab canvas object
        start_x: X position of grid start
        start_y: Y position of grid start
        cols: Number of columns
        rows: Number of rows
        card_size: Size of each card
    """
    canvas_obj.setStrokeColorRGB(0.5, 0.5, 0.5)  # Gray lines
    canvas_obj.setLineWidth(0.5)
    
    # Draw vertical lines (between columns)
    for col in range(1, cols):
        x = start_x + (col * card_size)
        y_start = start_y
        y_end = start_y + (rows * card_size)
        canvas_obj.line(x, y_start, x, y_end)
    
    # Draw horizontal lines (between rows)
    for row in range(1, rows):
        y = start_y + (row * card_size)
        x_start = start_x
        x_end = start_x + (cols * card_size)
        canvas_obj.line(x_start, y, x_end, y)
    
    # Draw outer border
    canvas_obj.setStrokeColorRGB(0, 0, 0)  # Black border
    canvas_obj.setLineWidth(1)
    canvas_obj.rect(start_x, start_y, cols * card_size, rows * card_size, fill=0, stroke=1)


if __name__ == "__main__":
    import sys
    
    # Get script directory for default output location
    script_dir = Path(__file__).parent
    
    # Allow custom paths via command line
    images_dir = sys.argv[1] if len(sys.argv) > 1 else "shared/static/images"
    output_file = sys.argv[2] if len(sys.argv) > 2 else str(script_dir / "image_cards.pdf")
    
    try:
        generate_image_cards_pdf(images_dir, output_file)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

