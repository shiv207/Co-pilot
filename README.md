# Web Co-Pilot

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![Gemma2](https://img.shields.io/badge/Model-DeepSeek%20R1-green.svg)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/shiv207/Co-pilot/releases)

**Tags:** `#browser-extension` `#ai-assistant` `#web-development` `#code-assistant` `#chrome-extension` `#firefox-extension` `#grok-interface` `#ai-integration` `#web-development-tools` `#coding-assistant` `#developer-tools` `#browser-tools`

A powerful browser extension that brings AI-powered coding assistance directly to your web browser, inspired by the Grok interface.

## 🎯 Project Goal

Web Co-Pilot aims to provide developers with a seamless, AI-powered coding assistant that integrates directly into their web browsing experience. The extension offers a clean, dark interface similar to Grok, providing intelligent code suggestions and analysis while maintaining a minimalist design.

## 🚀 Features

- Clean, dark interface with full-width responses
- No chat bubbles for a distraction-free experience
- Modern input box with action buttons (Add, DeepSearch, Think)
- Subtle gradients and "X" icon texture background
- "Ask Anything" placeholder text
- Dark popup button with SVG icon
- Intelligent code analysis and suggestions
- Page content analysis and context-aware responses

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- Python (v3.8 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shiv207/Co-pilot.git
   cd Co-pilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your API keys (if required)

4. Build the extension:
   ```bash
   npm run build
   ```

### Loading the Extension

1. Open Chrome/Firefox
2. Go to Extensions page (chrome://extensions/ or about:debugging)
3. Enable Developer Mode
4. Click "Load unpacked" and select the `extension` directory

## 📦 Project Structure

```
Co-pilot/
├── extension/              # Browser extension files
│   ├── icons/             # Extension icons
│   ├── content.js         # Content script
│   ├── popup.css          # Popup styles
│   └── manifest.json      # Extension manifest
├── src/                   # Source code
│   └── components/        # React components
├── public/                # Static assets
└── package.json           # Project dependencies
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
