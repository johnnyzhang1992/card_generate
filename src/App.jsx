import React, { useState } from "react";
import CardPreview from "@/components/CardPreview";
import CardSettings from "@/components/CardSettings";
import TextInputCard from "@/components/TextInputCard";
import { splitTextToCards } from "@/utils/textSplitter";
import { exportCards } from "@/utils/exporter";

import "./style.css";

// 默认卡片样式常量
const DEFAULT_CARD_STYLE = {
  width: 600,
  height: 800,
  padding: 40,
  backgroundColor: "rgb(157,41,51)",
  backgroundImage: "/images/card_bg.png",
  fontSize: 20,
  fontFamily: "HuiwenMingchao",
  textColor: "#ffffff",
  lineSpacing: 10,
  // Copyright 设置
  copyrightText: "诗词赏析 | @学古诗",
  copyrightBottom: 5,
  copyrightFontSize: 10,
};

function App() {
  const [text, setText] = useState("");
  const [cards, setCards] = useState([]);
  const [cardStyle, setCardStyle] = useState(DEFAULT_CARD_STYLE);
  const [scale, setScale] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 智能分割文本到多张卡片
  const handleSplitTextToCards = () => {
    const newCards = splitTextToCards(text, cardStyle);
    setCards(newCards);
  };

  // 导出卡片为图片
  const handleExportCards = async () => {
    await exportCards(cardStyle, cards);
  };

  // 处理文本变化
  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  // 处理卡片样式变化
  const handleCardStyleChange = (newStyle) => {
    setCardStyle(newStyle);
  };

  // 处理缩放变化
  const handleScaleChange = (newScale) => {
    setScale(newScale);
  };

  // 切换全屏模式
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 退出全屏模式（ESC键）
  const handleKeyDown = (e) => {
    if (e.key === "Escape" && isFullscreen) {
      setIsFullscreen(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6"
      onKeyDown={handleKeyDown}>
      <div className="max-w-8xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            文案卡片生成器
          </h1>
          <p className="text-slate-600 -textsm">输入文案，自动生成精美的卡片</p>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6`}>
          {/* 左侧：文案输入 */}
          <div
            className={`lg:col-span-3 ${isFullscreen ? "lg:col-span-full" : "sticky top-0  h-[calc(100vh-10rem)] "}`}>
            <TextInputCard
              text={text}
              onTextChange={handleTextChange}
              onSplitTextToCards={handleSplitTextToCards}
              onExportCards={handleExportCards}
              cards={cards}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>

          {/* 中间：卡片预览 */}
          <div
            className={`lg:col-span-6 ${isFullscreen ? "w-full" : "sticky top-0  h-[calc(100vh-10rem)]"}`}>
            <div className="h-full overflow-y-auto p-2">
              <CardPreview
                cards={cards}
                cardStyle={cardStyle}
                scale={scale}
                onScaleChange={handleScaleChange}
              />
            </div>
          </div>

          {/* 右侧：卡片设置 */}
          <div
            className={`lg:col-span-3 ${isFullscreen ? "w-full" : "l sticky top-0  h-[calc(100vh-10rem)] overflow-y-auto"}`}>
            <CardSettings
              cardStyle={cardStyle}
              onCardStyleChange={handleCardStyleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
