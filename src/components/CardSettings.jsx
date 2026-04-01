import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

import { FontList } from '@/config/config'

const CardSettings = ({ cardStyle, onCardStyleChange }) => {
  const [recentBgColors, setRecentBgColors] = useState([])
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>卡片样式设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  )
}

export default CardSettings