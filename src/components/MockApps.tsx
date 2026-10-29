import React, { useState, useEffect } from 'react';
import { MockAppId } from '../types/macro';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Flame, 
  Sword, 
  Sparkles, 
  RotateCcw, 
  ShieldCheck, 
  ShoppingBag, 
  Clock, 
  Crosshair
} from 'lucide-react';

interface MockAppsProps {
  activeApp: MockAppId;
  onAppAction?: (actionName: string) => void;
  lastTouch?: { x: number; y: number; time: number } | null;
  lastSwipe?: { startX: number; startY: number; endX: number; endY: number } | null;
}

export const MockApps: React.FC<MockAppsProps> = ({
  activeApp,
  lastTouch,
  lastSwipe,
}) => {
  // Game State
  const [monsterHp, setMonsterHp] = useState(100);
  const [monsterMaxHp] = useState(100);
  const [monsterLevel, setMonsterLevel] = useState(1);
  const [gold, setGold] = useState(1250);
  const [combo, setCombo] = useState(0);
  const [damageNumbers, setDamageNumbers] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  // Reels State
  const [reelIndex, setReelIndex] = useState(0);
  const [likes, setLikes] = useState([2451, 8910, 15400, 3120]);
  const [isLiked, setIsLiked] = useState([false, false, false, false]);

  // Flash Sale State
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [saleTimeLeft, setSaleTimeLeft] = useState(42);

  // Canvas Points State
  const [canvasTouchHistory, setCanvasTouchHistory] = useState<{ x: number; y: number; id: number }[]>([]);

  // Handle external touch impacts on game/canvas
  useEffect(() => {
    if (!lastTouch) return;
    
    // Canvas app
    if (activeApp === 'canvas') {
      setCanvasTouchHistory((prev) => [
        ...prev.slice(-20),
        { x: lastTouch.x, y: lastTouch.y, id: Date.now() },
      ]);
    }

    // Game app hit detection
    if (activeApp === 'game') {
      // If tapped in upper-middle area (monster) or attack button area
      const isMonsterArea = lastTouch.y >= 30 && lastTouch.y <= 65;
      const isAttackBtn = lastTouch.y >= 70 && lastTouch.x >= 65;

      if (isMonsterArea || isAttackBtn) {
        hitMonster(isAttackBtn ? 25 : 15);
      }
    }

    // Flash sale app click
    if (activeApp === 'sale') {
      if (lastTouch.y >= 75) {
        handleSaleClick();
      }
    }

    // Reels like tap
    if (activeApp === 'reels') {
      if (lastTouch.x > 80 && lastTouch.y > 55 && lastTouch.y < 70) {
        toggleLike();
      }
    }
  }, [lastTouch]);

  // Handle swipe detection for Reels
  useEffect(() => {
    if (!lastSwipe) return;
    if (activeApp === 'reels') {
      const deltaY = lastSwipe.endY - lastSwipe.startY;
      if (deltaY < -15) {
        // Swiped UP -> Next reel
        setReelIndex((prev) => (prev + 1) % 4);
      } else if (deltaY > 15) {
        // Swiped DOWN -> Previous reel
        setReelIndex((prev) => (prev - 1 + 4) % 4);
      }
    }
  }, [lastSwipe]);

  const hitMonster = (dmg: number) => {
    setCombo((c) => c + 1);
    setGold((g) => g + 15);
    setMonsterHp((hp) => {
      const next = hp - dmg;
      if (next <= 0) {
        setMonsterLevel((lvl) => lvl + 1);
        return monsterMaxHp;
      }
      return next;
    });

    const newId = Date.now() + Math.random();
    setDamageNumbers((prev) => [
      ...prev.slice(-4),
      {
        id: newId,
        text: `-${dmg}`,
        x: 40 + Math.random() * 20,
        y: 40 + Math.random() * 15,
      },
    ]);

    setTimeout(() => {
      setDamageNumbers((prev) => prev.filter((d) => d.id !== newId));
    }, 700);
  };

  const toggleLike = () => {
    setIsLiked((prev) => {
      const copy = [...prev];
      copy[reelIndex] = !copy[reelIndex];
      return copy;
    });
    setLikes((prev) => {
      const copy = [...prev];
      copy[reelIndex] += isLiked[reelIndex] ? -1 : 1;
      return copy;
    });
  };

  const handleSaleClick = () => {
    setClickCount((c) => c + 1);
    if (!queueNumber) {
      setQueueNumber(Math.floor(Math.random() * 50) + 1);
    } else {
      setQueueNumber((q) => Math.max(1, (q ?? 2) - 1));
    }
  };

  // App 1: RPG Tap Game
  if (activeApp === 'game') {
    return (
      <div className="relative w-full h-full bg-slate-950 text-white flex flex-col justify-between select-none overflow-hidden font-sans">
        {/* Background Dungeon Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-slate-900 to-black pointer-events-none" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Top Game Bar */}
        <div className="relative z-10 px-3 py-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xs text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
            <span>LV.{monsterLevel} 던전</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px] tabular-nums">골드: {gold.toLocaleString()} G</span>
            <span className="bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded text-[10px] tabular-nums">
              Combo x{combo}
            </span>
          </div>
        </div>

        {/* Monster & HP Area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
          {/* Monster HP */}
          <div className="w-48 mb-3">
            <div className="flex justify-between text-[11px] text-slate-300 mb-1 font-mono">
              <span className="font-semibold text-rose-400">심연의 골렘</span>
              <span className="tabular-nums">{monsterHp} / {monsterMaxHp} HP</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-150"
                style={{ width: `${Math.max(0, (monsterHp / monsterMaxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Monster Avatar (Interactive target) */}
          <button
            onClick={() => hitMonster(20)}
            className="relative group p-4 rounded-full transition-transform active:scale-95 focus:outline-hidden"
          >
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-indigo-950 border-2 border-rose-500/40 shadow-xl shadow-rose-950/50 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="text-4xl animate-bounce">👹</div>
              <span className="text-[10px] text-rose-300/80 mt-1 font-mono">터치하여 공격</span>
              <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Floating Damage Numbers */}
          {damageNumbers.map((dmg) => (
            <div
              key={dmg.id}
              className="absolute pointer-events-none font-bold text-amber-300 text-sm font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-out fade-out slide-out-to-top duration-700"
              style={{ left: `${dmg.x}%`, top: `${dmg.y}%` }}
            >
              {dmg.text}
            </div>
          ))}
        </div>

        {/* Bottom Skill & Attack Controls */}
        <div className="relative z-10 p-3 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-xs">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => hitMonster(35)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-700 active:bg-indigo-950 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] text-slate-300 mt-0.5">스킬 ①</span>
            </button>
            <button
              onClick={() => hitMonster(50)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-700 active:bg-amber-950 active:scale-95 transition-all"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-slate-300 mt-0.5">스킬 ②</span>
            </button>
            <button
              onClick={() => hitMonster(100)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-700 active:bg-emerald-950 active:scale-95 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-slate-300 mt-0.5">버프</span>
            </button>
            <button
              onClick={() => hitMonster(18)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 active:scale-95 text-white font-bold shadow-md shadow-rose-900/50"
            >
              <Sword className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">연타</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // App 2: Reels / Shorts Feed
  if (activeApp === 'reels') {
    const reelVideos = [
      {
        title: '귀여운 강아지의 첫 산책 일기 🐶',
        creator: '@cute_puppy_daily',
        bg: 'from-amber-900 via-orange-950 to-slate-950',
        tag: '#반려견 #댕댕이 #힐링',
        icon: '🐶',
      },
      {
        title: '3분 만에 만드는 초간단 에그 드롭 토스트 🍳',
        creator: '@chef_recipe_kr',
        bg: 'from-emerald-900 via-teal-950 to-slate-950',
        tag: '#자취요리 #토스트 #초간단',
        icon: '🥪',
      },
      {
        title: '신작 액션 RPG 콤보 100연타 명장면 ⚔️',
        creator: '@gaming_pro_kr',
        bg: 'from-indigo-950 via-purple-950 to-slate-950',
        tag: '#게임추천 #매크로 #플레이',
        icon: '🎮',
      },
      {
        title: '가을 단풍 드라이브 코스 TOP 5 🍁',
        creator: '@travel_korea',
        bg: 'from-rose-950 via-red-950 to-slate-950',
        tag: '#여행 #단풍 #드라이브',
        icon: '🍂',
      },
    ];

    const currentReel = reelVideos[reelIndex];

    return (
      <div className={`relative w-full h-full bg-gradient-to-b ${currentReel.bg} text-white flex flex-col justify-between select-none overflow-hidden`}>
        {/* Top Header */}
        <div className="relative z-10 px-4 py-2 flex items-center justify-between text-xs font-semibold backdrop-blur-xs bg-black/20">
          <span className="text-white/80">Reels</span>
          <div className="flex gap-4 text-[11px] text-white/90">
            <span className="border-b border-white pb-0.5">추천</span>
            <span className="text-white/50">팔로잉</span>
          </div>
          <span className="text-[11px] text-white/60 font-mono">{reelIndex + 1}/4</span>
        </div>

        {/* Video Content Center */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-5xl mb-3 shadow-lg">
            {currentReel.icon}
          </div>
          <div className="text-center px-4">
            <h4 className="text-sm font-bold text-white mb-1 drop-shadow-sm">{currentReel.title}</h4>
            <p className="text-xs text-white/70">{currentReel.tag}</p>
          </div>
          <p className="text-[10px] text-white/50 mt-4 font-mono">↕ 위/아래로 스와이프하여 영상 넘기기</p>
        </div>

        {/* Right Floating Actions & Bottom Meta */}
        <div className="relative z-10 p-3 flex items-end justify-between">
          <div className="max-w-[70%]">
            <p className="text-xs font-bold text-white mb-0.5">{currentReel.creator}</p>
            <p className="text-[11px] text-white/80 line-clamp-1">{currentReel.title}</p>
          </div>

          {/* Right vertical buttons */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={toggleLike}
              className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
            >
              <div className={`p-2 rounded-full ${isLiked[reelIndex] ? 'bg-rose-500 text-white' : 'bg-black/40 text-white'}`}>
                <Heart className={`w-4 h-4 ${isLiked[reelIndex] ? 'fill-white' : ''}`} />
              </div>
              <span className="text-[10px] font-mono tabular-nums">{likes[reelIndex]}</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
              <div className="p-2 rounded-full bg-black/40 text-white">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono">142</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
              <div className="p-2 rounded-full bg-black/40 text-white">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono">공유</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // App 3: Flash Sale / Ticketing
  if (activeApp === 'sale') {
    return (
      <div className="relative w-full h-full bg-slate-900 text-slate-100 flex flex-col justify-between select-none overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>선착순 핫딜 예매</span>
          </div>
          <button
            onClick={() => {
              setClickCount(0);
              setQueueNumber(null);
              setSaleTimeLeft(45);
            }}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> 초기화
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-center items-center text-center">
          <div className="w-full max-w-[240px] p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-lg mb-3">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-mono mb-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 마감까지
              </span>
              <span className="tabular-nums">00:00:{saleTimeLeft.toString().padStart(2, '0')}</span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">단독 80% 특가</span>
              <h3 className="text-sm font-bold text-white mt-0.5">게이밍 기계식 키보드 풀세트</h3>
              <p className="text-xs text-slate-400 mt-1 line-through">189,000원</p>
              <p className="text-base font-extrabold text-rose-400 font-mono">37,800원</p>
            </div>
          </div>

          {/* Queue Status */}
          <div className="w-full max-w-[240px] p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs mb-2">
            <div className="flex justify-between items-center text-slate-400 text-[11px] mb-1">
              <span>내 대기 순번:</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums">
                {queueNumber !== null ? `#${queueNumber}번` : '대기 미접속'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>연타 클릭 횟수:</span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums">{clickCount}회</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-mono">
            하단 버튼을 매크로 광클하여 대기 순번을 빠르게 통과하세요!
          </p>
        </div>

        {/* Instant Buy Button */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <button
            onClick={handleSaleClick}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-98 transition-all font-bold text-white text-sm shadow-md shadow-emerald-950/60 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>선착순 결제 신청 (광클)</span>
          </button>
        </div>
      </div>
    );
  }

  // App 4: Coordinate Grid & Gesture Canvas
  return (
    <div className="relative w-full h-full bg-slate-950 text-slate-200 flex flex-col justify-between select-none overflow-hidden font-mono">
      {/* Top Coordinate Monitor */}
      <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
          <Crosshair className="w-3.5 h-3.5" />
          <span>터치 좌표 분석 캔버스</span>
        </div>
        <button
          onClick={() => setCanvasTouchHistory([])}
          className="text-[10px] text-slate-400 hover:text-white"
        >
          기록 비우기
        </button>
      </div>

      {/* Coordinate Canvas Grid */}
      <div className="relative flex-1 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] p-3 flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 space-y-0.5">
          <p>화면 해상도 비율: 100% x 100%</p>
          <p>마지막 클릭 좌표: {lastTouch ? `X: ${lastTouch.x.toFixed(1)}%, Y: ${lastTouch.y.toFixed(1)}%` : '대기 중...'}</p>
          <p>누적 감지 횟수: {canvasTouchHistory.length}회</p>
        </div>

        {/* Visual Dots */}
        {canvasTouchHistory.map((pt, i) => (
          <div
            key={pt.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400 animate-ping absolute" />
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-xs" />
            <span className="absolute text-[9px] text-indigo-300 font-mono -bottom-3 tabular-nums">
              #{i + 1}
            </span>
          </div>
        ))}

        <div className="text-center text-[10px] text-slate-500">
          오버레이 매크로가 실행되면 터치 좌표 궤적이 실시간으로 감지됩니다.
        </div>
      </div>
    </div>
  );
};
