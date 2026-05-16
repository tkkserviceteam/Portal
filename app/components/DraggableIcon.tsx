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
      // --- 關鍵修改 1：設定固定寬高為 80px (GRID_SIZE 40 的兩倍) ---
      // 這樣放手吸附時，圖示與圖示之間就會以 40 的倍數完美緊貼，絕對不會發生重疊
      className="flex flex-col items-center justify-center w-[80px] h-[80px] select-none group"
    >
      {/* 圖示本體 */}
      <div 
        {...listeners} 
        {...attributes}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        // --- 關鍵修改 2：微調視覺圖示大小，在 80px 的格子裡留下一點呼吸空間 ---
        className={`
          w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shadow-lg 
          backdrop-blur-md border border-black/30 transition-all duration-200
          ${isDragging 
            ? 'bg-white/40 cursor-grabbing scale-110 shadow-2xl' 
            : 'bg-[#2D5F8F] cursor-grab hover:bg-[#D2A070] group-active:scale-90'
          }
        `}
      >
        {/* 內部圖片與 Emoji 判斷邏輯（完全保留你原本寫得很好的防呆） */}
        <div className="text-xl sm:text-2xl filter drop-shadow-sm flex items-center justify-center w-full h-full">
          {icon ? (
            icon.startsWith('http') || icon.startsWith('/') || icon.includes('.') ? (
              <img 
                src={icon} 
                alt={name} 
                // 配合圖示本體稍微縮小到 w-8 h-8，置中效果更好
                className="w-8 h-8 object-contain pointer-events-none select-none" 
                onError={(e) => {
                  e.currentTarget.src = ""; 
                  e.currentTarget.parentElement!.innerText = "📁";
                }}
              />
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
        mt-1 text-black text-[10px] sm:text-[11px] font-medium drop-shadow-md 
        bg-[#FFFFFFFF] px-1.5 py-0.2 rounded-md transition-opacity
        max-w-[95%] truncate // 放寬到 95% 讓 80px 寬度內能顯示更多字
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