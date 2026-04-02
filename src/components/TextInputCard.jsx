import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings, Play, Download, ShieldQuestion, X } from "lucide-react";

const TextInputCard = ({
  text,
  onTextChange,
  onSplitTextToCards,
  onExportCards,
  cards,
  onToggleFullscreen,
  isFullscreen,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader className="py-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            文案输入
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(true)}
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

      {/* 使用说明弹窗 */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                使用说明 - Markdown 语法
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(false)}
                className="p-1">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-60px)]">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                      **粗体文本**
                    </span>
                    <span className="text-slate-600">或</span>
                    <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                      __粗体文本__
                    </span>
                  </h4>
                  <p className="text-slate-700 ml-4">渲染为加粗的文本</p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                      *斜体文本*
                    </span>
                    <span className="text-slate-600">或</span>
                    <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                      _斜体文本_
                    </span>
                  </h4>
                  <p className="text-slate-700 ml-4">渲染为斜体的文本</p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                      `代码`
                    </span>
                  </h4>
                  <p className="text-slate-700 ml-4">
                    渲染为灰色背景的等宽字体代码块
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">标题</h4>
                  <div className="space-y-2 ml-4">
                    <div>
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                        # 一级标题
                      </span>
                      <span className="text-slate-600 ml-2">：字体1.6倍</span>
                    </div>
                    <div>
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                        ## 二级标题
                      </span>
                      <span className="text-slate-600 ml-2">：字体1.4倍</span>
                    </div>
                    <div>
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                        ### 三级标题
                      </span>
                      <span className="text-slate-600 ml-2">：字体1.2倍</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">
                    <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                      - 列表项
                    </span>
                  </h4>
                  <p className="text-slate-700 ml-4">带有1em左边距</p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    水平对齐
                  </h4>
                  <div className="space-y-2 ml-4">
                    <div>
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                        : 左对齐文字
                      </span>
                      <span className="text-slate-600 ml-2">
                        ：左对齐（冒号后必须有空格）
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                        : 居中文字 :
                      </span>
                      <span className="text-slate-600 ml-2">
                        ：居中对齐（冒号前后都要有空格）
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                        右对齐文字 :
                      </span>
                      <span className="text-slate-600 ml-2">
                        ：右对齐（冒号前后都要有空格）
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      注意：英文冒号前后必须有空格，避免与中文冒号 ： 冲突
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">
                    使用示例：
                  </h4>
                  <pre className="font-mono text-sm bg-white p-3 rounded border overflow-x-auto">
                    {`# 欢迎使用

这是一段 **粗体** 和 *斜体* 的示例。

## 功能介绍

这里展示一些 \`代码\` 示例：

- 第一项功能
- 第二项功能
- 第三项功能

: 左对齐文字
: 居中文字 :
右对齐文字 :

:> :居中引用文字:
> 引用内容

:> ##右对齐标题:`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TextInputCard;
