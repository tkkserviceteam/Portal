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

const GRID_SIZE = 40;

export default function Desktop() {
  const [icons, setIcons] = useState<any[]>([]);
  const [openApps, setOpenApps] = useState<any[]>([]); 
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

// 1. 初始化讀取與時間更新
  useEffect(() => {
    const fetchIcons = async () => {
      const { data } = await supabase.from('user_desktop_icons').select('*');
      if (data) {
        const correctedData = data.map(icon => {
          // 頂部防呆：第一排 (y=0) 絕對不能擺，強制移到第二排 (100)
          let safeY = icon.pos_y < GRID_SIZE ? GRID_SIZE : icon.pos_y;
          
          // 底部防呆：放寬限制，只要不壓到 Dock 範圍即可
          const maxY = window.innerHeight - 200;
          
          if (safeY > maxY) {
            // 超出邊界時，自動吸附到最接近底部但又不會壓到 Dock 的那一格
            safeY = Math.floor(maxY / GRID_SIZE) * GRID_SIZE;
          }
          
          return {
            ...icon,
            pos_y: safeY
          };
        });
        setIcons(correctedData);
      }
    };
    fetchIcons();

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const sensors = useSensors(useSensor(MouseSensor, {
    activationConstraint: { distance: 10 } 
  }));

  // 2. 處理開啟 App (分流邏輯)
const handleOpenApp = (app: any) => {
    // 1. 偵測是否為行動裝置 (手機或平板)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);

    // 2. 判斷是否為特殊系統 (原有的 IP 與 .nsf 判斷)
    const isSpecialSystem = 
      app.url.includes('211.75.18.228') || 
      app.url.includes('.nsf') ||
	  app.url.includes('asecl-facvdr') ||
      app.url.includes('tkkns1');

    if (isSpecialSystem || isMobile) {
      // 設定視窗尺寸 (電腦版有用，手機版則會影響瀏覽器決定如何開啟)
      const w = 1200;
      const h = 850;
      const left = (window.screen.width / 2) - (w / 2);
      const top = (window.screen.height / 2) - (h / 2);

      // --- 關鍵修改 ---
      // 在手機 Chrome 上，如果你不給太多複雜參數，它較容易觸發 "Custom Tab" 或 "Floating window"
      // 對於電腦，我們維持隱藏工具列的「獨立 App 感」
      const features = isMobile 
        ? "noopener,noreferrer" // 手機端：讓系統決定最佳開啟方式 (通常是 Chrome 漂浮視窗)
        : `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,status=no,location=no,toolbar=no,menubar=no`;

      const newWin = window.open(app.url, "_blank", features);
      
      if (newWin) {
        newWin.focus();
      }
      return;
    }

    // 3. 一般網頁 (電腦版且非特殊系統) 則繼續使用 iFrame
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
    
    // 1. 找出當前正在被拖拽的圖示原始資料
    const draggedIcon = icons.find(icon => icon.id === active.id);
    if (!draggedIcon) return;

    // 2. 計算預期的原始新座標
    const rawX = draggedIcon.pos_x + delta.x;
    const rawY = draggedIcon.pos_y + delta.y;

    // 周圍邊界防呆
    const paddingLeft = 20; 
    const paddingRight = 20;
    const iconWidth = 80; // 配合 DraggableIcon 的 80px 寬度
    const maxX = window.innerWidth - iconWidth - paddingRight;
    const maxY = window.innerHeight - 120; // 底部防呆距離

    const boundedX = Math.max(paddingLeft, Math.min(rawX, maxX));
    const boundedY = Math.max(GRID_SIZE, Math.min(rawY, maxY));

    // 3. 計算貼齊格線後（GRID_SIZE = 40）的目標座標
    const targetX = Math.round(boundedX / GRID_SIZE) * GRID_SIZE;
    const targetY = Math.round(boundedY / GRID_SIZE) * GRID_SIZE;

    // --- 核心安全防線：全方位九宮格碰撞檢查 ---
    // 限制新位置的 X 軸與 Y 軸距離其他圖示都必須「大於 40px」
    // 這樣不論是重合(0)、左右鄰居(40)、上下鄰居(40)、甚至斜對角鄰居，只要會造成視覺重疊一律攔截
    const isSpaceOccupied = icons.some((icon) => {
      if (icon.id === active.id) return false; // 排除自己
      
      const distanceX = Math.abs(icon.pos_x - targetX);
      const distanceY = Math.abs(icon.pos_y - targetY);
      
      // 只要 X 軸跟 Y 軸的距離同時小於等於 40px，就代表圖示的外框會疊到，判定為碰撞
      return distanceX <= 40 && distanceY <= 40;
    });

    setIcons((prevIcons) => 
      prevIcons.map((icon) => {
        if (icon.id === active.id) {
          // 如果偵測到上下左右或斜對角太接近其他圖示，直接拒絕，平滑彈回原位
          if (isSpaceOccupied) {
            console.warn(`位置與其他圖示重疊（上下左右安全距離不足），退回原位！`);
            return icon; 
          }

          // 如果四周絕對安全，才正式更新座標並寫入 Supabase
          supabase.from('user_desktop_icons')
            .update({ pos_x: targetX, pos_y: targetY })
            .eq('id', active.id)
            .then();

          return { ...icon, pos_x: targetX, pos_y: targetY };
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
			x={icon.pos_x}
		y={icon.pos_y}
		icon={icon.icon}
			{...icon} // 或者寫 icon={icon.icon}
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