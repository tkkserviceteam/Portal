"use client";
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface IconProps {
  id: string;
  name: string;
  x: number;
  y: number;
}

export default function DraggableIcon({ id, name, x, y }: IconProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  // 計算移動後的樣式
  const style = {
    // 這裡使用 transform 來處理拖拽中的位移，使用 top/left 處理固定位置
    transform: CSS.Translate.toString(transform),
    top: `${y}px`,
    left: `${x}px`,
    position: 'absolute' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex flex-col items-center justify-center w-24 h-24 cursor-grab active:cursor-grabbing group z-10"
    >
      {/* 圖示主體 */}
      <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 group-hover:bg-white/30">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
          {name.substring(0, 1)}
        </div>
      </div>
      {/* 文字標籤 */}
      <span className="mt-2 text-white text-xs font-medium drop-shadow-md px-2 py-0.5 rounded bg-black/20">
        {name}
      </span>
    </div>
  );
}