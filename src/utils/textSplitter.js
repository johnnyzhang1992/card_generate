// 智能分割文本到多张卡片
export const splitTextToCards = (text, cardStyle) => {
  if (!text.trim()) return []

  const cards = []

  // 创建虚拟canvas来计算文本实际尺寸
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return []

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
    // 行高计算：1.4em (与 CSS 保持一致)
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

  // 辅助函数：计算段落需要的行数（考虑 markdown 格式）
  const calculateParagraphLines = (paragraph) => {
    if (paragraph.trim() === '') {
      // 空行使用默认行高
      const { fontSize, lineSpacing } = detectParagraphStyle(paragraph)
      const lineHeight = calculateParagraphHeight(paragraph, fontSize, lineSpacing)
      return { lines: 1, height: lineHeight, fontSize, lineSpacing }
    }

    // 检测段落格式
    const { fontSize, lineSpacing } = detectParagraphStyle(paragraph)
    const lineHeight = calculateParagraphHeight(paragraph, fontSize, lineSpacing)

    // 获取纯文本（移除 markdown 标记）
    const pureText = stripMarkdownMarkers(paragraph).trim()

    // 设置对应的字体
    ctx.font = `${fontSize}px ${cardStyle.fontFamily}`

    // 检查段落能否在一行内显示
    const lineMetrics = ctx.measureText(pureText)

    if (lineMetrics.width <= availableWidth) {
      return { lines: 1, height: lineHeight, fontSize, lineSpacing }
    }

    // 段落需要拆分成多行
    let linesCount = 0
    let remainingText = pureText

    while (remainingText.length > 0) {
      linesCount++

      const lineMetrics = ctx.measureText(remainingText)

      if (lineMetrics.width <= availableWidth) {
        break
      }

      // 需要分割为多行
      let lineStart = 0
      let lineEnd = remainingText.length

      // 二分查找找到合适的行分割点
      while (lineStart < lineEnd) {
        const mid = Math.floor((lineStart + lineEnd) / 2)
        const testText = remainingText.substring(0, mid)
        const testMetrics = ctx.measureText(testText)

        if (testMetrics.width <= availableWidth) {
          lineStart = mid + 1
        } else {
          lineEnd = mid
        }
      }

      // 寻找合适的断点
      let splitPos = Math.max(1, lineEnd - 1)
      let foundBreak = false

      for (let i = splitPos; i > 0; i--) {
        const char = remainingText[i]
        if (char === '。' || char === '！' || char === '？' || char === '，' || char === '、' || char === ' ') {
          splitPos = i + 1
          foundBreak = true
          break
        }
      }

      if (!foundBreak && splitPos <= 0) splitPos = 1

      const lineText = remainingText.substring(0, splitPos).trim()
      if (lineText.length > 0) {
        remainingText = remainingText.substring(splitPos).trim()
      } else {
        break
      }
    }

    const totalHeight = linesCount * lineHeight
    return { lines: linesCount, height: totalHeight, fontSize, lineSpacing }
  }

  let currentCardContent = []
  let currentCardHeight = 0

  // 按自然换行符分割文本，保留所有空行
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    // 计算这个段落需要的行数和高度
    const paragraphMetrics = calculateParagraphLines(paragraph)

    // 检查当前卡片是否能容纳这个段落
    if (currentCardHeight + paragraphMetrics.height <= availableHeight) {
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
        const { fontSize, lineSpacing } = paragraphMetrics
        const lineHeight = calculateParagraphHeight(paragraph, fontSize, lineSpacing)

        const trimmedParagraph = paragraph.trim()
        const pureText = stripMarkdownMarkers(trimmedParagraph)
        let remainingText = pureText

        ctx.font = `${fontSize}px ${cardStyle.fontFamily}`

        // 辅助函数：在语义断点处拆分段落
        const splitParagraphAtSemanticBreak = (text, maxHeight) => {
          if (text.trim() === '') return { part: '', remaining: '' }

          const sentenceEndings = ['。', '！', '？', '；', ';']
          let bestBreakPoint = -1

          let testText = text
          let usedHeight = 0

          while (testText.length > 0 && usedHeight < maxHeight) {
            const lineMetrics = ctx.measureText(testText)

            if (lineMetrics.width <= availableWidth) {
              usedHeight += lineHeight

              if (usedHeight >= maxHeight) {
                return {
                  part: text.substring(0, text.length - testText.length).trim(),
                  remaining: testText
                }
              }
              break
            }

            // 需要分割为多行
            let lineStart = 0
            let lineEnd = testText.length

            while (lineStart < lineEnd) {
              const mid = Math.floor((lineStart + lineEnd) / 2)
              const testTextSegment = testText.substring(0, mid)
              const testMetrics = ctx.measureText(testTextSegment)

              if (testMetrics.width <= availableWidth) {
                lineStart = mid + 1
              } else {
                lineEnd = mid
              }
            }

            let splitPos = Math.max(1, lineEnd - 1)

            // 检查是否有句子结束符号
            for (let i = splitPos; i > 0; i--) {
              if (sentenceEndings.includes(testText[i])) {
                bestBreakPoint = i + 1
                break
              }
            }

            // 如果没有找到句子结束，检查逗号
            if (bestBreakPoint === -1) {
              for (let i = splitPos; i > 0; i--) {
                if (testText[i] === '，' || testText[i] === ',') {
                  bestBreakPoint = i + 1
                  break
                }
              }
            }

            if (bestBreakPoint === -1) {
              bestBreakPoint = splitPos
            }

            const lineText = testText.substring(0, bestBreakPoint).trim()
            if (lineText.length > 0) {
              usedHeight += lineHeight
              testText = testText.substring(bestBreakPoint).trim()

              if (usedHeight >= maxHeight) {
                const processedLength = text.length - testText.length
                return {
                  part: text.substring(0, processedLength).trim(),
                  remaining: testText
                }
              }
            } else {
              break
            }
          }

          return { part: text, remaining: '' }
        }

        while (remainingText.length > 0) {
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

          // 智能拆分段落
          const { part, remaining } = splitParagraphAtSemanticBreak(remainingText, remainingHeightInCard)

          if (part.length > 0) {
            const partMetrics = calculateParagraphLines(part)

            if (partMetrics.height <= remainingHeightInCard) {
              currentCardContent.push(part)
              currentCardHeight += partMetrics.height
              remainingText = remaining
            } else {
              const { part: smallerPart, remaining: smallerRemaining } =
                splitParagraphAtSemanticBreak(part, remainingHeightInCard)

              if (smallerPart.length > 0) {
                currentCardContent.push(smallerPart)
                const smallerMetrics = calculateParagraphLines(smallerPart)
                currentCardHeight += smallerMetrics.height
                remainingText = smallerRemaining + (remaining.length > 0 ? ' ' + remaining : '')
              } else {
                break
              }
            }
          } else {
            break
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

  return cards
}