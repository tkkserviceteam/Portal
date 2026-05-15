"use client";
import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import DraggableIcon from './components/DraggableIcon'; 
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 定義格線大小 (例如 100 像素一個單位)
const GRID_SIZE = 100;

export default function Desktop() {
  const [icons, setIcons] = useState<any[]>([]);
  const [openApps, setOpenApps] = useState<any[]>([]); 
  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  // 1. 初始化讀取
  useEffect(() => {
    const fetchIcons = async () => {
      const { data } = await supabase.from('user_desktop_icons').select('*');
      if (data) setIcons(data);
    };
    fetchIcons();
  }, []);

  // 設定感應器：distance 設為 10，確保輕微點擊不會觸發拖拽，讓單擊開啟更靈敏
  const sensors = useSensors(useSensor(MouseSensor, {
    activationConstraint: { distance: 10 } 
  }));

  // 點擊圖示時觸發：如果是新開啟就加入 Array，如果已開啟就切換到最前
  const handleOpenApp = (app: any) => {
    const isAlreadyOpen = openApps.find(a => a.id === app.id);
    if (!isAlreadyOpen) {
      setOpenApps([...openApps, app]);
    }
    setActiveAppId(app.id);
  };

  // 關閉視窗
  const handleCloseApp = (id: string) => {
    setOpenApps(openApps.filter(app => app.id !== id));
    if (activeAppId === id) setActiveAppId(null);
  };
  
  const goHome = () => {
  setActiveAppId(null); // 重設當前焦點
  };

  // 2. 處理拖拽結束 (包含貼齊格線邏輯)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    
    setIcons((prevIcons) => 
      prevIcons.map((icon) => {
        if (icon.id === active.id) {
          // 計算原始位置 + 位移量
          const rawX = icon.pos_x + delta.x;
          const rawY = icon.pos_y + delta.y;
          
          // 貼齊格線計算：四捨五入到最近的 GRID_SIZE 倍數
          const snappedX = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
          const snappedY = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
          
          // 非同步更新資料庫
          supabase.from('user_desktop_icons')
            .update({ pos_x: snappedX, pos_y: snappedY })
            .eq('id', active.id)
            .then(({ error }) => {
              if (error) console.error("更新失敗:", error);
            });

          return { ...icon, pos_x: snappedX, pos_y: snappedY };
        }
        return icon;
      })
    );
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[url('/brushstroke-white.jpg')] bg-cover bg-center">
      
      {/* 頂部選單列 (Menu Bar) */}
      <nav className="absolute top-0 w-full h-8 bg-black/10 backdrop-blur-md flex items-center px-4 justify-between text-black text-sm z-50 border-b border-white/5">
{/* 左側容器 (即使空的也要佔位或保持結構) */}
  <div className="flex gap-4 items-center">
    {/* 這裡可以放其他選單 */}
  </div>

{/* 正中央文字 */}
  <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
    <span className="font-semibold">⛛綜合資訊平台</span>
  </div>		
{/* 右側容器 (例如時間) */}
        <div className="flex items-center">
          <span></span>
		  <span>
		  {`
			${new Date().getFullYear()}年
			${(new Date().getMonth() + 1).toString().padStart(2, '0')}月
			${new Date().getDate().toString().padStart(2, '0')}日 
			${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
		  `}
		</span>
        </div>
      </nav>

      {/* 1. 桌面圖示 (傳入點擊與位置資訊) */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="relative w-full h-full pt-10">
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
		// 關鍵在於這個 className 的判斷：
		// 如果 activeAppId 不是這個 app，就把它隱藏 (hidden)
		className={`absolute inset-10 mt-10 bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col transition-all ${
		  activeAppId === app.id ? 'z-40 opacity-100 scale-100' : 'z-0 opacity-0 pointer-events-none scale-95 hidden'
		}`}
		style={{ top: '40px', bottom: '100px' }}
	  >
		{/* 視窗標題列與 iframe 內容保持不變... */}
		<div className="h-8 bg-gray-200 flex items-center px-4 justify-between select-none cursor-default">
		  <div className="flex gap-2">
			<div onClick={(e) => { e.stopPropagation(); handleCloseApp(app.id); }} className="w-3 h-3 bg-red-500 rounded-full cursor-pointer" />
			<div className="w-3 h-3 bg-yellow-500 rounded-full opacity-50" />
			<div className="w-3 h-3 bg-green-500 rounded-full opacity-50" />
		  </div>
		  <span className="text-xs font-medium text-gray-600">{app.name}</span>
		  <div className="w-10" />
		</div>
		<iframe src={app.url} className="w-full h-full border-none" title={app.name} />
	  </div>
	))}

	{/* 3. 底部 Dock */}
	<div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-16 px-4 bg-white/20 backdrop-blur-2xl border border-white/30 rounded-2xl flex items-center gap-4 shadow-2xl z-50">
	  
	{/* Dock 中的 Home 圖示 */}
	<div 
	  onClick={goHome}
	  className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-lg"
	>
	  🏠
	</div>
	  
	  {/* 如果有開 App 才有分隔線 */}
	  {openApps.length > 0 && <div className="w-[1px] h-10 bg-white/30 mx-1" />}

	  {/* 動態顯示目前開啟的分頁 (這部分保持不變) */}
	  {openApps.map((app) => (
		<div 
		  key={app.id}
		  onClick={() => setActiveAppId(app.id)}
		  className={`relative w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 ${activeAppId === app.id ? 'bg-white/60 ring-2 ring-white/50' : ''}`}
		>
		  <span className="text-xl">🔍</span>
		  <div className="absolute -bottom-1.5 w-1 h-1 bg-white rounded-full shadow-sm" />
		</div>
	  ))}
	</div>

    </main>
  );
}