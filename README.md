# 🕵️ X Privacy

Hide your identity while browsing X (Twitter) in public. Replace your name and handle with a fake identity — or hide *everyone's* identity for full stealth mode.

![Chrome Web Store](https://img.shields.io/badge/platform-Chrome-brightgreen)
![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

[中文](./README.zh.md)

## Why?

Scrolling through X on a train, in a lecture hall, or at a café? Anyone glancing at your screen can see your handle and who you're interacting with. X Privacy replaces all visible identity info locally in your browser — nothing is sent to any server.

## Features

- **Just Me mode** — hides only your own name and handle
- **Everyone mode** — replaces all users' identities on your timeline
- **Custom identity** — choose your own fake name and handle, or let the extension assign random ones
- **Smart replacement** — catches names in tweets, replies, and the browser tab title
- **Consistent aliases** — each user gets a stable fake identity per session (no flickering)
- **Blur toggle** — optionally blur the sidebar account switcher button, unblurs on hover
- **One-click reload** — refresh all X tabs from the popup to apply changes instantly
- **Zero data collection** — all settings stored locally via `chrome.storage.sync`

## Install

### From source (developer mode)

1. Clone or download this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `x-privacy` folder
5. Click the extension icon in your toolbar and configure your settings

## Usage

1. Click the 🕵️ icon in your toolbar
2. Enter your **profile name** and **@ username** under "Your actual identity"
3. Optionally set a **custom identity** (leave blank for random assignment)
4. Choose a mode:
   - **Just Me** — only your info gets replaced
   - **Everyone** — all users on the page get fake identities
5. Toggle the switch on — done

After changing settings, click **Reload X tabs** at the bottom of the panel to apply immediately.

## How it works

X Privacy is a content script that runs on `x.com` and `twitter.com`. It uses:

- **DOM selectors** (`data-testid`, `a[href^="/"]`) to find usernames and display names
- **TreeWalker** to scan text nodes for stray mentions of your name and handle
- **MutationObserver** to continuously apply replacements as X dynamically loads new content
- **chrome.storage.sync** to persist your settings across tabs and sessions

Everything runs client-side. No network requests, no data collection, no server.

## Project structure

```
x-privacy/
├── manifest.json      # Extension config (Manifest V3)
├── content.js         # Core logic — injected into X pages
├── popup.html         # Settings panel UI
├── popup.js           # Settings panel logic
└── icons/
    ├── icon16.png     # Toolbar icon
    ├── icon48.png     # Extension management page
    └── icon128.png    # Chrome Web Store
```

## Privacy policy

X Privacy does not collect, transmit, or store any user data externally. All configuration is stored locally in your browser via `chrome.storage.sync`. No analytics, no tracking, no server-side components.

## License

MIT