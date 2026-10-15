# Word card content guide

Card content lives in `data/content/*.json`. Each file is a JSON array of entries.
`node scripts/build-words.mjs` validates everything and writes `public/data/words.json`.
See `data/content/sample.json` for six reference entries. Match their style and quality.

The learner is a Turkish native speaker at C1 level who wants to use words actively,
not just recognize them. The app is set to American English.

## Entry format

```json
{
  "word": "compromise",
  "ipa": "/ˈkɑːmprəmaɪz/",
  "senses": [
    {
      "pos": "noun",
      "tr": "uzlaşma, orta yol",
      "def": "an agreement in which each side gives up some of what it wants",
      "examples": ["After hours of talks, they finally reached a compromise."]
    }
  ],
  "collocations": ["reach a compromise", "make a compromise", "a fair compromise"],
  "synonyms": ["agreement", "middle ground"],
  "family": [{ "word": "uncompromising", "pos": "adjective" }],
  "note": "optional"
}
```

## Rules

- **word**: exactly the headword as given in the input list. One entry per headword.
- **ipa**: General American IPA between slashes. Use the `ipa` from the input when it is not null.
- **senses**: the 1–4 most common and useful senses, most frequent first. Cover the parts of speech
  in the input `pos` list when they are genuinely in use. Skip rare or archaic senses.
  The input `hints` are only there to show which senses Oxford means. Do not copy their wording.
  - **pos**: noun, verb, adjective, adverb, preposition, conjunction, pronoun, determiner,
    exclamation, modal verb, number, article (use the plain name).
  - **tr**: natural Turkish equivalents, 1–4 options separated by commas. Use a short
    parenthetical for context, e.g. `(plan, fikir vb.) vazgeçmek`. Use the Turkish words people actually say.
  - **def**: a plain learner-dictionary definition in your own words, no more than about 20 words.
  - **examples**: 1–2 per sense. Natural, modern American English, about 8–18 words, in a
    concrete everyday or news/academic context. Each example must contain the headword (an
    inflected form is fine), and the context should make the meaning guessable, because examples
    are used for fill-in-the-blank exercises. No real people's names.
- **collocations**: 3–6 frequent collocations or patterns. Each one contains the headword in some form.
- **synonyms**: 0–5 common synonyms or near-synonyms. Use an empty list if none fit.
- **family**: 0–6 genuinely used derived words with their part of speech. Leave out the headword
  itself and plain inflections (-s, -ed, -ing), unless the -ed/-ing form is a separate adjective.
- **note** (optional): include one only when it is genuinely useful, in at most about 25 words, in English.
  Useful notes cover irregular forms, confusable words, register (formal/informal), a
  British/American difference, or a trap for Turkish speakers.
- Use American spelling everywhere. For British-only words (lorry, petrol, flat, etc.), give the
  British sense with "(British)" in the def and name the American equivalent in the note.
- Very basic words (a, the, I, one…) still get a short, correct entry. Focus on useful patterns.
- Output must be valid UTF-8 JSON (straight double quotes for JSON strings, no trailing commas).
