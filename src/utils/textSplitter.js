// 智能分割文本到多张卡片 - 使用统一文本布局计算
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import {
  calculateLineHeight,
  calculateParagraphHeight,
  calculateTextLayout,
  detectParagraphStyle,
  stripMarkdownMarkers
} from '@/utils/textLayout'

export const splitTextToCards = (text, cardStyle) => {
  if (!text.trim()) return []

  const cards = []

  // 计算卡片可用区域（考虑内边距和 copyright 预留空间）
  const availableWidth = cardStyle.width - cardStyle.padding * 2
  const copyrightReserve = cardStyle.copyrightText ? 40 : 0
  const availableHeight = cardStyle.height - cardStyle.padding * 2 - copyrightReserve

  let currentCardContent = []
  let currentCardHeight = 0

  // 按自然换行符分割文本，保留所有空行
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    // 检测段落格式
    const { fontSize, lineSpacing } = detectParagraphStyle(paragraph, cardStyle)

    // 移除 markdown 标记以获取纯文本用于计算宽度
    const pureText = stripMarkdownMarkers(paragraph).trim()

    // 使用Pretext计算文本布局
    const { lines } = calculateTextLayout(pureText, cardStyle.fontFamily, fontSize, availableWidth)

    // 计算段落实际占用的高度
    const paragraphHeight = calculateParagraphHeight(lines, fontSize, lineSpacing)

    // 计算当前卡片的剩余空间
    const remainingSpace = availableHeight - currentCardHeight

    // 情况1：剩余空间足够放入整个段落
    if (remainingSpace >= paragraphHeight) {
      currentCardContent.push(paragraph)
      currentCardHeight += paragraphHeight
      continue
    }

    // 情况2：段落高度超过单张卡片可用高度（需要跨卡片分割）
    if (paragraphHeight > availableHeight) {
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
      const maxLinesInCurrentCard = Math.floor(remainingSpace / calculateLineHeight(fontSize, lineSpacing))

      if (maxLinesInCurrentCard > 0) {
        const linesToAdd = remainingLines.slice(0, maxLinesInCurrentCard)
        const partText = linesToAdd.map(l => l.text).join(' ')
        const partWithMarker = markerPrefix + partText
        currentCardContent.push(partWithMarker)
        currentCardHeight += calculateParagraphHeight(linesToAdd, fontSize, lineSpacing)
      }

      remainingLines = remainingLines.slice(maxLinesInCurrentCard)

      // 保存当前卡片（如果有内容）
      if (currentCardContent.length > 0) {
        cards.push([...currentCardContent])
        currentCardContent = []
        currentCardHeight = 0
      }

      // 如果还有剩余行，创建新卡片继续放入
      while (remainingLines.length > 0) {
        const remainingHeightInNewCard = availableHeight
        const maxLines = Math.floor(remainingHeightInNewCard / calculateLineHeight(fontSize, lineSpacing))

        if (maxLines <= 0) break

        const linesToAdd = remainingLines.slice(0, maxLines)
        const partText = linesToAdd.map(l => l.text).join(' ')
        const partWithMarker = markerPrefix + partText
        currentCardContent.push(partWithMarker)
        currentCardHeight += calculateParagraphHeight(linesToAdd, fontSize, lineSpacing)

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
    const MIN_REMAINING_SPACE = 5 // 最小剩余空间阈值（进一步降低以最大化空间利用）

    if (remainingSpace < MIN_REMAINING_SPACE) {
      // 剩余空间太小，直接移到新卡片
      if (currentCardContent.length > 0) {
        cards.push([...currentCardContent])
        currentCardContent = []
        currentCardHeight = 0
      }
      currentCardContent.push(paragraph)
      currentCardHeight = paragraphHeight
    } else {
      // 尝试将段落拆分以更好地填充剩余空间
      const lineHeight = calculateLineHeight(fontSize, lineSpacing)
      const maxLinesInCurrentCard = Math.floor(remainingSpace / lineHeight)

      // 获取原始段落的标记类型
      const getMarkerPrefix = () => {
        if (/^\s*#\s+/.test(paragraph)) return '# '
        if (/^\s*##\s+/.test(paragraph)) return '## '
        if (/^\s*###\s+/.test(paragraph)) return '### '
        if (/^\s*>\s*/.test(paragraph)) return '> '
        return ''
      }
      const markerPrefix = getMarkerPrefix()

      if (maxLinesInCurrentCard > 0) {
        // 可以放入一些行到当前卡片
        const linesToAdd = lines.slice(0, Math.min(maxLinesInCurrentCard, lines.length))
        const remainingLines = lines.slice(Math.min(maxLinesInCurrentCard, lines.length))

        if (linesToAdd.length > 0) {
          const partText = linesToAdd.map(l => l.text).join(' ')
          const partWithMarker = markerPrefix + partText
          currentCardContent.push(partWithMarker)
          currentCardHeight += calculateParagraphHeight(linesToAdd, fontSize, lineSpacing)
        }

        // 如果当前卡片已经接近满了，保存它
        if (availableHeight - currentCardHeight < calculateLineHeight(fontSize, lineSpacing) * 1.5) {
          cards.push([...currentCardContent])
          currentCardContent = []
          currentCardHeight = 0
        }

        // 处理剩余的行
        if (remainingLines.length > 0) {
          const remainingText = remainingLines.map(l => l.text).join(' ')
          const remainingWithMarker = markerPrefix + remainingText
          currentCardContent.push(remainingWithMarker)
          currentCardHeight = calculateParagraphHeight(remainingLines, fontSize, lineSpacing)
        }
      } else {
        // 即使一行也放不下，也移到新卡片（这种情况应该很少发生）
        if (currentCardContent.length > 0) {
          cards.push([...currentCardContent])
          currentCardContent = []
          currentCardHeight = 0
        }
        currentCardContent.push(paragraph)
        currentCardHeight = paragraphHeight
      }
    }
  }

  // 处理最后一张卡片
  if (currentCardContent.length > 0) {
    cards.push([...currentCardContent])
  }

  return cards
}