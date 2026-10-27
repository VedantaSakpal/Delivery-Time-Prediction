import { useState, useEffect } from 'react';
import {
  Clock,
  Bike,
  ChefHat,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Timer,
  Leaf,
  Flame,
  AlertCircle
} from 'lucide-react';

export default function StagedDispatchWidget({
  stagedData,
  userRole = 'restaurant', // 'restaurant' | 'admin' | 'user'
  onAdjustPrepTime,
  compact = false
}) {
  const safeData = stagedData || {};
  const {
    order_created_at,
    prep_time_min = 18,
    courier_pickup_transit_min = 5.5,
    staged_hold_min = 12.5,
    scheduled_dispatch_time = '12:45 PM',
    projected_food_ready_time = '12:50 PM',
    projected_courier_arrival = '12:50 PM',
    current_stage = 'staged_hold',
    stage_label = 'Kitchen Cooking (Rider Dispatch on Smart Hold)',
    stage_color = 'amber',
    remaining_hold_sec = 420,
    remaining_prep_sec = 780,
    traditional_courier_idle_min = 12.5,
    justwoww_courier_idle_min = 0.8,
    idle_minutes_saved = 11.7,
    co2_emissions_saved_grams = 166.1
  } = safeData;

  // Local live ticking countdown
  const [secondsRemaining, setSecondsRemaining] = useState(
    current_stage === 'staged_hold' ? remaining_hold_sec : remaining_prep_sec
  );

  useEffect(() => {
    setSecondsRemaining(current_stage === 'staged_hold' ? remaining_hold_sec : remaining_prep_sec);
  }, [remaining_hold_sec, remaining_prep_sec, current_stage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!stagedData) return null;

  const formatSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isDelivered = current_stage === 'delivered';
  const isInTransit = current_stage === 'in_transit';
  const isHandoff = current_stage === 'zero_wait_handoff';
  const isEnRoute = current_stage === 'courier_en_route';
  const isHold = current_stage === 'staged_hold';

  // Compact badge for table rows
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] border flex items-center gap-1 ${
          isHold
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : isEnRoute
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {isHold ? <Clock className="w-3 h-3 text-amber-600" /> : <Bike className="w-3 h-3 text-blue-600" />}
          <span>{stage_label}</span>
        </span>
        <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          🌱 -{idle_minutes_saved}m idle
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#ECE4D8] shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-600/30 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/40">
              <Zap className="w-3 h-3" /> Staged Courier Dispatch
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
              <Leaf className="w-3 h-3" /> {idle_minutes_saved} min idle waste eliminated
            </span>
          </div>
          <h4 className="text-base font-serif font-black text-white mt-1">
            Zero-Idle Synchronized Kitchen Handoff
          </h4>
        </div>

        {/* Live Countdown Clock */}
        <div className="bg-stone-950/80 px-4 py-2 rounded-2xl border border-stone-700/80 text-right self-start sm:self-auto shrink-0 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
            {isHold ? 'Courier Dispatch In' : isEnRoute ? 'Courier Arrival In' : 'Status'}
          </span>
          <div className="font-mono text-lg font-black text-orange-400 flex items-center justify-end gap-1.5">
            <Timer className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>{isHold || isEnRoute ? formatSec(secondsRemaining) : stage_label}</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6 bg-[#FAF7F2]">
        {/* 3-Stage Progress Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Phase 1: Kitchen Cooking */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isHold || isEnRoute || isHandoff
              ? 'bg-white border-orange-200 shadow-2xs'
              : 'bg-stone-50 border-stone-200 opacity-60'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-orange-600" />
                1. Kitchen Cooking
              </span>
              <span className="font-mono font-bold text-stone-600">{prep_time_min}m total</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-snug">
              Food is actively being prepared fresh. Target ready at <strong>{projected_food_ready_time}</strong>.
            </p>
          </div>

          {/* Phase 2: Staged Hold & Synchronized Dispatch */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isHold
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
              : isEnRoute
              ? 'bg-blue-50/70 border-blue-300'
              : 'bg-white border-[#ECE4D8]'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                2. Staged Courier Release
              </span>
              <span className="font-mono font-bold text-stone-600">{scheduled_dispatch_time}</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-snug">
              {isHold
                ? `Dispatch delayed by ${staged_hold_min}m so rider doesn't idle outside kitchen.`
                : `Rider dispatched at ${scheduled_dispatch_time} with ${courier_pickup_transit_min}m transit.`}
            </p>
          </div>

          {/* Phase 3: Zero-Wait Handoff */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isHandoff || isInTransit || isDelivered
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-[#ECE4D8]'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                3. Zero-Wait Handoff
              </span>
              <span className="font-mono font-bold text-stone-600">{projected_courier_arrival}</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-snug">
              Rider arrives within ±60s of food sealing. Food goes straight from stove to insulated bag.
            </p>
          </div>
        </div>

        {/* Efficiency Comparison Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#ECE4D8] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <div>
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Courier Curbside Idling vs. Traditional Immediate Dispatch
              </span>
              <p className="text-[11px] text-stone-500">
                Traditional apps dispatch immediately, forcing riders to idle for ~{traditional_courier_idle_min} mins outside kitchens.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-mono font-black text-emerald-700">
                -{idle_minutes_saved} min saved
              </span>
              <span className="text-[10px] text-stone-400 block font-mono">
                ~{co2_emissions_saved_grams}g CO₂ prevented
              </span>
            </div>
          </div>

          {/* Side by side comparison bars */}
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="w-28 text-stone-500 text-[11px]">Traditional:</span>
              <div className="flex-1 bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full rounded-full" style={{ width: '85%' }} />
              </div>
              <span className="w-20 text-right text-rose-700 font-bold text-[11px]">{traditional_courier_idle_min}m idle</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 text-stone-900 font-bold text-[11px]">justwoww:</span>
              <div className="flex-1 bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '8%' }} />
              </div>
              <span className="w-20 text-right text-emerald-700 font-bold text-[11px]">{justwoww_courier_idle_min}m sync</span>
            </div>
          </div>
        </div>

        {/* Kitchen Chef Adjustment Controls */}
        {userRole === 'restaurant' && onAdjustPrepTime && (
          <div className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-orange-950 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-orange-600" />
                Kitchen Chef Live Dynamic Sync
              </span>
              <p className="text-[11px] text-stone-600">
                Cooking faster or delayed? Adjusting sync dynamically updates courier dispatch trigger in real time.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onAdjustPrepTime(-3)}
                className="px-3 py-1.5 bg-white hover:bg-orange-100 text-stone-800 font-bold rounded-xl border border-orange-200 shadow-2xs transition-all cursor-pointer"
              >
                -3 min (Faster)
              </button>
              <button
                type="button"
                onClick={() => onAdjustPrepTime(3)}
                className="px-3 py-1.5 bg-white hover:bg-orange-100 text-stone-800 font-bold rounded-xl border border-orange-200 shadow-2xs transition-all cursor-pointer"
              >
                +3 min (Delay)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
