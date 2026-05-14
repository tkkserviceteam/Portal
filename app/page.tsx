"use client";
import React, { useState } from 'react';
import { DndContext, DragEndEvent, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import DraggableIcon from './components/DraggableIcon';

export default function Desktop() {
  // 1. 設定初始圖示狀態（之後會從 Supabase 讀取）
  const [icons, setIcons] = useState([
    { id: 'parts-search', name: '料號查詢', x: 50, y: 50 },
  ]);

  // 設定感應器（避免點擊與拖拽衝突）
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 }, // 移動超過 5px 才觸發拖拽
    })
  );

  // 2. 處理拖拽結束動作
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    
    setIcons((prev) => 
      prev.map((icon) => {
        if (icon.id === active.id) {
          return {
            ...icon,
            x: icon.x + delta.x,
            y: icon.y + delta.y,
          };
        }
        return icon;
      })
    );
    
    // TODO: 這裡之後會加入「儲存回 Supabase」的 API 呼叫
    console.log("新座標已儲存:", active.id, "更新後的位置");
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[url('https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center">
      
      {/* 頂部選單 */}
      <nav className="absolute top-0 w-full h-8 bg-white/10 backdrop-blur-md flex items-center px-4 justify-between text-white text-sm z-50">
        <div className="flex gap-4">
          <span className="font-bold"></span>
          <span className="font-semibold">Finder</span>
        </div>
      </nav>

      {/* 拖拽區域 */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="relative w-full h-full pt-10">
          {icons.map((icon) => (
            <DraggableIcon key={icon.id} {...icon} />
          ))}
        </div>
      </DndContext>

      {/* 底部 Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-16 px-3 bg-white/20 backdrop-blur-2xl border border-white/30 rounded-2xl flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-500 rounded-xl" />
        <div className="w-12 h-12 bg-gray-500 rounded-xl" />
      </div>
    </main>
  );
}