// 智能分割文本到多张卡片 - 优化空间利用率
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

export const splitTextToCards = (text, cardStyle) => {
  if (!text.trim()) return []

  const cards = []

  // 计算卡片可用区域（考虑内边距和 copyright 预留空间）
  const availableWidth = cardStyle.width - cardStyle.padding * 2
  const copyrightReserve = cardStyle.copyrightText ? 40 : 0
  // 减少安全系数以更精确地利用空间
  const safetyMargin = cardStyle.fontSize * 0.2
  const availableHeight = cardStyle.height - cardStyle.padding * 2 - copyrightReserve - safetyMargin

  // 辅助函数：检测段落格式并返回对应的字体大小和行间距
  const detectParagraphStyle = (paragraph) => {
    let fontSize = cardStyle.fontSize
    let lineSpacing = cardStyle.lineSpacing

    // 检测标题格式
    const h1Pattern = /^\s*#\s+(.+)/
    const h2Pattern = /^\s*##\s+(.+)/
    const h3Pattern = /^\s*###\s+(.+)/

    if (h1Pattern.test(paragraph)) {
      fontSize = cardStyle.fontSize * 1.6
      lineSpacing = cardStyle.lineSpacing * 1.5
    } else if (h2Pattern.test(paragraph)) {
      fontSize = cardStyle.fontSize * 1.4
      lineSpacing = cardStyle.lineSpacing * 1.2
    } else if (h3Pattern.test(paragraph)) {
      fontSize = cardStyle.fontSize * 1.2
    }

    // 检测引用格式（可以与其他格式组合）
    const quotePattern = /^\s*>\s*/
    if (quotePattern.test(paragraph)) {
      fontSize = cardStyle.fontSize * 0.9
      lineSpacing = cardStyle.lineSpacing * 0.5
    }

    // 检测数字标题
    const chineseNumberPattern = /^\s*[一二三四五六七八九十]、/g
    const arabicNumberPattern = /^\s*\d+、/g

    if (chineseNumberPattern.test(paragraph)) {
      fontSize = cardStyle.fontSize * 1.4
    } else if (arabicNumberPattern.test(paragraph)) {
      fontSize = cardStyle.fontSize * 1.2
    }

    return { fontSize, lineSpacing }
  }

  // 辅助函数：计算段落需要的行高
  // 减少安全余量以更精确地利用空间
  const calculateParagraphHeight = (_paragraph, fontSize, lineSpacing) => {
    const lineHeight = fontSize * 1.4 + lineSpacing
    // 减少额外高度以更精确地利用空间
    return lineHeight * 1.05
  }

  // 辅助函数：移除 markdown 标记以获取纯文本用于计算宽度
  const stripMarkdownMarkers = (paragraph) => {
    let text = paragraph

    // 移除标题标记
    text = text.replace(/^\s*#+\s+/, '')
    // 移除引用标记
    text = text.replace(/^\s*>\s*/, '')
    // 移除数字标题标记
    text = text.replace(/^\s*[一二三四五六七八九十]\d*、/, '')
    text = text.replace(/^\s*\d+、/, '')
    // 移除对齐标记
    text = text.replace(/^\s*[:：](.+?)[:：]$/, '$1')
    text = text.replace(/^\s*[:：](.+)$/, '$1')
    text = text.replace(/^(.+?)[:：]$/, '$1')
    // 移除列表标记
    text = text.replace(/^\s*-\s/, '')

    return text
  }

  // 辅助函数：使用Pretext计算段落高度和行信息
  const calculateParagraphWithPretext = (paragraph) => {
    const { fontSize, lineSpacing } = detectParagraphStyle(paragraph)
    const lineHeight = calculateParagraphHeight(paragraph, fontSize, lineSpacing)
    const pureText = stripMarkdownMarkers(paragraph).trim()

    if (pureText === '') {
      return { height: lineHeight, lines: [], fontSize, lineSpacing }
    }

    const font = `${fontSize}px ${cardStyle.fontFamily}`
    const prepared = prepareWithSegments(pureText, font)
    const { height, lines } = layoutWithLines(prepared, availableWidth, lineHeight)

    return { height, lines, fontSize, lineSpacing }
  }

  let currentCardContent = []
  let currentCardHeight = 0

  // 按自然换行符分割文本，保留所有空行
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    // 使用Pretext计算这个段落需要的高度和行信息
    const paragraphMetrics = calculateParagraphWithPretext(paragraph)

    // 计算当前卡片的剩余空间
    const remainingSpace = availableHeight - currentCardHeight

    // 情况1：剩余空间足够放入整个段落
    if (remainingSpace >= paragraphMetrics.height) {
      currentCardContent.push(paragraph)
      currentCardHeight += paragraphMetrics.height
      continue
    }

    // 情况2：段落高度超过单张卡片可用高度（需要跨卡片分割）
    if (paragraphMetrics.height > availableHeight) {
      const { fontSize, lineSpacing, lines } = paragraphMetrics
      const lineHeight = calculateParagraphHeight(paragraph, fontSize, lineSpacing)

      // 获取原始段落的标记类型
      const getMarkerPrefix = () => {
        if (/^\s*#\s+/.test(paragraph)) return '# '
        if (/^\s*##\s+/.test(paragraph)) return '## '
        if (/^\s*###\s+/.test(paragraph)) return '### '
        if (/^\s*>\s*/.test(paragraph)) return '> '
        return ''
      }
      const markerPrefix = getMarkerPrefix()

      let remainingLines = [...lines]

      // 先尝试放入当前卡片的剩余空间
      const maxLinesInCurrentCard = Math.floor(remainingSpace / lineHeight)

      if (maxLinesInCurrentCard > 0) {
        const linesToAdd = remainingLines.slice(0, maxLinesInCurrentCard)
        const partText = linesToAdd.map(l => l.text).join('\n')
        const partHeight = linesToAdd.length * lineHeight

        if (partText.trim().length > 0) {
          const partLines = partText.split('\n')
          const partWithMarkers = partLines.map(line => markerPrefix + line).join('\n')
          currentCardContent.push(partWithMarkers)
          currentCardHeight += partHeight
        }

        remainingLines = remainingLines.slice(maxLinesInCurrentCard)
      }

      // 保存当前卡片（如果有内容）
      if (currentCardContent.length > 0) {
        cards.push([...currentCardContent])
        currentCardContent = []
        currentCardHeight = 0
      }

      // 如果还有剩余行，创建新卡片继续放入
      while (remainingLines.length > 0) {
        const remainingHeightInNewCard = availableHeight
        const maxLines = Math.floor(remainingHeightInNewCard / lineHeight)

        if (maxLines <= 0) break

        const linesToAdd = remainingLines.slice(0, maxLines)
        const partText = linesToAdd.map(l => l.text).join('\n')
        const partHeight = linesToAdd.length * lineHeight

        if (partText.trim().length > 0) {
          const partLines = partText.split('\n')
          const partWithMarkers = partLines.map(line => markerPrefix + line).join('\n')
          currentCardContent.push(partWithMarkers)
          currentCardHeight += partHeight
        }

        remainingLines = remainingLines.slice(maxLines)

        // 如果还有剩余行，保存当前卡片并继续
        if (remainingLines.length > 0) {
          cards.push([...currentCardContent])
          currentCardContent = []
          currentCardHeight = 0
        }
      }
      continue
    }

    // 情况3：剩余空间不足，尝试更智能地填充空间
    // 只有当剩余空间非常小时才直接移到新卡片
    const MIN_REMAINING_SPACE = 20 // 最小剩余空间阈值（降低以更好利用空间）

    if (remainingSpace < MIN_REMAINING_SPACE) {
      // 剩余空间太小，直接移到新卡片
      if (currentCardContent.length > 0) {
        cards.push([...currentCardContent])
        currentCardContent = []
        currentCardHeight = 0
      }
      currentCardContent.push(paragraph)
      currentCardHeight = paragraphMetrics.height
    } else {
      // 尝试将段落拆分以更好地填充剩余空间
      const { fontSize, lineSpacing, lines } = paragraphMetrics
      const lineHeight = calculateParagraphHeight(paragraph, fontSize, lineSpacing)

      const getMarkerPrefix = () => {
        if (/^\s*#\s+/.test(paragraph)) return '# '
        if (/^\s*##\s+/.test(paragraph)) return '## '
        if (/^\s*###\s+/.test(paragraph)) return '### '
        if (/^\s*>\s*/.test(paragraph)) return '> '
        return ''
      }
      const markerPrefix = getMarkerPrefix()

      const maxLinesInCurrentCard = Math.floor(remainingSpace / lineHeight)

      if (maxLinesInCurrentCard > 0) {
        // 可以放入一些行到当前卡片
        const linesToAdd = lines.slice(0, Math.min(maxLinesInCurrentCard, lines.length))
        const remainingLines = lines.slice(Math.min(maxLinesInCurrentCard, lines.length))

        if (linesToAdd.length > 0) {
          const partText = linesToAdd.map(l => l.text).join(' ')
          const partWithMarker = markerPrefix + partText
          currentCardContent.push(partWithMarker)
          currentCardHeight += linesToAdd.length * lineHeight
        }

        // 如果当前卡片已经接近满了，保存它
        if (availableHeight - currentCardHeight < lineHeight * 1.5) {
          cards.push([...currentCardContent])
          currentCardContent = []
          currentCardHeight = 0
        }

        // 处理剩余的行
        if (remainingLines.length > 0) {
          const remainingText = remainingLines.map(l => l.text).join(' ')
          const remainingWithMarker = markerPrefix + remainingText
          currentCardContent.push(remainingWithMarker)
          currentCardHeight = remainingLines.length * lineHeight
        }
      } else {
        // 即使一行也放不下，也移到新卡片（这种情况应该很少发生）
        if (currentCardContent.length > 0) {
          cards.push([...currentCardContent])
          currentCardContent = []
          currentCardHeight = 0
        }
        currentCardContent.push(paragraph)
        currentCardHeight = paragraphMetrics.height
      }
    }
  }

  // 处理最后一张卡片
  if (currentCardContent.length > 0) {
    cards.push([...currentCardContent])
  }

  return cards
}