import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

import { FontList } from '@/config/config'

// 默认样式配置
const DEFAULT_STYLE = {
  width: 600,
  height: 800,
  padding: 40,
  backgroundColor: 'rgb(157,41,51)',
  backgroundImage: '/images/card_bg.png',
  fontSize: 18,
  fontFamily: 'HuiwenMingchao',
  textColor: '#ffffff',
  lineSpacing: 10,
  copyrightText: '诗词赏析 | @学古诗',
  copyrightBottom: 5,
  copyrightFontSize: 10
}

// 摘录卡片样式
const QUOTE_STYLE = {
  padding: 56,
  fontSize: 30,
  copyrightBottom: 20,
  copyrightFontSize: 18,
  textColor: '#333333'
}

const CardSettings = ({ cardStyle, onCardStyleChange }) => {
  const [recentBgColors, setRecentBgColors] = useState([])
  const [activeStyle, setActiveStyle] = useState('default') // 'default' | 'quote'
  const textColorOptions = ['#ffffff', '#333333']
  const bgColorOptions = ['rgb(5, 119, 72)', 'rgb(157, 41, 51)', 'rgb(255, 255, 255)']

  // 从 localStorage 加载最近使用的背景色
  useEffect(() => {
    const savedColors = localStorage.getItem('recentBgColors')
    if (savedColors) {
      try {
        setRecentBgColors(JSON.parse(savedColors))
      } catch (e) {
        console.error('Failed to parse saved colors:', e)
      }
    }
  }, [])

  // 保存最近使用的背景色到 localStorage
  const saveRecentColor = (color) => {
    if (!color || !color.startsWith('#')) return
    
    // 检查颜色是否已存在
    const filteredColors = recentBgColors.filter(c => c !== color)
    // 添加新颜色到开头
    const updatedColors = [color, ...filteredColors].slice(0, 5)
    setRecentBgColors(updatedColors)
    localStorage.setItem('recentBgColors', JSON.stringify(updatedColors))
  }

  const handleStyleChange = (key, value) => {
    onCardStyleChange({
      ...cardStyle,
      [key]: value
    })

    // 如果是背景色改变，保存到最近使用的颜色
    if (key === 'backgroundColor') {
      saveRecentColor(value)
    }
  }

  // 应用摘录卡片样式
  const applyQuoteStyle = () => {
    onCardStyleChange({
      ...cardStyle,
      ...QUOTE_STYLE
    })
    setActiveStyle('quote')
  }

  // 重置为默认样式
  const resetToDefault = () => {
    onCardStyleChange({
      ...DEFAULT_STYLE
    })
    setActiveStyle('default')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>卡片样式设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 快捷样式切换 */}
        <div className="flex gap-2">
          <Button
            variant={activeStyle === 'quote' ? 'default' : 'outline'}
            size="sm"
            onClick={applyQuoteStyle}
            className={`flex-1 ${activeStyle === 'quote' ? 'bg-slate-800 text-white ring-2 ring-slate-400' : ''}`}
          >
            摘录卡片
          </Button>
          <Button
            variant={activeStyle === 'default' ? 'default' : 'outline'}
            size="sm"
            onClick={resetToDefault}
            className={`flex-1 ${activeStyle === 'default' ? 'bg-slate-800 text-white ring-2 ring-slate-400' : ''}`}
          >
            默认样式
          </Button>
        </div>
        <div className="space-y-2">
          <Label>卡片尺寸: {cardStyle.width} × {cardStyle.height}</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width">宽度</Label>
              <Input
                id="width"
                type="number"
                value={cardStyle.width}
                onChange={(e) => handleStyleChange('width', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="height">高度</Label>
              <Input
                id="height"
                type="number"
                value={cardStyle.height}
                onChange={(e) => handleStyleChange('height', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>内边距: {cardStyle.padding}px</Label>
          <Slider
            value={[cardStyle.padding]}
            onValueChange={([value]) => handleStyleChange('padding', value)}
            max={100}
            step={4}
          />
        </div>

        <div className="space-y-2">
          <Label>字体大小: {cardStyle.fontSize}px</Label>
          <Slider
            value={[cardStyle.fontSize]}
            onValueChange={([value]) => handleStyleChange('fontSize', value)}
            min={12}
            max={48}
            step={2}
          />
        </div>

        <div className="space-y-2">
          <Label>行间距: {cardStyle.lineSpacing}px</Label>
          <Slider
            value={[cardStyle.lineSpacing]}
            onValueChange={([value]) => handleStyleChange('lineSpacing', value)}
            min={4}
            max={40}
            step={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bgColor">背景颜色</Label>
          <div className="flex gap-2">
            <Input
              id="bgColor"
              value={cardStyle.backgroundColor}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            />
            <input
              type="color"
              value={cardStyle.backgroundColor.startsWith('#') ? cardStyle.backgroundColor : '#9d2933'}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="w-12 h-10 rounded border"
            />
          </div>
          {/* 备用背景色 */}
          <div className="flex gap-1 flex-wrap">
            {bgColorOptions.map((color, index) => (
              <button
                key={index}
                onClick={() => handleStyleChange('backgroundColor', color)}
                className="w-8 h-8 rounded border cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 transition-all"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          {/* 最近使用的背景色 */}
          {recentBgColors.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {recentBgColors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleStyleChange('backgroundColor', color)}
                  className="w-8 h-8 rounded border cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 transition-all"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="textColor">文字颜色</Label>
          <div className="flex gap-2">
            <Input
              id="textColor"
              value={cardStyle.textColor}
              onChange={(e) => handleStyleChange('textColor', e.target.value)}
            />
            <input
              type="color"
              value={cardStyle.textColor}
              onChange={(e) => handleStyleChange('textColor', e.target.value)}
              className="w-12 h-10 rounded border"
            />
          </div>
          {/* 文字颜色备选 */}
          <div className="flex gap-1">
            {textColorOptions.map((color, index) => (
              <button
                key={index}
                onClick={() => handleStyleChange('textColor', color)}
                className="w-8 h-8 rounded border cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 transition-all"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fontFamily">字体</Label>
          <select
            id="fontFamily"
            value={cardStyle.fontFamily}
            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
            className="w-full p-2 border rounded"
          >
            { 
              FontList.map(font => (
                <option key={font.name} value={font.name}>{ font.extra_name}</option>
              ))
            }
          </select>
        </div>

        {/* 背景图上传 */}
        <div className="space-y-2">
          <Label>背景图片</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    handleStyleChange('backgroundImage', event.target.result)
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="flex-1"
            />
            {cardStyle.backgroundImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStyleChange('backgroundImage', '')}
              >
                清除
              </Button>
            )}
          </div>
          {cardStyle.backgroundImage && (
            <div className="mt-2">
              <img
                src={cardStyle.backgroundImage}
                alt="背景预览"
                className="w-full h-20 object-cover rounded border"
              />
            </div>
          )}
          <p className="text-xs text-slate-500">支持 JPG、PNG、GIF、WebP 等图片格式</p>
        </div>

        {/* Copyright 设置 */}
        <div className="space-y-2 pt-4 border-t">
          <Label>底部版权信息</Label>
          <Input
            placeholder="版权信息文案"
            value={cardStyle.copyrightText || ''}
            onChange={(e) => handleStyleChange('copyrightText', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">距底部距离</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={cardStyle.copyrightBottom}
                  onChange={(e) => handleStyleChange('copyrightBottom', parseInt(e.target.value) || 0)}
                />
                <span className="text-sm text-slate-500">px</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">字号</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={cardStyle.copyrightFontSize}
                  onChange={(e) => handleStyleChange('copyrightFontSize', parseInt(e.target.value) || 12)}
                />
                <span className="text-sm text-slate-500">px</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CardSettings