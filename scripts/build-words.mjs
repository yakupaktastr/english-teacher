// Validates the card content in data/content/*.json against data/headwords.json
// and writes the bundled word data to public/data/words.json.
// Run: node scripts/build-words.mjs
//      node scripts/build-words.mjs --only b03   (check files starting with b03, write nothing)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'

const onlyIndex = process.argv.indexOf('--only')
const only = onlyIndex > -1 ? process.argv[onlyIndex + 1] : null

const headwords = JSON.parse(readFileSync('data/headwords.json', 'utf8'))
const byWord = new Map(headwords.map((h) => [h.word, h]))

const errors = []
const warnings = []
const content = new Map()

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0

// Loose check that an example actually uses the word (allows inflections like abandoned, bore).
function mentions(sentence, word) {
  const text = sentence.toLowerCase()
  const stem = word.length > 4 ? word.slice(0, -2) : word
  return word
    .toLowerCase()
    .split(/[\s-]+/)
    .every((part) => text.includes(part.length > 4 ? part.slice(0, -2) : part)) || text.includes(stem.toLowerCase())
}

for (const file of readdirSync('data/content').filter((f) => f.endsWith('.json') && (!only || f.startsWith(only))).sort()) {
  const entries = JSON.parse(readFileSync(`data/content/${file}`, 'utf8'))
  for (const e of entries) {
    const where = `${file}: ${e.word}`
    if (!byWord.has(e.word)) errors.push(`${where}: not in headwords`)
    if (content.has(e.word)) warnings.push(`${where}: duplicate, later entry wins`)
    if (!nonEmpty(e.ipa)) errors.push(`${where}: missing ipa`)
    if (!Array.isArray(e.senses) || e.senses.length === 0) errors.push(`${where}: no senses`)
    for (const [i, s] of (e.senses ?? []).entries()) {
      for (const field of ['pos', 'tr', 'def']) if (!nonEmpty(s[field])) errors.push(`${where}: sense ${i + 1} missing ${field}`)
      if (!Array.isArray(s.examples) || s.examples.length === 0) errors.push(`${where}: sense ${i + 1} has no examples`)
      for (const ex of s.examples ?? []) if (!mentions(ex, e.word)) warnings.push(`${where}: example may not use the word: "${ex}"`)
    }
    if (!Array.isArray(e.collocations) || e.collocations.length < 2) errors.push(`${where}: needs at least 2 collocations`)
    if (!Array.isArray(e.synonyms)) errors.push(`${where}: synonyms must be a list`)
    if (!Array.isArray(e.family)) errors.push(`${where}: family must be a list`)
    content.set(e.word, e)
  }
}

const words = []
for (const h of headwords) {
  const c = content.get(h.word)
  if (!c) continue
  words.push({
    word: h.word,
    level: h.level,
    awl: h.awl ?? undefined,
    ipa: c.ipa,
    senses: c.senses,
    collocations: c.collocations,
    synonyms: c.synonyms,
    family: c.family,
    note: c.note || undefined,
  })
}

if (!only) {
  mkdirSync('public/data', { recursive: true })
  writeFileSync('public/data/words.json', JSON.stringify(words))
}

for (const w of warnings) console.warn(`warn  ${w}`)
for (const e of errors) console.error(`error ${e}`)
if (only) console.log(`${content.size} entries checked in files starting with "${only}"`)
else console.log(`${words.length}/${headwords.length} words have content (${headwords.length - words.length} missing)`)
console.log(`${errors.length} errors, ${warnings.length} warnings`)
if (errors.length) process.exit(1)
