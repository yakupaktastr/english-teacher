import { useState } from 'react'
import { defaultTitle, saveText, toParagraphs } from '../texts'

export default function AddText({ navigate }: { navigate: (path: string, replace?: boolean) => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const paragraphs = toParagraphs(body)

  async function save() {
    const id = await saveText({
      kind: 'pasted',
      title: title.trim() || defaultTitle(paragraphs),
      chapters: [{ title: '', paragraphs }],
    })
    navigate(`read/${id}`, true)
  }

  return (
    <section className="screen">
      <button className="back" onClick={() => history.back()}>
        ‹ Read
      </button>
      <h1>Add text</h1>

      <input className="search" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        className="paste"
        placeholder="Paste an article, story or any English text here"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <p className="muted small">
        {paragraphs.length} paragraphs · {body.split(/\s+/).filter(Boolean).length} words
      </p>
      <button className="primary wide" disabled={paragraphs.length === 0} onClick={save}>
        Save and read
      </button>
    </section>
  )
}
