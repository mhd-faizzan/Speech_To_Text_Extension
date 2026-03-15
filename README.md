# VoiceFlow — Voice to Text Chrome Extension

> **You type at 70 words per minute. You speak at 250. Why are you still typing your AI prompts?**

Most people lose 60–70% of their thinking speed the moment they open a keyboard. VoiceFlow fixes that — speak your prompt naturally, copy the transcript with one click, and paste it into Claude, ChatGPT or Gemini. No signup, no API keys, no data sent anywhere. Just your voice, turned into text, instantly.

**That's the idea behind VoiceFlow.** I built this because I noticed I was spending more time typing out my thoughts than actually thinking them. Speaking is how humans naturally communicate — so why not speak to AI the same way?

---

## How It Works

```
You click the toolbar icon
         │
         ▼
VoiceFlow opens in a Chrome tab
         │
         ▼
Click mic → speak your prompt
         │
         ▼
Text appears in real time
         │
         ▼
Click "Copy to clipboard"
         │
         ▼
Paste into Claude / ChatGPT / Gemini → send
```

---

## Features

- **One-click toolbar access** — opens a dedicated tab from any page, any time
- **Real-time transcription** — words appear as you speak; partial results shown in italics while you're still talking
- **Animated waveform** — visual confirmation that the mic is listening
- **Two recording modes**
  - Tap `Fn` to toggle recording on/off
  - Hold `Fn` for push-to-talk — mic is live while held, stops on release
- **Editable transcript** — click any word and fix a mishear before copying
- **One-click copy** or `Cmd+Enter` shortcut
- **Smart tab management** — clicking the icon focuses an existing VoiceFlow tab instead of opening a new one every time
- **10 languages** — English (US/UK), German, French, Spanish, Italian, Portuguese, Japanese, Chinese, Hindi
- **Remembers your language** across sessions via `chrome.storage.local`
- **Zero dependencies** — no npm, no build step, no frameworks, no backend

---

## Tech Stack

| Layer | Technology |
|---|---|
| Extension framework | Chrome Manifest V3 |
| Speech recognition | Web Speech API (built into Chrome) |
| Storage | `chrome.storage.local` |
| UI | Vanilla HTML, CSS, JavaScript |
| Background logic | Chrome Service Worker |
| Icons | Python + Pillow |

---

## Project Structure

```
voiceflow-extension/
├── manifest.json        # Chrome extension config (Manifest V3)
├── background.js        # Service worker — handles toolbar icon click
├── app.html             # Full-page UI (opened as a tab)
├── app.js               # All voice logic and UI interactions
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── screenshots/
│   └── demo.png
├── .gitignore
├── LICENSE
└── README.md
```

---

## Why a Full Tab Instead of a Popup

This is the most important architectural decision in the project.

Chrome's Manifest V3 deliberately blocks microphone access inside extension popups — the small dropdown that appears when you click a toolbar icon. This is a browser-level security restriction with no workaround.

VoiceFlow solves this by opening `app.html` as a **full Chrome tab** instead. Full tabs have normal page permissions, so the Web Speech API works exactly as it does on any website.

The background service worker also checks whether a VoiceFlow tab is already open before creating a new one — if it finds one, it just focuses it, so you never end up with duplicates.

```
chrome.action.onClicked
       │
       ├── VoiceFlow tab already open? → focus it
       └── No → chrome.tabs.create({ url: app.html })
```

---

## Speech Recognition Flow

The Web Speech API (`SpeechRecognition`) is built into Chrome. When activated, Chrome sends audio to Google's speech servers and returns a text transcript. The extension itself never touches the audio stream — it only receives the finished text.

Key configuration:
- `continuous: true` — keeps the session alive until explicitly stopped
- `interimResults: true` — delivers partial results while the user is still speaking, so the text box updates in real time rather than waiting for a sentence to finish
- Final results are appended to `finalText`; interim results display separately in muted italic and are cleared on session end

---

## Installation

### From source (Developer Mode)

1. Clone this repository
   ```bash
   git clone https://github.com/mhd-faizzan/voiceflow-extension.git
   ```

2. Open Chrome and go to `chrome://extensions`

3. Turn on **Developer mode** (toggle in the top-right corner)

4. Click **Load unpacked** and select the `voiceflow-extension` folder

5. The VoiceFlow mic icon appears in your Chrome toolbar

> **Tip:** Click the puzzle piece icon in Chrome's toolbar and pin VoiceFlow so it's always one click away.

---

## Usage

1. Click the **VoiceFlow icon** in your Chrome toolbar
2. Click the **mic button** — Chrome will ask for microphone permission the first time, click Allow
3. Speak your prompt naturally
4. Click **Copy to clipboard** (or press `Cmd+Enter`)
5. Switch to Claude.ai, ChatGPT or Gemini — press `Cmd+V` to paste — send

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Fn` (tap) | Toggle mic on / off |
| `Fn` (hold) | Push-to-talk — releases when you let go |
| `Cmd + Enter` | Copy transcript to clipboard |

> **macOS tip:** If `Fn` triggers Emoji & Symbols or Dictation instead, go to **System Settings → Keyboard** and set "Press Fn key to" → **Do Nothing**.

---

## Security & Privacy

| Concern | Detail |
|---|---|
| Audio | Handled entirely by Chrome's built-in Web Speech API. Audio goes to Google's speech servers — the same as any Chrome mic feature. The extension never receives or stores the audio stream. |
| Transcript text | Lives only in the browser tab's memory. Never sent anywhere. Wiped when you close the tab or click Clear. |
| API keys | None. No backend. No server. |
| Storage | Only your language preference is saved locally via `chrome.storage.local`. Nothing else is persisted. |
| Permissions | `storage` and `tabs` only. No access to page content, cookies, history, or any other browsing data. |
| Network requests | Zero — except when you click the Claude / ChatGPT / Gemini buttons, which just open those URLs normally. |

This extension is fully safe to use and fully safe to open-source.

---

## Browser Support

| Browser | Supported |
|---|---|
| Google Chrome | ✅ Yes |
| Microsoft Edge (Chromium) | ✅ Yes |
| Firefox | ❌ No — Web Speech API not supported |
| Safari | ❌ No — Web Speech API not supported |

---

## Local Development

No build tools needed. Make a change, reload, test.

1. Edit `app.html`, `app.js`, or `background.js`
2. Go to `chrome://extensions`
3. Click the **reload icon** on the VoiceFlow card
4. Click the toolbar icon to test

---

## Ideas for Future Improvements

- Auto-paste directly into the active tab's input using a content script
- Global keyboard shortcut to open VoiceFlow from any tab
- Transcript history — save your last 10 prompts
- Punctuation voice commands — say "comma", "full stop", "new paragraph"
- Light theme option

Pull requests are welcome.

---

## License

MIT — free to use, modify and distribute.

---

## Author

Built by [Muhammad Faizan](https://github.com/mhd-faizzan)

*The average person types at 70 words per minute. The average person speaks at 130–250 words per minute. This extension exists because that gap should not be wasted.*
