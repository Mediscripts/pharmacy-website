import './MarkdownContent.css'

function inlineParts(value) {
  const parts = []
  const pattern = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let cursor = 0
  let match

  while ((match = pattern.exec(value))) {
    if (match.index > cursor) parts.push(value.slice(cursor, match.index))
    if (match[1] !== undefined) {
      parts.push(<img key={match.index} src={match[2]} alt={match[1]} loading="lazy" />)
    } else if (match[3] !== undefined) {
      parts.push(<a key={match.index} href={match[4]} target="_blank" rel="noreferrer">{match[3]}</a>)
    } else if (match[5] !== undefined) {
      parts.push(<strong key={match.index}>{match[5]}</strong>)
    } else {
      parts.push(<em key={match.index}>{match[6]}</em>)
    }
    cursor = pattern.lastIndex
  }

  if (cursor < value.length) parts.push(value.slice(cursor))
  return parts
}

function parseImageLine(value) {
  const match = value.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)(?:\s+\{credit=([^\s}]*)\s+source=([^\s}]*)\})?$/)
  if (!match) return null
  let credit = ''
  let source = ''
  try {
    credit = match[3] ? decodeURIComponent(match[3]) : ''
    source = match[4] ? decodeURIComponent(match[4]) : ''
  } catch {
    return null
  }
  if (source && !source.startsWith('https://')) source = ''
  return { alt: match[1], url: match[2], credit, source }
}

function MarkdownContent({ content = '' }) {
  const lines = String(content).split(/\r?\n/)
  const blocks = []
  let paragraph = []
  let listItems = []

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(<p key={`p-${blocks.length}`}>{inlineParts(paragraph.join(' '))}</p>)
      paragraph = []
    }
  }
  const flushList = () => {
    if (listItems.length) {
      blocks.push(<ul key={`ul-${blocks.length}`}>{listItems.map((item, index) => <li key={index}>{inlineParts(item)}</li>)}</ul>)
      listItems = []
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim()
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    const image = parseImageLine(trimmed)
    const listItem = trimmed.match(/^[-*]\s+(.+)$/)

    if (!trimmed) {
      flushParagraph()
      flushList()
      return
    }
    if (heading) {
      flushParagraph()
      flushList()
      const Tag = `h${heading[1].length + 1}`
      blocks.push(<Tag key={`h-${blocks.length}`}>{inlineParts(heading[2])}</Tag>)
      return
    }
    if (image) {
      flushParagraph()
      flushList()
      blocks.push(<figure className="markdown-content__figure" key={`img-${blocks.length}`}><img src={image.url} alt={image.alt} loading="lazy" />{image.credit || image.source ? <figcaption>Image credit: {image.credit || 'Source'}{image.source ? <> · <a href={image.source} target="_blank" rel="noreferrer">View source</a></> : null}</figcaption> : null}</figure>)
      return
    }
    if (listItem) {
      flushParagraph()
      listItems.push(listItem[1])
      return
    }
    flushList()
    paragraph.push(trimmed)
  })

  flushParagraph()
  flushList()
  return <div className="markdown-content">{blocks}</div>
}

export default MarkdownContent
