# PDF / Audio Extract & Analyze Script

This folder contains a helper script to extract text from a PDF and perform an AI analysis using OpenAI.

Usage

1. Install dependencies (new ones added):

```powershell
npm install pdf-parse dotenv
```

2. Set your OpenAI key in the environment or in a `.env` file at project root:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

3. Run the script (PowerShell example):

```powershell
# analyze Synopsia Business Plan.pdf in the project root
node scripts/extract-and-analyze.js "Synopsia Business Plan.pdf" --lang=fr
```

Outputs are written to the `tmp/` directory:
- `<basename>-analysis.json` (raw plus merged JSON)
- `<basename>-analysis.md` (human readable summary)

Notes
- The script uses chunking for long documents and merges results heuristically.
- If the PDF is a scanned image (no extractable text), consider running OCR first.