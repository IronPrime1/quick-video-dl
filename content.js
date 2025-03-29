
// Configuration for API calls
const API_KEY = '3deef0916cmsh423d0553428cb64p192eecjsn50033a14e3fc';
const API_HOST = 'youtube-video-fast-downloader-24-7.p.rapidapi.com';
const PREFERRED_QUALITIES = ['137', '248', '136', '135']; // In order of preference
const RETRY_DELAY = 3000; // Retry after 3 seconds if file not ready
const MAX_RETRIES = 10; // Maximum number of retries to download

// Main initialization function
function init() {
  // Only run on watch pages
  if (!window.location.href.includes('youtube.com/watch')) return;
  
  // Add download button as soon as possible
  replaceDownloadButton();
  
  // Use MutationObserver to detect SPA navigation and UI changes
  const observer = new MutationObserver((mutations) => {
    if (window.location.href.includes('youtube.com/watch')) {
      // Check if our button exists, if not try to replace YouTube's button
      const existingButton = document.getElementById('yt-downloader-btn');
      
      // Check if the video ID changed (SPA navigation)
      const currentUrl = new URL(window.location.href);
      const videoId = currentUrl.searchParams.get('v');
      
      if (!existingButton) {
        replaceDownloadButton();
      } else if (existingButton.dataset.videoId !== videoId) {
        // If button exists but video ID changed, update the button's data-video-id
        existingButton.dataset.videoId = videoId;
      }
    }
  });
  
  // Start observing changes to detect SPA navigation and UI changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Also observe URL changes (for SPA navigation)
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (window.location.href.includes('youtube.com/watch')) {
        setTimeout(() => {
          replaceDownloadButton();
        }, 300); // Small delay to ensure YouTube's UI is loaded
      }
    }
  });
  
  // Make sure document exists before observing
  if (document && document.body) {
    urlObserver.observe(document, { subtree: true, childList: true });
  }
}

// Function to find and replace YouTube's native download button
function replaceDownloadButton() {
  const currentUrl = new URL(window.location.href);
  const videoId = currentUrl.searchParams.get('v');
  
  if (!videoId) return;
  
  // Check if our button already exists with the correct video ID
  const existingButton = document.getElementById('yt-downloader-btn');
  if (existingButton && existingButton.dataset.videoId === videoId) return;
  
  // Try to find YouTube's native download button
  const youtubeButtons = document.querySelectorAll('.yt-spec-button-shape-next--tonal');
  
  let youtubeDownloadBtn = null;
  for (const btn of youtubeButtons) {
    // Find the download button by checking its content
    if (btn.textContent.includes('Download')) {
      youtubeDownloadBtn = btn;
      break;
    }
  }
  
  if (youtubeDownloadBtn) {
    // Create our download button with YouTube's button styling
    const ourButton = document.createElement('button');
    ourButton.id = 'yt-downloader-btn';
    ourButton.dataset.videoId = videoId;
    ourButton.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-downloader-btn';
    ourButton.innerHTML = '<span class="yt-downloader-icon">↓</span> Download';
    ourButton.title = 'Download this video';
    
    // Add click event
    ourButton.addEventListener('click', handleDownloadClick);
    
    // Replace YouTube's button with our button
    youtubeDownloadBtn.parentNode.replaceChild(ourButton, youtubeDownloadBtn);
    return;
  }
  
  // If YouTube's button not found yet, try to find the menu container
  const actionBar = document.querySelector('#actions-inner, #menu-container, ytd-menu-renderer');
  
  if (actionBar) {
    // Check if button already exists but needs update
    if (existingButton) {
      existingButton.dataset.videoId = videoId;
      return;
    }
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'yt-downloader-container';
    
    // Create download button
    const downloadButton = document.createElement('button');
    downloadButton.id = 'yt-downloader-btn';
    downloadButton.dataset.videoId = videoId;
    downloadButton.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-downloader-btn';
    downloadButton.innerHTML = '<span class="yt-downloader-icon">↓</span> Download';
    downloadButton.title = 'Download this video';
    
    // Add click event
    downloadButton.addEventListener('click', handleDownloadClick);
    
    // Append button to container
    buttonContainer.appendChild(downloadButton);
    
    // Add button to YouTube UI
    actionBar.appendChild(buttonContainer);
  }
}

// Function to handle click on download button
async function handleDownloadClick() {
  try {
    // Get video ID from button's data attribute
    const videoId = this.dataset.videoId || extractVideoId(window.location.href);
    if (!videoId) {
      showMessage('Could not find video ID', 'error');
      return;
    }
    
    // Show loading state
    const downloadButton = document.getElementById('yt-downloader-btn');
    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.innerHTML = '<span class="yt-downloader-icon loading">↻</span> Loading...';
    }
    
    // Try each quality in order of preference
    for (const quality of PREFERRED_QUALITIES) {
      try {
        const downloadUrl = await getDownloadUrlWithRetry(videoId, quality);
        if (downloadUrl) {
          // Attempt to download the file using proper fallback methods
          initiateDownload(downloadUrl, `youtube-${videoId}.mp4`);
          
          // Show success message
          showMessage('Download started!', 'success');
          
          // Reset button state
          if (downloadButton) {
            downloadButton.disabled = false;
            downloadButton.innerHTML = '<span class="yt-downloader-icon">↓</span> Download';
          }
          
          return;
        }
      } catch (err) {
        console.log(`Failed to download with quality ${quality}, trying next...`);
      }
    }
    
    // If we get here, all qualities failed
    showMessage('Could not download any quality', 'error');
    
    // Reset button state
    if (downloadButton) {
      downloadButton.disabled = false;
      downloadButton.innerHTML = '<span class="yt-downloader-icon">↓</span> Download';
    }
  } catch (error) {
    console.error('Download error:', error);
    showMessage('Error downloading video', 'error');
    
    // Reset button state
    const downloadButton = document.getElementById('yt-downloader-btn');
    if (downloadButton) {
      downloadButton.disabled = false;
      downloadButton.innerHTML = '<span class="yt-downloader-icon">↓</span> Download';
    }
  }
}

// Function to handle the actual file download with multiple approaches
function initiateDownload(url, filename) {
  // Method 1: Use fetch with no-cors to test accessibility
  fetch(url, { method: 'HEAD', mode: 'no-cors' })
    .then(() => {
      // Method 2: Create a link with the download attribute
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Remove the element after a delay
      setTimeout(() => {
        if (link.parentNode === document.body) {
          document.body.removeChild(link);
        }
      }, 100);
    })
    .catch(error => {
      console.log('Trying fallback download method');
      
      // Method 3: Open in new tab as last resort
      // Create an iframe to avoid redirecting the current page
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.onload = function() {
        // Remove the iframe after it's loaded
        setTimeout(() => {
          if (iframe.parentNode === document.body) {
            document.body.removeChild(iframe);
          }
        }, 100);
      };
      
      iframe.src = url;
      document.body.appendChild(iframe);
    });
}

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

// Function to get download URL from API with retry mechanism
async function getDownloadUrlWithRetry(videoId, quality, retryCount = 0) {
  if (retryCount >= MAX_RETRIES) {
    throw new Error('Maximum retries reached');
  }
  
  const apiUrl = `https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_video/${videoId}?quality=${quality}`;
  
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };
  
  try {
    const response = await fetch(apiUrl, options);
    
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check if the response contains a file URL
    if (result && result.file) {
      // We'll avoid checking with HEAD request due to CORS issues
      // Just return the URL and let our download function handle it
      return result.file;
    } else if (result && result.id) {
      // In some cases, the file might be ready but in a different format
      return result.file || result.id;
    }
  } catch (error) {
    console.log('Error fetching from API:', error);
    
    // If we've retried enough times, try with a different quality
    if (retryCount >= MAX_RETRIES / 2) {
      throw new Error('API failed too many times');
    }
    
    // Show message to user about retry
    showMessage(`API request failed. Retrying... (${retryCount + 1}/${MAX_RETRIES})`, 'info');
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return getDownloadUrlWithRetry(videoId, quality, retryCount + 1);
  }
  
  throw new Error('No download URL found in API response');
}

// Function to show toast message
function showMessage(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.getElementById('yt-downloader-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'yt-downloader-toast';
  toast.className = `yt-downloader-toast ${type}`;
  toast.textContent = message;
  
  // Add to body
  document.body.appendChild(toast);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.remove();
    }
  }, 3000);
}

// Start initialization as soon as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Also run init when window is fully loaded to ensure we catch everything
window.addEventListener('load', init);

// Run init immediately as well to catch the initial page load
init();
