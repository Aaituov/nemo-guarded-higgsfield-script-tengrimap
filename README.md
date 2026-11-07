# 🎬 NeMo Guarded Higgsfield Script (TengriMap)
> **Enterprise Generative Video Pipeline: NVIDIA NeMo Guardrails + Google Gemini 1.5 Flash + Higgsfield AI + Google Apps Script**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NVIDIA NeMo](https://img.shields.io/badge/NVIDIA-NeMo_Guardrails-76B900?logo=nvidia)](https://github.com/NVIDIA/NeMo-Guardrails)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini_1.5_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![Higgsfield AI](https://img.shields.io/badge/Higgsfield-Video_API-black)](https://higgsfield.ai)

---

## 📌 Executive Summary

Generative video diffusion models (like **Higgsfield AI**) require heavy GPU inference compute. In an automated content creation loop, passing unverified user prompts directly to video rendering models exposes organizations to two critical failure modes:
1. **Brand & Policy Violations:** Accidental generation of trademarked assets, unauthorized likenesses, or inappropriate scenes.
2. **GPU Cost Inefficiency:** Burning expensive video rendering compute ($0.50 - $2.00/render) on invalid or non-compliant prompts.

This reference architecture demonstrates how **NVIDIA NeMo Guardrails** acts as an upstream programmatic firewall. Integrated into **Google Sheets via Apps Script**, marketing and ops teams can manage and dispatch video campaigns safely from a familiar spreadsheet interface.

---

## 🏗️ Architecture

```
[Google Sheets Matrix]
       │
       ▼ (Apps Script batch event via UrlFetchApp)
[FastAPI Gateway (server.py)]
       │
       ├─► [1. NVIDIA NeMo Guardrails (Colang)]
       │         └─ Evaluates trademark, safety, and brand policies
       │         └─ If Violated: Returns "REJECTED" (Execution aborts, $0 GPU cost)
       │
       ├─► [2. Google Gemini 1.5 Flash]
       │         └─ Translates concept into 4K cinematic camera & lighting directions
       │
       └─► [3. Higgsfield AI Video API]
                 └─ Renders 9:16 vertical video clip
                 └─ Injects video URL directly back into Google Sheet row
```

---

## 📁 Repository Structure

```
nemo-guarded-higgsfield-script-tengrimap/
│
├── config/
│   ├── config.yml              # NeMo Guardrails runtime configuration
│   └── rails.co                # Colang safety, trademark, and brand rules
│
├── apps_script/
│   ├── Code.js                 # Google Sheets UI menu & orchestration script
│   └── appsscript.json         # Apps Script project manifest
│
├── server.py                   # FastAPI Gateway (NeMo + Gemini + Higgsfield)
├── requirements.txt            # Python dependencies
├── .env.example                # Sample environment variables
├── demo_sheet_template.csv     # Starter Google Sheet CSV template
└── README.md                   # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- A Google AI Studio Gemini API Key (free tier available at [aistudio.google.com](https://aistudio.google.com))
- A Higgsfield AI API key (or use mock mode for local testing)

### 2. Installation
```bash
git clone https://github.com/Aaituov/nemo-guarded-higgsfield-script-tengrimap.git
cd nemo-guarded-higgsfield-script-tengrimap
pip install -r requirements.txt
```

### 3. Environment Setup
Copy the sample environment file:
```bash
cp .env.example .env
```
Edit `.env` with your keys:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
HIGGSFIELD_API_KEY=your_higgsfield_api_key_here
PORT=8000
```

### 4. Run the Gateway Server
```bash
python server.py
```

### 5. Expose Gateway to Google Cloud (Tunneling)
Since Google Apps Script runs in Google's cloud, expose your local port via a secure tunnel:
```bash
npx localtunnel --port 8000
```
Copy the generated HTTPS URL (e.g., `https://your-tunnel.loca.lt`).

### 6. Setup Google Sheets & Apps Script
1. Open a new [Google Sheet](https://sheets.new) and import `demo_sheet_template.csv`.
2. Go to **Extensions > Apps Script**.
3. Replace the script contents with `apps_script/Code.js`.
4. Update `GATEWAY_ENDPOINT` in `Code.js` with your tunnel URL (`https://your-tunnel.loca.lt/create-video`).
5. Refresh your Sheet. Use the new custom menu: **🎬 Video Studio > Generate Video Campaign**.

---

## 🛡️ Guardrail Rules Example (`config/rails.co`)

```colang
define user ask unsafe_video
  "make a video with Mickey Mouse"
  "violent explosion in office"
  "deepfake celebrity drinking our soda"
  "competitor logo in background"

define flow check video safety
  user ask unsafe_video
  bot refuse unsafe video
  stop

define bot refuse unsafe video
  "BLOCKED_BY_NEMO: Prompt violates brand safety, copyright, or likeness policies."
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
