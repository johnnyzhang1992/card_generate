import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings, Play, Download, ShieldQuestion } from "lucide-react";

const TextInputCard = ({
  text,
  onTextChange,
  onSplitTextToCards,
  onExportCards,
  cards,
  onToggleFullscreen,
  isFullscreen,
  onShowHelp,
}) => {

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader className="py-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            文案输入
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShowHelp()}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900">
            <ShieldQuestion className="w-4 h-4" />
            使用说明
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="text">输入文案</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900">
              {isFullscreen ? "退出全屏" : "全屏"}
              <span className="ml-1">{isFullscreen ? "⛶" : "⛶"}</span>
            </Button>
          </div>

          <Textarea
            id="text"
            value={text}
            onChange={onTextChange}
            placeholder="请输入您的文案内容..."
            className="min-h-[300px]"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={onSplitTextToCards} className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            生成卡片
          </Button>
        </div>

        {cards.length > 0 && (
          <Button onClick={onExportCards} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            导出所有卡片 ({cards.length}张)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TextInputCard;
