import { describe, expect, it } from 'vitest'
import { defaultTitle, toParagraphs } from './texts'

describe('toParagraphs', () => {
  it('splits on blank lines and joins wrapped lines', () => {
    const raw = 'First line\nwraps here.\n\nSecond paragraph.\r\n\r\n\n  Third.  '
    expect(toParagraphs(raw)).toEqual(['First line wraps here.', 'Second paragraph.', 'Third.'])
  })

  it('uses single line breaks when there are no blank lines', () => {
    expect(toParagraphs('One.\nTwo.\nThree.')).toEqual(['One.', 'Two.', 'Three.'])
  })

  it('returns nothing for empty input', () => {
    expect(toParagraphs('  \n \n')).toEqual([])
  })
})

describe('defaultTitle', () => {
  it('uses the first words of the text', () => {
    expect(defaultTitle(['The quick brown fox jumps over the lazy dog.'])).toBe('The quick brown fox jumps over the…')
    expect(defaultTitle(['Short one.'])).toBe('Short one.')
  })
})
