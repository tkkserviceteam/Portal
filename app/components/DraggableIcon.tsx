"use client";
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface IconProps {
  id: string;
  name: string;
  x: number;
  y: number;
  url?: string;
}

export default function DraggableIcon({ id, name, x, y, url }: IconProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    top: `${y}px`,
    left: `${x}px`,
    position: 'absolute' as const,
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡，確保不會觸發到拖拽邏輯
    e.stopPropagation();
    console.log("嘗試跳轉至:", url); // 可以在瀏覽器 F12 檢查是否有印出
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // 將雙擊事件綁在最外層
      onDoubleClick={handleDoubleClick}
      className="flex flex-col items-center justify-center w-24 h-24 cursor-pointer z-10 select-none active:cursor-grabbing"
    >
      <div 
        {...listeners} 
        {...attributes}
        className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:bg-white/30 active:scale-90"
      >
        <div className="text-3xl">🔍</div>
      </div>
      <span className="mt-2 text-white text-xs font-medium drop-shadow-md bg-black/40 px-2 py-0.5 rounded">
        {name}
      </span>
    </div>
  );
}