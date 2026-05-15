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
  icon?: string; // 修改：將 iconType 改為 icon，與 Supabase 欄位名稱一致
}

export default function DraggableIcon({ id, name, x, y, onOpen, icon }: IconProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    top: `${y}px`,
    left: `${x}px`,
    position: 'absolute',
    zIndex: isDragging ? 100 : 10,
    // transition 確保吸附格線與邊界縮回時有動畫感
    transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
    touchAction: 'none', 
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // 寬度響應式：手機寬度 20 (80px)，電腦寬度 24 (96px)，配合 page.tsx 的邊界計算
      className="flex flex-col items-center justify-center w-20 sm:w-24 h-24 select-none group"
    >
      {/* 圖示本體 */}
      <div 
        {...listeners} 
        {...attributes}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className={`
          w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg 
          backdrop-blur-md border border-white/30 transition-all duration-200
          ${isDragging 
            ? 'bg-white/40 cursor-grabbing scale-110 shadow-2xl' 
            : 'bg-white/20 cursor-grab hover:bg-white/30 group-active:scale-90'
          }
        `}
      >
        <div className="text-2xl sm:text-3xl filter drop-shadow-sm">
          {/* 修改：優先顯示 Supabase 傳來的 icon，如果沒有則根據名稱判斷或顯示預設 */}
          {icon ? (
            icon.startsWith('http') ? (
              <img src={icon} alt={name} className="w-10 h-10 object-contain" />
            ) : (
              icon
            )
          ) : (
            name === "料號查詢" ? "🔍" : "📁"
          )}
        </div>
      </div>

      {/* 檔案名稱標籤 */}
      <span className={`
        mt-2 text-black text-[10px] sm:text-[11px] font-medium drop-shadow-md 
        bg-[#FF88004D] px-2 py-0.5 rounded-md transition-opacity
        max-w-[90%] truncate // 增加 max-w 避免手機上標籤文字太長超出螢幕
        ${isDragging ? 'opacity-0' : 'opacity-100'}
      `}>
        {name}
      </span>

      {/* 選中裝飾 */}
      {!isDragging && (
        <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/10 rounded-xl pointer-events-none" />
      )}
    </div>
  );
}