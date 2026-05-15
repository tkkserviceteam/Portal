"use client";
import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import DraggableIcon from './components/DraggableIcon'; 
import { createClient } from '@supabase/supabase-js';

// --- 相容性補丁：修復 addListener 錯誤 ---
if (typeof window !== 'undefined') {
  const originalMatchMedia = window.matchMedia;
  // @ts-ignore
  window.matchMedia = (query: string) => {
    const mql = originalMatchMedia ? originalMatchMedia(query) : {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, 
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
    if (mql && !mql.addListener) {
      // @ts-ignore
      mql.addListener = () => {};
      // @ts-ignore
      mql.removeListener = () => {};
    }
    return mql;
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GRID_SIZE = 100;

export default function Desktop() {
  const [icons, setIcons] = useState<any[]>([]);
  const [openApps, setOpenApps] = useState<any[]>([]); 
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1. 初始化讀取與時間更新
  useEffect(() => {
    const fetchIcons = async () => {
      const { data } = await supabase.from('user_desktop_icons').select('*');
      if (data) setIcons(data);
    };
    fetchIcons();

    // 每分鐘更新一次時間
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const sensors = useSensors(useSensor(MouseSensor, {
    activationConstraint: { distance: 10 } 
  }));

  // 2. 處理開啟 App (分流邏輯)
const handleOpenApp = (app: any) => {
    // 1. 定義「特殊網址」的判斷條件
    // 只要網址包含 IP (211.75.18.228) 或 Lotus Notes 的副檔名 (.nsf)
    const isSpecialSystem = 
      app.url.includes('211.75.18.228') || 
      app.url.includes('.nsf') ||
      app.url.includes('tkkns1');

    if (isSpecialSystem) {
      // 2. 針對特殊網址：直接開啟「彈出式獨立視窗」
      // 這能解決登入過期 (401) 與腳本報錯問題
      const w = 1200;
      const h = 850;
      const left = (window.screen.width / 2) - (w / 2);
      const top = (window.screen.height / 2) - (h / 2);

      window.open(
        app.url, 
        `App_${app.id}`, 
        `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no`
      );
      // 直接 return，不讓它跑下面的 setOpenApps
      return; 
    }

    // 3. 一般網頁：維持在你原本設想的「入口網站虛擬視窗」開啟
    const isAlreadyOpen = openApps.find(a => a.id === app.id);
    if (!isAlreadyOpen) {
      setOpenApps([...openApps, app]);
    }
    setActiveAppId(app.id);
  };

  const handleCloseApp = (id: string) => {
    setOpenApps(prev => prev.filter(app => app.id !== id));
    if (activeAppId === id) setActiveAppId(null);
  };
  
  const goHome = () => {
    setActiveAppId(null); 
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    setIcons((prevIcons) => 
      prevIcons.map((icon) => {
        if (icon.id === active.id) {
          const rawX = icon.pos_x + delta.x;
          const rawY = icon.pos_y + delta.y;
          const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
          const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
          
          supabase.from('user_desktop_icons')
            .update({ pos_x: snappedX, pos_y: snappedY })
            .eq('id', active.id)
            .then();

          return { ...icon, pos_x: snappedX, pos_y: snappedY };
        }
        return icon;
      })
    );
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[url('/brushstroke-white.jpg')] bg-cover bg-center">
      
      {/* 頂部選單列 */}
      <nav className="absolute top-0 w-full h-8 bg-black/5 backdrop-blur-md flex items-center px-4 justify-between text-black text-sm z-50 border-b border-black/5">
        <div className="flex gap-4 items-center">
          <span className="font-bold text-lg">⛛</span>
          <span className="font-semibold">綜合資訊平台</span>
        </div>

        <div className="flex items-center gap-2 font-medium">
          <span>{currentTime.getFullYear()}年</span>
          <span>{(currentTime.getMonth() + 1).toString().padStart(2, '0')}月</span>
          <span>{currentTime.getDate().toString().padStart(2, '0')}日</span>
          <span className="ml-2">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        </div>
      </nav>

      {/* 1. 桌面圖示區域 */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="relative w-full h-full pt-12">
          {icons.map((icon) => (
            <DraggableIcon 
              key={icon.id} 
              id={icon.id}
              name={icon.name}
              x={icon.pos_x}
              y={icon.pos_y}
              onOpen={() => handleOpenApp(icon)} 
            />
          ))}
        </div>
      </DndContext>

      {/* 2. 虛擬視窗層 */}
      {openApps.map((app) => (
        <div 
          key={app.id}
          onClick={() => setActiveAppId(app.id)} 
          className={`absolute inset-10 mt-10 bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col transition-all duration-300 ${
            activeAppId === app.id ? 'z-40 opacity-100 scale-100' : 'z-0 opacity-0 pointer-events-none scale-95 hidden'
          }`}
          style={{ top: '40px', bottom: '100px' }}
        >
          <div className="h-9 bg-gray-100 border-b border-gray-300 flex items-center px-4 justify-between select-none cursor-default">
            <div className="flex gap-2">
              <div onClick={(e) => { e.stopPropagation(); handleCloseApp(app.id); }} className="w-3 h-3 bg-red-500 rounded-full cursor-pointer hover:bg-red-600 shadow-inner" />
              <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-30" />
              <div className="w-3 h-3 bg-green-500 rounded-full opacity-30" />
            </div>
            <span className="text-xs font-bold text-gray-500 tracking-wide uppercase">{app.name}</span>
            <div className="w-10" />
          </div>
          <iframe 
            src={app.url} 
            className="w-full h-full border-none bg-white"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          />
        </div>
      ))}

      {/* 3. 底部 Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-16 px-4 bg-white/30 backdrop-blur-3xl border border-white/40 rounded-2xl flex items-center gap-4 shadow-2xl z-50">
        <div 
          onClick={goHome}
          className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-md"
          title="顯示桌面"
        >
          🏠
        </div>
        
        {openApps.length > 0 && <div className="w-[1px] h-10 bg-black/10 mx-1" />}

        {openApps.map((app) => (
          <div 
            key={app.id}
            onClick={() => setActiveAppId(app.id)}
            className={`relative w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 group ${activeAppId === app.id ? 'bg-white/80 shadow-inner' : ''}`}
          >
            <span className="text-xl">🔍</span>
            {/* 視窗標題提示 */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {app.name}
            </span>
            {/* 開啟指示燈 */}
            <div className={`absolute -bottom-1.5 w-1 h-1 rounded-full transition-colors ${activeAppId === app.id ? 'bg-blue-600 scale-125' : 'bg-gray-500'}`} />
          </div>
        ))}
      </div>

    </main>
  );
}