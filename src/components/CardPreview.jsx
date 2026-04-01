import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CardComponent from './CardComponent'

const CardPreview = ({ cards, cardStyle, scale, onScaleChange }) => {

  // 计算缩放后的卡片样式
  const scaledCardStyle = {
    ...cardStyle,
    width: cardStyle.width * scale,
    height: cardStyle.height * scale,
    padding: cardStyle.padding * scale,
    fontSize: cardStyle.fontSize * scale,
    lineSpacing: cardStyle.lineSpacing * scale
  }

  // 缩放按钮样式
  const buttonStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease'
  }

  // 放大功能
  const zoomIn = () => {
    onScaleChange(Math.min(scale + 0.05, 2)) // 最大放大到200%
  }

  // 缩小功能
  const zoomOut = () => {
    onScaleChange(Math.max(scale - 0.05, 0.1)) // 最小缩小到10%
  }

  if (!cards || cards.length === 0) {
    return (
      <Card className="h-64 flex items-center justify-center">
        <CardContent className="text-center text-slate-500">
          <p>请输入文案并点击"生成卡片"按钮</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative h-full">
      {/* 缩放按钮组 */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 10,
        display: 'flex',
        gap: '8px'
      }}>
        {/* 缩小按钮 */}
        <button 
          style={buttonStyle}
          onClick={zoomOut}
          title={`缩小: 当前 ${Math.round(scale * 100)}%`}
        >
          -
        </button>
        
        {/* 放大按钮 */}
        <button 
          style={buttonStyle}
          onClick={zoomIn}
          title={`放大: 当前 ${Math.round(scale * 100)}%`}
        >
          +
        </button>
      </div>
      
      {/* 卡片预览区域 */}
      <div className="flex flex-row justify-center flex-wrap gap-4 w-full min-h-full">
        {cards.map((cardContent, index) => (
          <CardComponent
            key={index}
            cardContent={cardContent}
            index={index}
            cardStyle={scaledCardStyle}
          />
        ))}
      </div>
    </div>
  )
}

export default CardPreview