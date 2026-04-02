// 文本布局计算工具 - 统一预览和导出的文本高度计算
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

// 全局 letterSpacing 设置（0.1em）
export const LETTER_SPACING = 0.1

/**
 * 计算单行文本的高度（包括行高）
 * @param {number} fontSize - 字体大小（px）
 * @param {number} lineSpacing - 行间距（px）
 * @returns {number} 单行高度（px）
 */
export const calculateLineHeight = (fontSize, lineSpacing) => {
  // 行高 = 字体大小 * 1.4 + 行间距
  // 这个值对应于 CSS 的 line-height 属性
  return fontSize * 1.4 + lineSpacing
}

/**
 * 计算段落的总高度（包括所有行和行间距）
 * @param {Array} lines - Pretext 返回的行数组
 * @param {number} fontSize - 字体大小（px）
 * @param {number} lineSpacing - 行间距（px）
 * @returns {number} 段落总高度（px）
 */
export const calculateParagraphHeight = (lines, fontSize, lineSpacing) => {
  if (lines.length === 0) {
    // 空段落仍然占据一行的高度（用于占位）
    return calculateLineHeight(fontSize, lineSpacing)
  }

  const lineHeight = calculateLineHeight(fontSize, lineSpacing)
  // 总高度 = (行数 × 行高) + ((行数 - 1) × 行间距)
  // 这是因为除了最后一行外，每行都有下边距
  return lines.length * lineHeight + (lines.length - 1) * lineSpacing
}

/**
 * 计算文本在给定宽度下能容纳的字符数（考虑 letterSpacing）
 * @param {string} text - 纯文本内容
 * @param {string} fontFamily - 字体家族
 * @param {number} fontSize - 字体大小（px）
 * @param {number} availableWidth - 可用宽度（px）
 * @param {number} letterSpacing - 字符间距（em）
 * @returns {Object} 包含lines的对象，每行有text属性
 */
export const calculateTextLayout = (text, fontFamily, fontSize, availableWidth, letterSpacing = LETTER_SPACING) => {
  if (!text.trim()) {
    return { height: 0, lines: [] }
  }

  const font = `${fontSize}px ${fontFamily}`
  const prepared = prepareWithSegments(text, font)
  const { height, lines } = layoutWithLines(prepared, availableWidth, calculateLineHeight(fontSize, 0)) // 传入0作为lineSpacing因为我们自己计算

  // 如果有 letterSpacing，需要重新计算行拆分
  if (letterSpacing > 0) {
    const letterSpacingPx = fontSize * letterSpacing
    const adjustedLines = adjustLinesForLetterSpacing(lines, letterSpacingPx, availableWidth)
    return { height, lines: adjustedLines }
  }

  return { height, lines }
}

/**
 * 调整行以考虑 letterSpacing 的影响
 * 当有 letterSpacing 时，每行实际占用的宽度 = pretext测量的宽度 + (字符数-1) * letterSpacingPx
 * 需要确保调整后的行不会超过 availableWidth
 */
const adjustLinesForLetterSpacing = (lines, letterSpacingPx, availableWidth) => {
  if (lines.length === 0) return lines

  const adjustedLines = []
  let currentLineText = ''
  let currentLineWidth = 0

  for (const line of lines) {
    const lineText = line.text
    const extraWidth = Math.max(0, lineText.length - 1) * letterSpacingPx

    // 如果当前行加上 letterSpacing 后不超过可用宽度，直接加入
    if (currentLineText === '') {
      currentLineText = lineText
      currentLineWidth = line.width + extraWidth
    } else {
      // 尝试将当前行的文本合并到前一行
      const combinedText = currentLineText + ' ' + lineText
      const combinedExtraWidth = Math.max(0, combinedText.length - 1) * letterSpacingPx
      // 估算合并后的宽度（这里简化处理）
      const estimatedWidth = currentLineWidth + line.width + extraWidth

      if (estimatedWidth <= availableWidth) {
        currentLineText = combinedText
        currentLineWidth = estimatedWidth
      } else {
        // 保存当前行
        adjustedLines.push({ text: currentLineText, width: currentLineWidth })
        currentLineText = lineText
        currentLineWidth = line.width + extraWidth
      }
    }
  }

  // 保存最后一行
  if (currentLineText) {
    adjustedLines.push({ text: currentLineText, width: currentLineWidth })
  }

  return adjustedLines
}

/**
 * 检测段落格式并返回对应的字体大小和行间距
 * @param {string} paragraph - 原始段落文本
 * @param {Object} cardStyle - 卡片样式对象
 * @returns {Object} 包含fontSize和lineSpacing的对象
 */
export const detectParagraphStyle = (paragraph, cardStyle) => {
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

/**
 * 移除 markdown 标记以获取纯文本用于计算宽度
 * @param {string} paragraph - 原始段落文本
 * @returns {string} 去除标记后的纯文本
 */
export const stripMarkdownMarkers = (paragraph) => {
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