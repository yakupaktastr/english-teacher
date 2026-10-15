// Merges the Oxford 5000 and the Academic Word List into one headword list
// (American spelling, one entry per word) at data/headwords.json.
// Run: node scripts/build-headwords.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const oxford = JSON.parse(readFileSync('data/sources/oxford5000.json', 'utf8'))
const awl = JSON.parse(readFileSync('data/sources/awl.json', 'utf8'))

const AMERICAN = {
  aluminium: 'aluminum',
  analyse: 'analyze',
  behaviour: 'behavior',
  catalogue: 'catalog',
  centre: 'center',
  colour: 'color',
  coloured: 'colored',
  colourful: 'colorful',
  counsellor: 'counselor',
  defence: 'defense',
  endeavour: 'endeavor',
  enrol: 'enroll',
  favour: 'favor',
  favourable: 'favorable',
  favourite: 'favorite',
  fibre: 'fiber',
  flavour: 'flavor',
  fulfil: 'fulfill',
  grey: 'gray',
  harbour: 'harbor',
  honour: 'honor',
  humour: 'humor',
  jewellery: 'jewelry',
  judgement: 'judgment',
  kilometre: 'kilometer',
  labour: 'labor',
  licence: 'license',
  litre: 'liter',
  maximise: 'maximize',
  metre: 'meter',
  minimise: 'minimize',
  neighbour: 'neighbor',
  neighbourhood: 'neighborhood',
  neighbouring: 'neighboring',
  offence: 'offense',
  practise: 'practice',
  programme: 'program',
  rumour: 'rumor',
  sceptical: 'skeptical',
  theatre: 'theater',
  tyre: 'tire',
  utilise: 'utilize',
}

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1']
const american = (word) => AMERICAN[word] ?? word

const byWord = new Map()
function entry(word) {
  if (!byWord.has(word)) byWord.set(word, { word, level: null, pos: [], ipa: null, awl: null, hints: [] })
  return byWord.get(word)
}

for (const row of oxford) {
  const e = entry(american(row.word))
  if (row.cefr && (!e.level || LEVELS.indexOf(row.cefr) < LEVELS.indexOf(e.level))) e.level = row.cefr
  if (row.pos && !e.pos.includes(row.pos)) e.pos.push(row.pos)
  e.ipa ??= row.ipa || null
  if (row.hint) e.hints.push(`${row.pos}: ${row.hint}`)
}

for (const [word, sublist] of Object.entries(awl)) {
  const e = entry(american(word))
  e.awl = sublist
  // AWL-only words have no Oxford level; academic vocabulary sits around C1.
  e.level ??= 'c1'
}

const headwords = [...byWord.values()].sort((a, b) => a.word.localeCompare(b.word))
writeFileSync('data/headwords.json', JSON.stringify(headwords, null, 1) + '\n')

const count = (fn) => headwords.filter(fn).length
console.log(`${headwords.length} headwords`)
for (const level of LEVELS) console.log(`  ${level}: ${count((h) => h.level === level)}`)
console.log(`  AWL: ${count((h) => h.awl)} (AWL only: ${count((h) => h.awl && !h.pos.length)})`)
