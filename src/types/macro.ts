export type ActionType = 'tap' | 'double_tap' | 'long_press' | 'swipe' | 'delay';

export interface BaseAction {
  id: string;
  name: string;
  type: ActionType;
  enabled: boolean;
  repeatCount?: number;
}

export interface TapAction extends BaseAction {
  type: 'tap' | 'double_tap' | 'long_press';
  x: number; // 0 to 100 (% of phone screen) or absolute px
  y: number; // 0 to 100 (% of phone screen) or absolute px
  durationMs: number; // touch hold down time (e.g. 50ms for normal tap, 800ms for long press)
  delayAfterMs: number; // delay before next action
  randomOffsetPx?: number; // anti-ban coordinate jitter (±px)
  randomDelayPercent?: number; // anti-ban delay jitter (±%)
}

export interface SwipeAction extends BaseAction {
  type: 'swipe';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs: number; // swipe movement speed (e.g. 300ms)
  delayAfterMs: number;
  curve?: 'linear' | 'ease-in-out' | 'arc';
}

export interface DelayAction extends BaseAction {
  type: 'delay';
  durationMs: number;
  randomPercent?: number;
  description?: string;
}

export type MacroAction = TapAction | SwipeAction | DelayAction;

export interface MacroScript {
  id: string;
  name: string;
  description: string;
  category: 'game' | 'social' | 'tool' | 'custom';
  loopType: 'infinite' | 'count' | 'duration';
  loopCount: number; // e.g. 10 times
  loopDurationSeconds: number; // e.g. 60 seconds
  loopIntervalMs: number; // delay between loops
  actions: MacroAction[];
  speedMultiplier: number; // 0.5, 1, 2, 5x
  antiBanEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TouchRipple {
  id: string;
  x: number;
  y: number;
  size: number;
  type: 'tap' | 'swipe-start' | 'swipe-end' | 'hold';
  color?: string;
}

export interface SwipeTrail {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs: number;
  progress: number; // 0 to 1
}

export type MockAppId = 'game' | 'reels' | 'sale' | 'canvas';

export interface ExecutionStats {
  status: 'idle' | 'running' | 'paused';
  currentLoop: number;
  totalLoops: number;
  currentActionIndex: number;
  totalClicks: number;
  totalSwipes: number;
  elapsedSeconds: number;
  startTime: number | null;
}
