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
    
    // 调试日志
    console.log('[Pretext] Paragraph:', paragraph.substring(0, 50), 'Height:', paragraphMetrics.height, 'Remaining:', remainingSpace, 'Available:', availableHeight)

    // 情况1：剩余空间足够放入整个段落
    if (remainingSpace >= paragraphMetrics.height) {
      currentCardContent.push(paragraph)
      currentCardHeight += paragraphMetrics.height
      console.log('[Pretext] Added to current card. New height:', currentCardHeight)
      continue
    }

    // 情况2：段落高度超过单张卡片可用高度（需要跨卡片分割）
    if (paragraphMetrics.height > availableHeight) {
      console.log('[Pretext] Paragraph exceeds card height, splitting across cards')
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
          console.log('[Pretext] Added', linesToAdd.length, 'lines to current card from overflow paragraph')
        }

        remainingLines = remainingLines.slice(maxLinesInCurrentCard)
      }

      // 保存当前卡片（如果有内容）
      if (currentCardContent.length > 0) {
        cards.push([...currentCardContent])
        console.log('[Pretext] Saved current card with', currentCardContent.length, 'paragraphs')
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
          console.log('[Pretext] Created new card with', linesToAdd.length, 'lines from overflow paragraph')
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

    // 情况3：剩余空间不足，段落可以放入新卡片
    // 如果当前卡片剩余空间足够多（>200px），则拆分段落填充剩余空间
    // 否则直接移到新卡片
    const SPACE_THRESHOLD = 200 // 最小剩余空间阈值
    
    if (remainingSpace > SPACE_THRESHOLD) {
      // 拆分段落：部分填充当前卡片，剩余放入新卡片
      console.log('[Pretext] Splitting paragraph to fill remaining space:', remainingSpace)
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
      
      if (maxLinesInCurrentCard > 0 && maxLinesInCurrentCard < lines.length) {
        // 拆分段落
        const linesToAdd = lines.slice(0, maxLinesInCurrentCard)
        const remainingLines = lines.slice(maxLinesInCurrentCard)
        const partHeight = linesToAdd.length * lineHeight
        const remainingHeight = remainingLines.length * lineHeight

        // 构建当前卡片的文本（每行加前缀，用换行符连接）
        const partText = linesToAdd.map(l => l.text).join('\n')
        const partWithMarkers = partText.split('\n').map(line => markerPrefix + line).join('\n')
        currentCardContent.push(partWithMarkers)
        currentCardHeight += partHeight
        console.log('[Pretext] Added', linesToAdd.length, 'lines to current card')

        // 保存当前卡片
        cards.push([...currentCardContent])
        console.log('[Pretext] Saved current card')
        currentCardContent = []
        currentCardHeight = 0

        // 构建新卡片的文本
        const remainingText = remainingLines.map(l => l.text).join('\n')
        const remainingWithMarkers = remainingText.split('\n').map(line => markerPrefix + line).join('\n')
        currentCardContent.push(remainingWithMarkers)
        currentCardHeight = remainingHeight
        console.log('[Pretext] Added remaining', remainingLines.length, 'lines to new card')
      }
    } else {
      // 剩余空间不足，直接移到新卡片
      console.log('[Pretext] Remaining space too small, moving paragraph to new card')
      if (currentCardContent.length > 0) {
        cards.push([...currentCardContent])
        currentCardContent = []
        currentCardHeight = 0
      }
      currentCardContent.push(paragraph)
      currentCardHeight = paragraphMetrics.height
    }
  }

  // 处理最后一张卡片
  if (currentCardContent.length > 0) {
    cards.push([...currentCardContent])
    console.log('[Pretext] Saved final card with', currentCardContent.length, 'paragraphs')
  }

  console.log('[Pretext] Total cards generated:', cards.length)
  return cards
}