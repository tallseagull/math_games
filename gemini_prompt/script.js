let promptText = '';

// Load prompt from config.json
async function loadPrompt() {
    try {
        const response = await fetch('config.json');
        const data = await response.json();
        promptText = data.prompt;
    } catch (error) {
        console.error('Error loading prompt:', error);
        alert('Error loading prompt configuration');
    }
}

// Copy prompt to clipboard and redirect to Gemini
async function copyPromptAndOpen() {
    if (!promptText) {
        await loadPrompt();
    }
    
    try {
        // Copy to clipboard
        await navigator.clipboard.writeText(promptText);
        
        // Redirect to Gemini
        window.location.href = 'https://gemini.google.com';
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = promptText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            window.location.href = 'https://gemini.google.com';
        } catch (err) {
            alert('Failed to copy to clipboard. Please copy manually.');
        }
        document.body.removeChild(textArea);
    }
}

// Generate QR code for current page
function generateQRCode() {
    const currentUrl = window.location.href;
    
    QRCode.toCanvas(document.getElementById('qrCode'), currentUrl, {
        width: 256,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, function (error) {
        if (error) {
            console.error('Error generating QR code:', error);
            document.getElementById('qrCode').innerHTML = '<p>Error generating QR code</p>';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadPrompt();
    
    const button = document.getElementById('copyAndOpenButton');
    button.addEventListener('click', copyPromptAndOpen);
    
    generateQRCode();
});

