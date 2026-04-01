// 智能分割文本到多张卡片 - 使用Pretext实现精确文本测量
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

export const splitTextToCards = (text, cardStyle) => {
  if (!text.trim()) return []

  const cards = []

  // 计算卡片可用区域（考虑内边距）
  const availableWidth = cardStyle.width - cardStyle.padding * 2
  const availableHeight = cardStyle.height - cardStyle.padding * 2

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
  const calculateParagraphHeight = (_paragraph, fontSize, lineSpacing) => {
    const lineHeight = fontSize * 1.4 + lineSpacing
    return lineHeight
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

    // 调试日志
    console.log('[Pretext] Text:', pureText.substring(0, 20), 'Height:', height, 'Lines:', lines.length, 'Available:', availableHeight)

    return { height, lines, fontSize, lineSpacing }
  }

  let currentCardContent = []
  let currentCardHeight = 0

  // 按自然换行符分割文本，保留所有空行
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    // 使用Pretext计算这个段落需要的高度和行信息
    const paragraphMetrics = calculateParagraphWithPretext(paragraph)

    console.log('[Split] Height:', paragraphMetrics.height, 'Available:', availableHeight, 'CurrentHeight:', currentCardHeight, 'WillSplit:', paragraphMetrics.height > availableHeight)

    // 检查当前卡片是否能容纳这个段落
    // 需要检查：当前高度 + 段落高度 <= 可用高度
    // 如果段落高度超过可用高度的85%，也视为需要跨卡片处理
    const shouldSplitParagraph = paragraphMetrics.height > availableHeight * 0.85
    
    if (currentCardHeight + paragraphMetrics.height <= availableHeight && !shouldSplitParagraph) {
      // 可以放入当前卡片，直接添加整个段落
      currentCardContent.push(paragraph)
      currentCardHeight += paragraphMetrics.height
    } else {
      // 当前卡片放不下这个段落，需要分页

      // 先保存当前卡片的内容
      if (currentCardContent.length > 0) {
        cards.push([...currentCardContent])
        currentCardContent = []
        currentCardHeight = 0
      }

      // 检查段落是否需要跨多个卡片
      if (paragraphMetrics.height > availableHeight) {
        // 段落需要跨多个卡片，需要智能拆分
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
        
        while (remainingLines.length > 0) {
          const remainingHeightInCard = availableHeight - currentCardHeight

          if (remainingHeightInCard <= 0) {
            // 当前卡片已满，创建新卡片
            if (currentCardContent.length > 0) {
              cards.push([...currentCardContent])
              currentCardContent = []
              currentCardHeight = 0
            }
            continue
          }

          // 计算能容纳多少行
          const maxLines = Math.floor(remainingHeightInCard / lineHeight)

          if (maxLines <= 0) {
            // 无法容纳一行，创建新卡片
            if (currentCardContent.length > 0) {
              cards.push([...currentCardContent])
              currentCardContent = []
              currentCardHeight = 0
            }
            continue
          }

          const linesToAdd = remainingLines.slice(0, maxLines)
          const partText = linesToAdd.map(l => l.text).join('\n')
          const partHeight = linesToAdd.length * lineHeight

          if (partText.trim().length > 0) {
            // 还原markdown标记，并保持换行
            const partLines = partText.split('\n')
            const partWithMarkers = partLines.map(line => markerPrefix + line).join('\n')
            currentCardContent.push(partWithMarkers)
            currentCardHeight += partHeight
          }

          remainingLines = remainingLines.slice(maxLines)

          // 如果还有剩余行但当前卡片已满，需要创建新卡片
          if (remainingLines.length > 0 && currentCardHeight >= availableHeight) {
            cards.push([...currentCardContent])
            currentCardContent = []
            currentCardHeight = 0
          }
        }
      } else {
        // 段落可以放入新卡片，直接添加整个段落
        currentCardContent.push(paragraph)
        currentCardHeight = paragraphMetrics.height
      }
    }
  }

  // 处理最后一张卡片
  if (currentCardContent.length > 0) {
    cards.push([...currentCardContent])
  }

  console.log('[Result] Total cards:', cards.length, 'Cards:', cards.map(c => c.length))

  return cards
}