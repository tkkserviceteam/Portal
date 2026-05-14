"use client";
import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import DraggableIcon from './components/DraggableIcon'; // 確保路徑與你實際一致
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Desktop() {
  const [icons, setIcons] = useState<any[]>([]);

  // 1. 初始化讀取
  useEffect(() => {
    const fetchIcons = async () => {
      const { data } = await supabase.from('user_desktop_icons').select('*');
      if (data) setIcons(data);
    };
    fetchIcons();
  }, []);

  const sensors = useSensors(useSensor(MouseSensor, {
    activationConstraint: { distance: 5 } // 移動超過 5px 才算拖拽，方便區分單擊
  }));

  // 2. 處理拖拽結束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    
    setIcons((prevIcons) => 
      prevIcons.map((icon) => {
        if (icon.id === active.id) {
          const newX = icon.pos_x + delta.x;
          const newY = icon.pos_y + delta.y;
          
          // 非同步更新資料庫
          supabase.from('user_desktop_icons')
            .update({ pos_x: newX, pos_y: newY })
            .eq('id', active.id)
            .then(({ error }) => {
              if (error) console.error("更新失敗:", error);
            });

          return { ...icon, pos_x: newX, pos_y: newY };
        }
        return icon;
      })
    );
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[url('https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center">
      
      {/* 頂部選單列 (Menu Bar) */}
      <nav className="absolute top-0 w-full h-8 bg-white/10 backdrop-blur-md flex items-center px-4 justify-between text-white text-sm z-50 border-b border-white/5">
        <div className="flex gap-4 items-center">
          <span className="font-bold"></span>
          <span className="font-semibold">Finder</span>
          <span className="hidden sm:block">File</span>
          <span className="hidden sm:block">Edit</span>
        </div>
        <div className="flex gap-4 items-center">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </nav>

      {/* 桌面圖示區域 */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="relative w-full h-full pt-10">
          {icons.map((icon) => (
            <DraggableIcon 
              key={icon.id} 
              id={icon.id} 
              name={icon.name} 
              x={icon.pos_x} 
              y={icon.pos_y} 
              url={icon.url} // 傳入 URL 供雙擊跳轉
            />
          ))}
        </div>
      </DndContext>

      {/* 底部 Dock (裝飾用) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-16 px-4 bg-white/20 backdrop-blur-2xl border border-white/30 rounded-2xl flex items-center gap-4 shadow-2xl">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl cursor-not-allowed opacity-80" title="未來擴充" />
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl cursor-not-allowed opacity-80" title="未來擴充" />
      </div>

    </main>
  );
}