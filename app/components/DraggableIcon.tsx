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
  onOpen: () => void;
}

export default function DraggableIcon({ id, name, x, y, onOpen }: IconProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  // 計算樣式
  const style: React.CSSProperties = {
    // dnd-kit 提供的位移量
    transform: CSS.Translate.toString(transform),
    top: `${y}px`,
    left: `${x}px`,
    position: 'absolute',
    // 拖拽時拉高層級，避免被其他圖示遮擋
    zIndex: isDragging ? 100 : 10,
    // 當不在拖拽狀態時，加入平滑動畫 (用於吸附格線時的視覺效果)
    transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
    touchAction: 'none', // 防止行動裝置上的預設手勢干擾
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-center justify-center w-24 h-24 select-none group"
    >
      {/* 圖示本體：綁定拖拽與點擊事件 */}
      <div 
        {...listeners} 
        {...attributes}
        onClick={(e) => {
          // 只有在不是拖拽的情況下才觸發點擊 (dnd-kit 感應器會處理 distance 判斷)
          e.stopPropagation();
          onOpen();
        }}
        className={`
          w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg 
          backdrop-blur-md border border-white/30 transition-colors duration-200
          ${isDragging 
            ? 'bg-white/40 cursor-grabbing scale-110 shadow-2xl' 
            : 'bg-white/20 cursor-grab hover:bg-white/30 group-active:scale-95'
          }
        `}
      >
        {/* 這裡未來可以根據不同的 icon 類型顯示不同 Emoji */}
        <div className="text-3xl filter drop-shadow-sm">🔍</div>
      </div>

      {/* 檔案名稱標籤 */}
      <span className={`
        mt-2 text-white text-[11px] font-medium drop-shadow-md 
        bg-black/30 px-2 py-0.5 rounded-md transition-opacity
        ${isDragging ? 'opacity-0' : 'opacity-100'}
      `}>
        {name}
      </span>

      {/* 簡單的選中效果裝飾 (選配) */}
      {!isDragging && (
        <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/10 rounded-xl pointer-events-none" />
      )}
    </div>
  );
}