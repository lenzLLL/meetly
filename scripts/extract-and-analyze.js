#!/usr/bin/env node
/*
  scripts/extract-and-analyze.js
  - Extracts text from a PDF using `pdf-parse`
  - Calls OpenAI Chat Completions to analyze the transcript
  - Writes JSON and Markdown outputs to `tmp/`

  Usage:
    node scripts/extract-and-analyze.js <path-to-pdf> [--lang=fr|en]

  Requirements:
    - Set `OPENAI_API_KEY` in environment or in a `.env` file
    - Run `npm install` to install new deps (`pdf-parse`, `dotenv`)
*/

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
require('dotenv').config();

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!OPENAI_KEY) {
  console.error('Missing OPENAI_API_KEY in environment. Set it and retry.');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/extract-and-analyze.js <file.pdf> [--lang=fr|en]');
  process.exit(1);
}

const filePath = args[0];
const langArg = args.find(a => a.startsWith('--lang='));
const lang = langArg ? langArg.split('=')[1] : 'fr';

async function extractText(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text || '';
  } catch (err) {
    throw new Error('PDF parse error: ' + err.message);
  }
}

function chunkText(text, maxChars = 8000) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that strictly bases answers on provided text and must not invent facts. If information is missing, state "INFORMATION_NOT_PRESENT".' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1600,
      temperature: 0.0,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText} - ${text}`);
  }

  const data = await res.json();
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return content;
}

function makePromptForChunk(text, lang) {
  return `Voici une transcription extraite d'un document. Tu dois:
1) Produire un objet JSON strictement formaté (pas de texte supplémentaire) avec les champs: ` +
    JSON.stringify({
      summary: 'string (court, 2-4 phrases)',
      key_points: ['array of short strings'],
      decisions: ['array of short strings'],
      actions: [{ action: 'string', owner: 'string or null', due: 'string or null' }],
      speakers: ['array of {speaker: string, notes: string (if present)}'],
      confidence: 'string (notes about missing info)'
    }) + `

2) Ne PAS inventer d'information: si quelque chose n'est pas présent dans le texte, indique "INFORMATION_NOT_PRESENT".
3) Basculer la langue de sortie en ${lang === 'fr' ? 'français' : 'anglais'}.
4) Ne renvoie que l'objet JSON.

Transcription:
"""
${text}
"""
`;
}

function mergeResults(results) {
  const merged = {
    summary: [],
    key_points: [],
    decisions: [],
    actions: [],
    speakers: [],
    confidence: [],
  };

  for (const r of results) {
    if (!r) continue;
    if (r.summary && r.summary !== 'INFORMATION_NOT_PRESENT') merged.summary.push(r.summary);
    if (Array.isArray(r.key_points)) merged.key_points.push(...r.key_points);
    if (Array.isArray(r.decisions)) merged.decisions.push(...r.decisions);
    if (Array.isArray(r.actions)) merged.actions.push(...r.actions);
    if (Array.isArray(r.speakers)) merged.speakers.push(...r.speakers);
    if (r.confidence) merged.confidence.push(r.confidence);
  }

  // Simple dedupe
  merged.key_points = Array.from(new Set(merged.key_points)).slice(0, 200);
  merged.decisions = Array.from(new Set(merged.decisions)).slice(0, 200);
  merged.speakers = Array.from(new Set(merged.speakers.map(s => JSON.stringify(s)))).map(x => JSON.parse(x));
  merged.actions = Array.from(new Set(merged.actions.map(a => JSON.stringify(a)))).map(x => JSON.parse(x));

  // Compose a short merged summary
  merged.summary = merged.summary.join(' \n') || 'INFORMATION_NOT_PRESENT';
  merged.confidence = merged.confidence.join(' | ') || '';

  return merged;
}

async function run() {
  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error('File not found:', absPath);
    process.exit(1);
  }

  const buf = fs.readFileSync(absPath);
  console.log('Extracting text from PDF...');
  const text = await extractText(buf);
  if (!text || text.trim().length === 0) {
    console.error('No text could be extracted from the PDF. It may be scanned; consider OCR.');
    process.exit(1);
  }

  const chunks = chunkText(text, 8000);
  console.log(`Text length: ${text.length} chars → ${chunks.length} chunk(s)`);

  const results = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Analyzing chunk ${i + 1}/${chunks.length}...`);
    const prompt = makePromptForChunk(chunk, lang);
    let out;
    try {
      out = await callOpenAI(prompt);
    } catch (err) {
      console.error('OpenAI call failed:', err.message);
      process.exit(1);
    }

    // Try to parse JSON from output
    try {
      const parsed = JSON.parse(out);
      results.push(parsed);
    } catch (err) {
      console.warn('Warning: could not parse JSON from model output. Saving raw output for inspection.');
      results.push({ raw: out });
    }
    // small pause to be polite
    await new Promise(res => setTimeout(res, 300));
  }

  console.log('Merging results...');
  const merged = mergeResults(results);

  const outDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const base = path.basename(filePath, path.extname(filePath)).replace(/[^a-z0-9-_\.]/gi, '_');
  const jsonPath = path.join(outDir, `${base}-analysis.json`);
  const mdPath = path.join(outDir, `${base}-analysis.md`);

  fs.writeFileSync(jsonPath, JSON.stringify({ meta: { source: filePath, lang }, results, merged }, null, 2));

  let md = `# Analysis for ${filePath}\n\n`;
  md += `## Summary\n\n${merged.summary}\n\n`;
  md += `## Key points\n\n` + (merged.key_points.length ? merged.key_points.map((p, i) => `- ${p}`).join('\n') : '- INFORMATION_NOT_PRESENT') + '\n\n';
  md += `## Decisions\n\n` + (merged.decisions.length ? merged.decisions.map(d => `- ${d}`).join('\n') : '- INFORMATION_NOT_PRESENT') + '\n\n';
  md += `## Actions\n\n` + (merged.actions.length ? merged.actions.map(a => `- ${a.action} — owner: ${a.owner || 'UNSPECIFIED'} — due: ${a.due || 'UNSPECIFIED'}`).join('\n') : '- INFORMATION_NOT_PRESENT') + '\n\n';
  md += `## Speakers\n\n` + (merged.speakers.length ? merged.speakers.map(s => `- ${s.speaker}: ${s.notes || ''}`).join('\n') : '- INFORMATION_NOT_PRESENT') + '\n\n';
  md += `## Confidence / Notes\n\n${merged.confidence || 'No notes.'}\n`;

  fs.writeFileSync(mdPath, md, 'utf8');

  console.log('Analysis complete.');
  console.log('JSON output ->', jsonPath);
  console.log('Markdown output ->', mdPath);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
