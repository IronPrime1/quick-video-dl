
# YouTube Video Downloader Chrome Extension

A simple Chrome extension that adds a download button to YouTube video pages.

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the folder containing this extension
5. The extension is now installed and active

## Usage

1. Navigate to any YouTube video page (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`)
2. A "Download" button will appear next to the like/dislike buttons
3. Click the button to download the video in the highest available quality

## Features

- Automatically adds a download button to YouTube video pages
- Attempts to download in the following quality order: 137 (1080p), 248 (1080p WebM), 136 (720p), 135 (480p)
- Shows download status through toast notifications
- Works with YouTube's modern interface

## Technical Details

This extension uses the YouTube Video Fast Downloader API from RapidAPI to fetch download links for videos.

## Icon Credits

The icons used in this extension are placeholders and should be replaced with proper icons before distribution.
