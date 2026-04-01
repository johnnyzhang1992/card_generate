import html2canvas from 'html2canvas'

// 创建隐藏的导出容器
const createExportContainer = () => {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.zIndex = '-1'
  document.body.appendChild(container)
  return container
}

// 创建用于导出的卡片元素
const createExportCard = (cardContent, cardStyle) => {
  const card = document.createElement('div')
  card.className = 'text-card'
  card.style.width = `${cardStyle.width}px`
  card.style.height = `${cardStyle.height}px` // 使用固定高度确保背景图正确显示
  card.style.backgroundColor = cardStyle.backgroundColor
  card.style.padding = `${cardStyle.padding}px`
  card.style.fontFamily = cardStyle.fontFamily
  card.style.fontSize = `${cardStyle.fontSize}px`
  card.style.color = cardStyle.textColor
  card.style.lineHeight = '1.4em'
  card.style.letterSpacing = '0.1em'
  card.style.boxSizing = 'border-box'
  card.style.display = 'flex'
  card.style.flexDirection = 'column'
  card.style.alignItems = 'flex-start'
  card.style.justifyContent = 'flex-start'
  card.style.textAlign = 'left'
  card.style.whiteSpace = 'pre-wrap'
  card.style.overflow = 'hidden'
  
  // 添加背景图片
  if (cardStyle.backgroundImage) {
    card.style.backgroundImage = `url(${cardStyle.backgroundImage})`
    card.style.backgroundSize = 'cover'
    card.style.backgroundPosition = 'center'
    card.style.backgroundRepeat = 'no-repeat'
  }

  // 添加文本内容
  cardContent.forEach((paragraph, i) => {
    const container = document.createElement('div')
    
    // 检测段落格式并设置字体大小和间距
    let fontSize = cardStyle.fontSize
    let lineSpacing = cardStyle.lineSpacing
    let paragraphText = paragraph.trim()

    // 设置左边距变量
    let paddingLeft = 0
    // 设置透明度变量
    let opacity = 1
    // 设置文本对齐变量
    let textAlign = 'left'

    // 第一步：处理对齐方式（独立处理，不与其他格式冲突）
    // :开头 → 左对齐（必须有空格区分中文冒号）
    const leftAlignPattern = /^\s*:\s+(.+)/
    // :开头:结尾 → 居中对齐
    const centerAlignPattern = /^\s*:\s+(.+)\s+:$/
    // 文字:结尾 → 右对齐（必须有空格区分中文冒号）
    const rightAlignPattern = /^\s*(.+?)\s+:\s*$/

    // 使用已trim的文本进行对齐检测
    if (centerAlignPattern.test(paragraphText)) {
      // :文字 : 居中对齐（冒号前后都要有空格）
      textAlign = 'center'
      paragraphText = paragraphText.replace(centerAlignPattern, '$1').trim()
    } else if (leftAlignPattern.test(paragraphText)) {
      // : 文字 左对齐（注意：需要先匹配居中，因为居中也以:开头）
      textAlign = 'left'
      paragraphText = paragraphText.replace(leftAlignPattern, '$1').trim()
    } else if (rightAlignPattern.test(paragraphText)) {
      // 文字 : 右对齐（冒号前后都要有空格）
      textAlign = 'right'
      paragraphText = paragraphText.replace(rightAlignPattern, '$1').trim()
    }

    // 第二步：处理引用（可以与其他格式组合）
    const quotePattern = /^\s*>\s*/
    if (quotePattern.test(paragraphText)) {
      // 字体0.9倍，透明度0.85，间距0.5倍
      fontSize = cardStyle.fontSize * 0.9
      opacity = 0.85
      lineSpacing = cardStyle.lineSpacing * 0.5
      // 移除>标记
      paragraphText = paragraphText.replace(quotePattern, '')
    }

    // 第三步：处理标题格式
    const h1Pattern = /^\s*#\s+(.+)/
    const h2Pattern = /^\s*##\s+(.+)/
    const h3Pattern = /^\s*###\s+(.+)/

    if (h1Pattern.test(paragraphText)) {
      // 一级标题：字体1.6倍，间距1.5倍
      fontSize = cardStyle.fontSize * 1.6
      lineSpacing = cardStyle.lineSpacing * 1.5
      // 移除#标记
      paragraphText = paragraphText.replace(h1Pattern, '$1')
    } else if (h2Pattern.test(paragraphText)) {
      // 二级标题：字体1.4倍，间距1.2倍
      fontSize = cardStyle.fontSize * 1.4
      lineSpacing = cardStyle.lineSpacing * 1.2
      // 移除##标记
      paragraphText = paragraphText.replace(h2Pattern, '$1')
    } else if (h3Pattern.test(paragraphText)) {
      // 三级标题：字体1.2倍
      // 移除###标记
      paragraphText = paragraphText.replace(h3Pattern, '$1')
    }

    // 第四步：处理数字标题
    const chineseNumberPattern = /^\s*[一二三四五六七八九十]、/g
    const arabicNumberPattern = /^\s*\d+、/g

    if (chineseNumberPattern.test(paragraphText)) {
      // 大写汉字标题：字体1.4倍
      fontSize = cardStyle.fontSize * 1.4
    } else if (arabicNumberPattern.test(paragraphText)) {
      // 阿拉伯数字标题：字体1.2倍
      fontSize = cardStyle.fontSize * 1.2
    }

    // 第五步：处理列表项
    const dashPattern = /^\s*-\s/gi
    // 处理水平分隔线 --- 变成空行
    const horizontalRulePattern = /^\s*-{3,}\s*$/

    if (horizontalRulePattern.test(paragraphText)) {
      // --- 变成空行
      paragraphText = ''
    } else if (dashPattern.test(paragraphText)) {
      // 以"- "开头的段落：设置1em左边距
      paddingLeft = 1
      // 保留原文本，不需要移除"- "
    }
    
    // 设置容器样式
    container.style.fontSize = `${fontSize}px`
    container.style.marginBottom = `${lineSpacing}px`
    container.style.lineHeight = `${fontSize * 1.4 + lineSpacing}px`
    if (paddingLeft > 0) {
      container.style.paddingLeft = `${paddingLeft}em`
    }
    if (opacity < 1) {
      container.style.opacity = opacity
    }
    container.style.textAlign = textAlign
    
    // 处理空行：空行显示为透明占位符
    if (paragraphText === '') {
      container.style.height = `${lineSpacing}px`
      container.style.marginBottom = (i === cardContent.length - 1) ? '0px' : `${lineSpacing}px`
    } else {
      // 简单的 Markdown 支持：粗体、斜体、代码
      const htmlText = parseMarkdownToHtml(paragraphText)
      container.innerHTML = htmlText
    }
    
    card.appendChild(container)
  })

  return card
}

// 简单的 Markdown 到 HTML 转换函数（用于导出）
const parseMarkdownToHtml = (text) => {
  if (!text) return ''
  
  let result = text
  
  // 处理代码块 `code`
  result = result.replace(/`([^`]+)`/g, '<code style="background-color: rgba(0, 0, 0, 0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>')
  
  // 处理粗体 **text** 或 __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: bold; font-size: 1.1em;">$1</strong>')
  result = result.replace(/__(.+?)__/g, '<strong style="font-weight: bold; font-size: 1.1em;">$1</strong>')
  
  // 处理斜体 *text* 或 _text_
  result = result.replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>')
  result = result.replace(/_([^_]+)_/g, '<em style="font-style: italic;">$1</em>')
  
  return result
}

// 导出卡片为图片（使用html2canvas）
export const exportCards = async (cardStyle, cards) => {
  if (!cards || cards.length === 0) {
    console.error('没有卡片可导出')
    return
  }

  // 创建导出容器
  const container = createExportContainer()
  
  try {
    for (let index = 0; index < cards.length; index++) {
      const cardContent = cards[index]
      
      try {
        // 创建用于导出的卡片
        const exportCard = createExportCard(cardContent, cardStyle)
        container.appendChild(exportCard)
        
        // 等待字体加载和布局完成
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 使用固定高度确保背景图正确显示
        const exportHeight = cardStyle.height
        
        // 使用html2canvas将DOM元素转换为canvas
        const canvas = await html2canvas(exportCard, {
          width: cardStyle.width,
          height: exportHeight,
          scale: 3, // 提高导出图片质量
          backgroundColor: null, // 保持透明背景
          useCORS: true, // 支持跨域图片
          allowTaint: true, // 允许跨域图片
          logging: false
        })
        
        // 触发下载
        const link = document.createElement('a')
        link.download = `card-${index + 1}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        
        // 移除已导出的卡片
        container.removeChild(exportCard)
        
        // 添加短暂延迟，避免浏览器同时下载多个文件的问题
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`导出第${index + 1}张卡片失败:`, error)
      }
    }
  } finally {
    // 清理导出容器
    document.body.removeChild(container)
  }
}