"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function Desktop() {
  return (
    // 1. 桌面背景 (你可以之後換成自己的桌布網址)
    <main className="relative h-screen w-screen overflow-hidden bg-[#005a9c] bg-[url('https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center">
      
      {/* 2. 頂部選單列 (Menu Bar) */}
      <nav className="absolute top-0 w-full h-8 bg-white/10 backdrop-blur-md flex items-center px-4 justify-between text-white text-sm z-50 border-b border-white/10">
        <div className="flex gap-4 items-center">
          <span className="font-bold"></span>
          <span className="font-semibold">Finder</span>
          <span className="hidden md:block">File</span>
          <span className="hidden md:block">Edit</span>
          <span className="hidden md:block">View</span>
          <span className="hidden md:block">Go</span>
        </div>
        <div className="flex gap-4 items-center font-medium">
          <span>100%</span>
          <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </nav>

      {/* 3. 圖示放置區域 (預留給之後的 Draggable Icons) */}
      <div className="relative w-full h-full pt-10 p-4">
        {/* 我們下一步會在這裡加入可移動的入口圖示 */}
      </div>

      {/* 4. 底部 Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="h-16 px-3 py-2 bg-white/20 backdrop-blur-2xl border border-white/30 rounded-2xl flex items-center gap-3 shadow-2xl">
          {/* 這裡先放兩個假圖示占位 */}
          <motion.div 
            whileHover={{ y: -10, scale: 1.1 }}
            className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg cursor-pointer"
          />
          <motion.div 
            whileHover={{ y: -10, scale: 1.1 }}
            className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg cursor-pointer"
          />
        </div>
      </div>

    </main>
  );
}