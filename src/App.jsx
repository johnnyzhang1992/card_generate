import React, { useState } from 'react'
import CardPreview from '@/components/CardPreview'
import CardSettings from '@/components/CardSettings'
import TextInputCard from '@/components/TextInputCard'
import { splitTextToCards } from '@/utils/textSplitter'
import { exportCards } from '@/utils/exporter'

import './style.css'

function App() {
  const [text, setText] = useState('')
  const [cards, setCards] = useState([])
  const [cardStyle, setCardStyle] = useState({
    width: 600,
    height: 800,
    padding: 30,
    backgroundColor: 'rgb(157,41,51)',
    backgroundImage: '',
    fontSize: 18,
    fontFamily: 'HuiwenMingchao',
    textColor: '#ffffff',
    lineSpacing: 10
  })
  const [showSettings, setShowSettings] = useState(false)
  const [scale, setScale] = useState(0.65)

  // 智能分割文本到多张卡片
  const handleSplitTextToCards = () => {
    const newCards = splitTextToCards(text, cardStyle)
    setCards(newCards)
  }

  // 导出卡片为图片
  const handleExportCards = async () => {
    await exportCards(cardStyle, cards)
  }

  // 处理文本变化
  const handleTextChange = (e) => {
    setText(e.target.value)
  }

  // 切换设置面板显示
  const handleToggleSettings = () => {
    setShowSettings(!showSettings)
  }

  // 处理卡片样式变化
  const handleCardStyleChange = (newStyle) => {
    setCardStyle(newStyle)
  }

  // 处理缩放变化
  const handleScaleChange = (newScale) => {
    setScale(newScale)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">文案卡片生成器</h1>
          <p className="text-slate-600">输入文案，自动生成精美的卡片</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：输入和设置 */}
          <div className="lg:col-span-1 space-y-6">
            <TextInputCard
              text={text}
              onTextChange={handleTextChange}
              onSplitTextToCards={handleSplitTextToCards}
              onExportCards={handleExportCards}
              onToggleSettings={handleToggleSettings}
              cards={cards}
              showSettings={showSettings}
            />

            {showSettings && (
              <CardSettings
                cardStyle={cardStyle}
                onCardStyleChange={handleCardStyleChange}
              />
            )}
          </div>

          {/* 右侧：卡片预览 */}
          <div className="lg:col-span-2 sticky top-0 h-[calc(100vh-12rem)] overflow-hidden">
            <div className="h-full overflow-y-auto p-2">
              <CardPreview 
                cards={cards} 
                cardStyle={cardStyle} 
                scale={scale}
                onScaleChange={handleScaleChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App