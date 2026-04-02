// 智能分割文本到多张卡片 - 使用统一文本布局计算
// import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import {
  calculateLineHeight,
  calculateParagraphHeight,
  calculateTextLayout,
  detectParagraphStyle,
  stripMarkdownMarkers,
  LETTER_SPACING
} from '@/utils/textLayout'

// 查找最佳拆分点：在保持句子完整的前提下尽可能填满空间
const findBestSplitPoint = (lines, maxLines) => {
  if (lines.length <= maxLines) return lines.length
  
  const sentenceEndMarks = ['。', '！', '？', '!', '?', '…']
  const clauseEndMarks = ['；', ';', '，', ',']
  
  // 策略：从maxLines开始向前查找最近的标点，找到就返回（最大化利用空间）
  // 先找句子结束标点
  for (let i = 0; i < maxLines; i++) {
    const lineIndex = maxLines - i
    if (lineIndex <= 0) break
    const lastChar = (lines[lineIndex - 1]?.text || '').trim().slice(-1)
    if (sentenceEndMarks.includes(lastChar)) return lineIndex
  }
  
  // 再找分句标点
  for (let i = 0; i < maxLines; i++) {
    const lineIndex = maxLines - i
    if (lineIndex <= 0) break
    const lastChar = (lines[lineIndex - 1]?.text || '').trim().slice(-1)
    if (clauseEndMarks.includes(lastChar)) return lineIndex
  }
  
  // 最后手段：向后查找，看能否多塞一行完整句子
  const lookaheadLimit = 3
  for (let i = 1; i <= lookaheadLimit; i++) {
    const lineIndex = maxLines + i
    if (lineIndex > lines.length) break
    const lastChar = (lines[lineIndex - 1]?.text || '').trim().slice(-1)
    if (sentenceEndMarks.includes(lastChar)) return lineIndex
  }
  
  // 实在找不到标点，只能在maxLines处截断
  return maxLines
}

// 从lines数组重建文本，在指定位置拆分
const splitLinesAt = (lines, splitIndex) => {
  const firstPart = lines.slice(0, splitIndex)
  const secondPart = lines.slice(splitIndex)
  return { firstPart, secondPart }
}

// 从lines数组生成带标记的文本
const linesToText = (lines, markerPrefix) => {
  return markerPrefix + lines.map(l => l.text).join('')
}

export const splitTextToCards = (text, cardStyle) => {
  if (!text.trim()) return []

  const cards = []

  // 计算卡片可用区域（考虑内边距）
  const availableWidth = cardStyle.width - cardStyle.padding * 2
  const availableHeight = cardStyle.height - cardStyle.padding * 2

  let currentCardContent = []
  let currentCardHeight = 0

  // 按自然换行符分割文本，保留所有空行
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    // 检测段落格式
    const { fontSize, lineSpacing } = detectParagraphStyle(paragraph, cardStyle)

    // 移除 markdown 标记以获取纯文本用于计算宽度
    const pureText = stripMarkdownMarkers(paragraph).trim()

    // 使用Pretext计算文本布局（考虑 letterSpacing）
    const { lines } = calculateTextLayout(pureText, cardStyle.fontFamily, fontSize, availableWidth, LETTER_SPACING)

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
      const lineHeight = calculateLineHeight(fontSize, lineSpacing)

      let remainingLines = [...lines]

      // 先尝试放入当前卡片的剩余空间
      const maxLinesInCurrentCard = Math.floor(remainingSpace / lineHeight)

      if (maxLinesInCurrentCard > 0) {
        // 使用智能拆分点查找
        const splitIndex = findBestSplitPoint(remainingLines, maxLinesInCurrentCard)
        const { firstPart, secondPart } = splitLinesAt(remainingLines, splitIndex)
        
        if (firstPart.length > 0) {
          const partText = linesToText(firstPart, markerPrefix)
          currentCardContent.push(partText)
          currentCardHeight += calculateParagraphHeight(firstPart, fontSize, lineSpacing)
        }
        
        remainingLines = secondPart
      }

      // 保存当前卡片（如果有内容）
      if (currentCardContent.length > 0) {
        cards.push([...currentCardContent])
        currentCardContent = []
        currentCardHeight = 0
      }

      // 如果还有剩余行，创建新卡片继续放入
      while (remainingLines.length > 0) {
        const maxLines = Math.floor(availableHeight / lineHeight)

        if (maxLines <= 0) break

        // 使用智能拆分点查找
        const splitIndex = findBestSplitPoint(remainingLines, maxLines)
        const { firstPart, secondPart } = splitLinesAt(remainingLines, splitIndex)
        
        const partText = linesToText(firstPart, markerPrefix)
        currentCardContent.push(partText)
        currentCardHeight += calculateParagraphHeight(firstPart, fontSize, lineSpacing)

        remainingLines = secondPart

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
        // 使用智能拆分点查找
        const splitIndex = findBestSplitPoint(lines, maxLinesInCurrentCard)
        const { firstPart, secondPart } = splitLinesAt(lines, splitIndex)

        if (firstPart.length > 0) {
          const partText = linesToText(firstPart, markerPrefix)
          currentCardContent.push(partText)
          currentCardHeight += calculateParagraphHeight(firstPart, fontSize, lineSpacing)
        }

        // 如果当前卡片已经接近满了，保存它
        if (availableHeight - currentCardHeight < lineHeight * 1.5) {
          cards.push([...currentCardContent])
          currentCardContent = []
          currentCardHeight = 0
        }

        // 处理剩余的行
        if (secondPart.length > 0) {
          const remainingWithMarker = linesToText(secondPart, markerPrefix)
          currentCardContent.push(remainingWithMarker)
          currentCardHeight = calculateParagraphHeight(secondPart, fontSize, lineSpacing)
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