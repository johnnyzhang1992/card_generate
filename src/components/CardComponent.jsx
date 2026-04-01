import React from 'react'

// Markdown 渲染函数
const renderMarkdown = (text, baseStyle) => {
  if (!text) return null
  
  // 处理空行
  if (text.trim() === '') {
    return <div style={{ height: `${baseStyle.lineSpacing}px` }} />
  }
  
  let processedText = text
  const elements = []
  let keyCounter = 0
  
  // 1. 处理代码块 `code`
  const codeRegex = /`([^`]+)`/g
  const codeElements = []
  let match
  let lastIndex = 0
  
  while ((match = codeRegex.exec(processedText)) !== null) {
    // 添加之前的普通文本
    if (match.index > lastIndex) {
      codeElements.push({
        type: 'text',
        content: processedText.substring(lastIndex, match.index)
      })
    }
    
    // 添加代码文本
    codeElements.push({
      type: 'code',
      content: match[1]
    })
    
    lastIndex = codeRegex.lastIndex
  }
  
  // 添加剩余的普通文本
  if (lastIndex < processedText.length) {
    codeElements.push({
      type: 'text',
      content: processedText.substring(lastIndex)
    })
  }
  
  // 2. 处理每个元素中的粗体和斜体
  codeElements.forEach(element => {
    if (element.type === 'text') {
      // 处理粗体 **text**
      const boldRegex = /\*\*(.+?)\*\*/g
      let processedContent = element.content
      let boldMatches = []
      let boldLastIndex = 0
      
      while ((match = boldRegex.exec(processedContent)) !== null) {
        if (match.index > boldLastIndex) {
          boldMatches.push({
            type: 'normal',
            content: processedContent.substring(boldLastIndex, match.index)
          })
        }
        
        boldMatches.push({
          type: 'bold',
          content: match[1]
        })
        
        boldLastIndex = boldRegex.lastIndex
      }
      
      if (boldLastIndex < processedContent.length) {
        boldMatches.push({
          type: 'normal',
          content: processedContent.substring(boldLastIndex)
        })
      }
      
      // 处理斜体 *text*
      boldMatches.forEach(boldElement => {
        if (boldElement.type === 'normal') {
          const italicRegex = /\*([^*]+)\*/g
          let processedItalicContent = boldElement.content
          let italicMatches = []
          let italicLastIndex = 0
          
          while ((match = italicRegex.exec(processedItalicContent)) !== null) {
            if (match.index > italicLastIndex) {
              italicMatches.push({
                type: 'normal',
                content: processedItalicContent.substring(italicLastIndex, match.index)
              })
            }
            
            italicMatches.push({
              type: 'italic',
              content: match[1]
            })
            
            italicLastIndex = italicRegex.lastIndex
          }
          
          if (italicLastIndex < processedItalicContent.length) {
            italicMatches.push({
              type: 'normal',
              content: processedItalicContent.substring(italicLastIndex)
            })
          }
          
          // 渲染斜体元素
          italicMatches.forEach(italicElement => {
            if (italicElement.type === 'normal') {
              elements.push(
                <span key={`text-${keyCounter++}`}>{italicElement.content}</span>
              )
            } else if (italicElement.type === 'italic') {
              elements.push(
                <em key={`italic-${keyCounter++}`} style={{ fontStyle: 'italic' }}>
                  {italicElement.content}
                </em>
              )
            }
          })
        } else if (boldElement.type === 'bold') {
          elements.push(
            <strong key={`bold-${keyCounter++}`} style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
              {boldElement.content}
            </strong>
          )
        }
      })
    } else if (element.type === 'code') {
      elements.push(
        <code 
          key={`code-${keyCounter++}`} 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            padding: '2px 4px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.9em'
          }}
        >
          {element.content}
        </code>
      )
    }
  })
  
  return elements
}

const CardComponent = ({ cardContent, index, cardStyle }) => {
  // 现在cardContent是段落数组，每个段落可能包含多行
  const paragraphs = Array.isArray(cardContent) ? cardContent : []
  
  return (
    <div
      className="text-card bg-white  shadow-lg"
      style={{
        width: cardStyle.width,
        minHeight: cardStyle.height,
        backgroundColor: cardStyle.backgroundColor,
        backgroundImage: cardStyle.backgroundImage ? `url(${cardStyle.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: cardStyle.padding,
        color: cardStyle.textColor,
        fontSize: cardStyle.fontSize,
        fontFamily: cardStyle.fontFamily,
        lineHeight: `${cardStyle.fontSize * 1.2 + cardStyle.lineSpacing}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        textAlign: 'left',
        whiteSpace: 'pre-wrap' // 保留换行符
      }}
    >
      {paragraphs.map((paragraph, i) => {
        // 检测段落格式并设置字体大小和间距
        let fontSize = cardStyle.fontSize
        let lineSpacing = cardStyle.lineSpacing
        let paragraphText = paragraph

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

        if (centerAlignPattern.test(paragraph)) {
          // :文字 : 居中对齐（冒号前后都要有空格）
          textAlign = 'center'
          paragraphText = paragraph.replace(centerAlignPattern, '$1').trim()
        } else if (leftAlignPattern.test(paragraph)) {
          // : 文字 左对齐（注意：需要先匹配居中，因为居中也以:开头）
          textAlign = 'left'
          paragraphText = paragraph.replace(leftAlignPattern, '$1').trim()
        } else if (rightAlignPattern.test(paragraph)) {
          // 文字 : 右对齐（冒号前后都要有空格）
          textAlign = 'right'
          paragraphText = paragraph.replace(rightAlignPattern, '$1').trim()
        }

        // 第二步：处理引用（可以与其他格式组合）
        const quotePattern = /^\s*>\s*/
        if (quotePattern.test(paragraphText)) {
          // 字体0.9倍，透明度0.85，间距0.5倍
          fontSize = cardStyle.fontSize * 0.9
          opacity = 0.8
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
          fontSize = cardStyle.fontSize * 1.2
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
        
        // 处理空行：空行显示为透明占位符
        if (paragraphText === '') {
          return (
            <div key={i} style={{ 
              height: `${lineSpacing}px`,
              marginBottom: (i === paragraphs.length - 1) ? 0 : lineSpacing
            }} />
          )
        }
        
        // 使用 Markdown 渲染
        const baseStyle = { fontSize, lineSpacing }
        const markdownContent = renderMarkdown(paragraphText.trim(), baseStyle)
        
        return (
          <div key={i} style={{
            marginBottom: (i === paragraphs.length - 1) ? 0 : lineSpacing,
            fontSize: `${fontSize}px`,
            paddingLeft: paddingLeft > 0 ? `${paddingLeft}em` : undefined,
            letterSpacing: '0.1em',
            lineHeight: `${fontSize * 1.4 + lineSpacing}px`,
            width: '100%',
            opacity: opacity,
            textAlign: textAlign
          }}>
            {markdownContent}
          </div>
        )
      })}
    </div>
  )
}

export default CardComponent