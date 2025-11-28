import fitz  # PyMuPDF
import os
import io
from PIL import Image, ImageChops


def crop_white_border(img: Image.Image) -> Image.Image:
    """
    Crops the white border from a PIL Image.

    Args:
        img: The image to crop.

    Returns:
        The cropped image.
    """
    # Create a background of the same size as the image, filled with the color
    # of the top-left pixel (which we assume is the border color).
    bg = Image.new(img.mode, img.size, img.getpixel((0, 0)))
    
    # Find the difference between the image and the solid background.
    # Non-border areas will be black.
    diff = ImageChops.difference(img, bg)
    
    # Get the bounding box of the non-black (i.e., non-border) regions.
    bbox = diff.getbbox()
    
    # If a bounding box is found, crop the original image to that box.
    if bbox:
        return img.crop(bbox)
    else:
        # If there's no difference, the image is a solid color; return as is.
        return img


def process_pdf_images(pdf_path: str, output_dir: str, target_width: int = 200, words_list: list[str] = None):
    """
    Extracts page snapshots from each page of a PDF, crops the white border, resizes,
    and saves them as JPEGs.

    Args:
        pdf_path: The file path to the input PDF.
        output_dir: The directory where processed images will be saved.
        target_width: The desired width of the output images in pixels.
        words_list: Optional list of words corresponding to each page (one word per page).
    """
    print(f"Starting to process PDF: {pdf_path}")
    
    # Create the output directory if it doesn't already exist.
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")

    try:
        # Open the PDF file.
        doc = fitz.open(pdf_path)
        
        # Loop through each page of the PDF.
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            print(f"Processing page {page_num + 1}...")
            
            # Render the page as a pixmap at 150 DPI
            # 150/72 converts DPI to the matrix scale factor (72 is the default DPI)
            matrix = fitz.Matrix(150/72, 150/72)
            pix = page.get_pixmap(matrix=matrix)
            
            # Convert pixmap to PIL Image
            img_data = pix.tobytes("ppm")
            pil_image = Image.open(io.BytesIO(img_data))
            
            # Convert to RGB if needed (pixmaps are typically RGB)
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")
            
            # Crop the white border
            cropped_image = crop_white_border(pil_image)
            
            # Resize the image to the target width, maintaining aspect ratio
            width, height = cropped_image.size
            aspect_ratio = height / width
            new_height = int(target_width * aspect_ratio)
            resized_image = cropped_image.resize((target_width, new_height), Image.Resampling.LANCZOS)
            
            # Save the final image as a JPEG
            if words_list and page_num < len(words_list):
                # Sanitize the word to create a valid filename
                word = words_list[page_num]
                safe_filename = "".join(c for c in word if c.isalnum() or c in (' ', '-', '_')).rstrip()
                safe_filename = safe_filename.replace(' ', '_') + ".jpg"
            else:
                safe_filename = f"page_{page_num + 1}.jpg"
            
            output_path = os.path.join(output_dir, safe_filename)
            resized_image.save(output_path, "JPEG")
            print(f"  - Saved processed image to: {output_path}")

        doc.close()
        print("\nProcessing complete! ✨")
        
    except Exception as e:
        print(f"An error occurred: {e}")
        raise

