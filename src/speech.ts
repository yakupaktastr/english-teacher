// Pronunciation with the device's built-in American English voice (works offline on iOS).

let voice: SpeechSynthesisVoice | null = null

function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-') === 'en-US')
  voice =
    voices.find((v) => /enhanced|premium/i.test(v.name)) ??
    voices.find((v) => v.name.includes('Samantha')) ??
    voices.find((v) => v.localService) ??
    voices[0] ??
    null
}

if ('speechSynthesis' in window) {
  pickVoice()
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  if (voice) utterance.voice = voice
  speechSynthesis.speak(utterance)
}
