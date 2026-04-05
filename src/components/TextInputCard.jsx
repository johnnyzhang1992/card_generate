import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Play,
  Download,
  ShieldQuestion,
  Bold,
  Italic,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
} from "lucide-react";

const MarkdownToolbar = ({ textareaRef, onTextChange, value }) => {
  const getLineRange = (pos) => {
    const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
    const lineEnd = value.indexOf("\n", pos);
    return { lineStart, lineEnd: lineEnd === -1 ? value.length : lineEnd };
  };

  const parseLinePrefixes = (line) => {
    let remaining = line;
    let alignPrefix = "";
    let alignSuffix = "";
    let headingPrefix = "";
    let quotePrefix = "";
    let listPrefix = "";

    // 解析最外层对齐标记
    const centerAlignMatch = remaining.match(/^:\s+(.+)\s+:$/);
    const leftAlignMatch = remaining.match(/^:\s+(.+)$/);

    if (centerAlignMatch) {
      alignPrefix = ": ";
      alignSuffix = " :";
      remaining = centerAlignMatch[1];
    } else if (leftAlignMatch) {
      alignPrefix = ": ";
      remaining = leftAlignMatch[1];
    } else {
      // 右对齐：使用更精确的正则，避免内容中的冒号干扰
      // 匹配末尾的 " :" 但要求前面的内容不以冒号结尾
      const rightAlignMatch = remaining.match(/^(.+[^:])\s+:\s*$/);
      if (rightAlignMatch && !remaining.startsWith(":") && !remaining.startsWith("#") && !remaining.startsWith(">")) {
        alignSuffix = " :";
        remaining = rightAlignMatch[1];
      }
    }

    // 解析标题标记
    const headingMatch = remaining.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      headingPrefix = headingMatch[1] + " ";
      remaining = headingMatch[2];
    }

    // 解析引用标记
    const quoteMatch = remaining.match(/^>\s+(.*)$/);
    if (quoteMatch) {
      quotePrefix = "> ";
      remaining = quoteMatch[1];
    }

    // 解析列表标记
    const listMatch = remaining.match(/^-\s+(.*)$/);
    if (listMatch) {
      listPrefix = "- ";
      remaining = listMatch[1];
    }

    return { alignPrefix, alignSuffix, headingPrefix, quotePrefix, listPrefix, content: remaining };
  };

  const buildLine = (parsed) => {
    return parsed.alignPrefix + parsed.headingPrefix + parsed.quotePrefix + parsed.listPrefix + parsed.content + parsed.alignSuffix;
  };

  const toggleLinePrefix = (type, level = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { lineStart, lineEnd } = getLineRange(textarea.selectionStart);
    const currentLine = value.substring(lineStart, lineEnd);
    const parsed = parseLinePrefixes(currentLine);

    if (type === "heading") {
      const headings = ["# ", "## ", "### "];
      const currentLevel = headings.indexOf(parsed.headingPrefix);
      if (currentLevel === level) {
        parsed.headingPrefix = "";
      } else {
        parsed.headingPrefix = headings[level];
      }
    } else if (type === "quote") {
      parsed.quotePrefix = parsed.quotePrefix ? "" : "> ";
    } else if (type === "list") {
      parsed.listPrefix = parsed.listPrefix ? "" : "- ";
    }

    const newLine = buildLine(parsed);
    const newText = value.substring(0, lineStart) + newLine + value.substring(lineEnd);
    onTextChange({ target: { value: newText } });

    setTimeout(() => {
      textarea.focus();
      const contentStart = lineStart + parsed.alignPrefix.length + parsed.headingPrefix.length + parsed.quotePrefix.length + parsed.listPrefix.length;
      textarea.setSelectionRange(contentStart, contentStart);
    }, 0);
  };

  const toggleAlignment = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { lineStart, lineEnd } = getLineRange(textarea.selectionStart);
    const currentLine = value.substring(lineStart, lineEnd);
    const parsed = parseLinePrefixes(currentLine);

    // 清除所有对齐标记（包括另一端的 :）
    parsed.alignPrefix = "";
    parsed.alignSuffix = "";

    // 根据类型设置新的对齐标记
    if (type === "left") {
      parsed.alignPrefix = ": ";
    } else if (type === "center") {
      parsed.alignPrefix = ": ";
      parsed.alignSuffix = " :";
    } else if (type === "right") {
      parsed.alignSuffix = " :";
    }

    const newLine = buildLine(parsed);
    const newText = value.substring(0, lineStart) + newLine + value.substring(lineEnd);
    onTextChange({ target: { value: newText } });

    setTimeout(() => {
      textarea.focus();
      const contentStart = lineStart + parsed.alignPrefix.length + parsed.headingPrefix.length + parsed.quotePrefix.length + parsed.listPrefix.length;
      const contentEnd = contentStart + parsed.content.length;
      textarea.setSelectionRange(contentStart, contentEnd);
    }, 0);
  };

  const toggleMarkdown = (before, after = "", placeholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (!selectedText) {
      const newText =
        value.substring(0, start) +
        before +
        placeholder +
        (after || before) +
        value.substring(end);
      onTextChange({ target: { value: newText } });
      setTimeout(() => {
        textarea.focus();
        const cursorPos = start + before.length;
        textarea.setSelectionRange(cursorPos, cursorPos + placeholder.length);
      }, 0);
      return;
    }

    const beforeLen = before.length;
    const afterLen = (after || before).length;

    const hasBefore = value.substring(start - beforeLen, start) === before;
    const hasAfter = value.substring(end, end + afterLen) === (after || before);

    let newText;
    let newStart;
    let newEnd;

    if (hasBefore && hasAfter) {
      newText =
        value.substring(0, start - beforeLen) +
        selectedText +
        value.substring(end + afterLen);
      newStart = start - beforeLen;
      newEnd = end - beforeLen;
    } else {
      newText =
        value.substring(0, start) +
        before +
        selectedText +
        (after || before) +
        value.substring(end);
      newStart = start + beforeLen;
      newEnd = end + beforeLen;
    }

    onTextChange({ target: { value: newText } });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const tools = [
    { icon: <Heading1 className="w-4 h-4" />, action: () => toggleLinePrefix("heading", 0), title: "一级标题" },
    { icon: <Heading2 className="w-4 h-4" />, action: () => toggleLinePrefix("heading", 1), title: "二级标题" },
    { icon: <Heading3 className="w-4 h-4" />, action: () => toggleLinePrefix("heading", 2), title: "三级标题" },
    { type: "separator" },
    { icon: <Bold className="w-4 h-4" />, action: () => toggleMarkdown("**", "**", "粗体文本"), title: "粗体" },
    { icon: <Italic className="w-4 h-4" />, action: () => toggleMarkdown("*", "*", "斜体文本"), title: "斜体" },
    { icon: <Quote className="w-4 h-4" />, action: () => toggleLinePrefix("quote"), title: "引用" },
    { icon: <List className="w-4 h-4" />, action: () => toggleLinePrefix("list"), title: "列表项" },
    { type: "separator" },
    { icon: <AlignLeft className="w-4 h-4" />, action: () => toggleAlignment("left"), title: "左对齐" },
    { icon: <AlignCenter className="w-4 h-4" />, action: () => toggleAlignment("center"), title: "居中对齐" },
    { icon: <AlignRight className="w-4 h-4" />, action: () => toggleAlignment("right"), title: "右对齐" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 rounded-lg border">
      {tools.map((tool, index) =>
        tool.type === "separator" ? (
          <div key={`sep-${index}`} className="w-px h-5 bg-slate-300 mx-1" />
        ) : (
          <button
            key={index}
            type="button"
            onClick={tool.action}
            title={tool.title}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            {tool.icon}
          </button>
        )
      )}
    </div>
  );
};

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
  const textareaRef = useRef(null);

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

          <MarkdownToolbar
            textareaRef={textareaRef}
            onTextChange={onTextChange}
            value={text}
          />

          <Textarea
            ref={textareaRef}
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
