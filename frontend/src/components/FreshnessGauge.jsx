import { useState, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  PackageCheck,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react';

export default function FreshnessGauge({
  freshnessData,
  hasThermalPackaging = false,
  onToggleThermalPackaging,
  showToggle = true,
  compact = false
}) {
  const [showItemBreakdown, setShowItemBreakdown] = useState(false);

  if (!freshnessData) return null;

  const {
    overall_freshness_score = 88,
    status_label = 'Guaranteed Fresh & Crisp',
    banner_color = 'emerald',
    critical_item,
    item_assessments = [],
    smart_mitigation,
    effective_delivery_time_min = 25
  } = freshnessData;

  const isLow = overall_freshness_score < 70;
  const isModerate = overall_freshness_score >= 70 && overall_freshness_score < 85;

  const themeClasses = {
    emerald: {
      bg: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
      accent: 'text-emerald-700',
      bar: 'bg-emerald-600',
      softBg: 'bg-emerald-100/60'
    },
    amber: {
      bg: 'bg-amber-50/80 border-amber-200 text-amber-950',
      badge: 'bg-amber-600 text-white',
      accent: 'text-amber-700',
      bar: 'bg-amber-500',
      softBg: 'bg-amber-100/60'
    },
    rose: {
      bg: 'bg-rose-50/80 border-rose-200 text-rose-950',
      badge: 'bg-rose-600 text-white',
      accent: 'text-rose-700',
      bar: 'bg-rose-600',
      softBg: 'bg-rose-100/60'
    }
  }[banner_color] || {
    bg: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
    badge: 'bg-emerald-600 text-white',
    accent: 'text-emerald-700',
    bar: 'bg-emerald-600',
    softBg: 'bg-emerald-100/60'
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-2xl border ${themeClasses.bg} flex items-center justify-between gap-3 text-xs`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl ${themeClasses.badge} flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
            {overall_freshness_score}%
          </div>
          <div>
            <div className="flex items-center gap-1 font-bold text-stone-900">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>AI Freshness: {status_label}</span>
            </div>
            {critical_item && (
              <p className="text-[11px] text-stone-500 truncate">
                Sensitive item: {critical_item.name} ({critical_item.freshness_retention_pct}% retention)
              </p>
            )}
          </div>
        </div>
        {critical_item?.projected_temp_c && (
          <span className="text-[11px] font-mono font-bold text-stone-700 shrink-0 bg-white/80 px-2 py-0.5 rounded-lg border border-current">
            🌡️ ~{critical_item.projected_temp_c}°C
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border ${themeClasses.bg} shadow-xs space-y-4 transition-all`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${themeClasses.badge} flex flex-col items-center justify-center shadow-md font-black`}>
            <span className="text-base sm:text-lg leading-none">{overall_freshness_score}%</span>
            <span className="text-[9px] uppercase tracking-tighter opacity-80">Fresh</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 text-[10px] font-black uppercase tracking-wider text-orange-600 border border-orange-200">
                <Sparkles className="w-3 h-3" /> AI Quality Guarantee
              </span>
              {hasThermalPackaging && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  <PackageCheck className="w-3 h-3" /> Thermal Pack Shield
                </span>
              )}
            </div>
            <h4 className="text-base font-serif font-black text-stone-900 mt-1">
              {status_label}
            </h4>
          </div>
        </div>

        {/* Temperature Retention Badge */}
        {critical_item && (
          <div className="bg-white/90 p-2.5 rounded-2xl border border-stone-200/80 text-right self-start sm:self-auto shrink-0 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Estimated Temp on Arrival
            </span>
            <div className="flex items-center justify-end gap-1.5 font-mono text-sm font-black text-stone-800">
              <Thermometer className="w-4 h-4 text-orange-600" />
              <span>~{critical_item.projected_temp_c}°C</span>
              <span className="text-xs font-normal text-stone-500">({critical_item.temperature_status})</span>
            </div>
          </div>
        )}
      </div>

      {/* Freshness Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-stone-600">
          <span>Freshness & Crispness Retention Curve</span>
          <span className="font-mono">{overall_freshness_score} / 100</span>
        </div>
        <div className="w-full bg-white/80 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200/80">
          <div
            className={`h-full rounded-full transition-all duration-700 ${themeClasses.bar}`}
            style={{ width: `${overall_freshness_score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-stone-400 font-mono">
          <span>Soggy / Cold</span>
          <span>Moderate Texture</span>
          <span>Peak Oven Freshness</span>
        </div>
      </div>

      {/* Smart Packaging Mitigation Action */}
      {smart_mitigation && showToggle && onToggleThermalPackaging && (
        <div className="p-3.5 bg-white rounded-2xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              <span>Smart Recommendation: {smart_mitigation.label}</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-snug">
              {smart_mitigation.impact_text}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleThermalPackaging}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              hasThermalPackaging
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs shadow-orange-600/25'
            }`}
          >
            {hasThermalPackaging ? '✓ Thermal Pack Enabled' : '+ Add Thermal Packaging (Rs. 15)'}
          </button>
        </div>
      )}

      {/* Toggle Item Breakdown Accordion */}
      {item_assessments.length > 0 && (
        <div className="pt-2 border-t border-current/10">
          <button
            type="button"
            onClick={() => setShowItemBreakdown(prev => !prev)}
            className="text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center justify-between w-full cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span>View Dish-by-Dish Quality Assessments ({item_assessments.length} items)</span>
            </span>
            <span className="text-[11px] text-orange-600 underline">
              {showItemBreakdown ? 'Hide Breakdown ▲' : 'Show Breakdown ▼'}
            </span>
          </button>

          {showItemBreakdown && (
            <div className="mt-3 space-y-2 pt-2">
              {item_assessments.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/90 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-stone-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-stone-500">
                      {item.category_label} • {item.degradation_mode}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-stone-800">
                      {item.freshness_retention_pct}%
                    </span>
                    <span className="text-[10px] text-stone-400 block font-mono">
                      ~{item.projected_temp_c}°C
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
