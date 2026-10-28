import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { HOURLY_TRAFFIC_DATA } from '../../data/initialData';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const ParkingInsightsView: React.FC = () => {
  const { dailyHistory, stats } = useParking();

  const [rangeDays, setRangeDays] = useState<7 | 14>(14);
  const [forecastDayType, setForecastDayType] = useState<'weekday' | 'friday' | 'weekend'>('weekday');
  const [categoryFocus, setCategoryFocus] = useState<'all' | 'cars' | 'bikes' | 'staff' | 'visitors' | 'buses'>('all');

  const filteredDaily = useMemo(() => {
    return dailyHistory.slice(-rangeDays);
  }, [dailyHistory, rangeDays]);

  // Moving-average demand forecast derived from historical campus sample profile
  const forecastHourlyData = useMemo(() => {
    const multiplier =
      forecastDayType === 'weekday' ? 1.0 : forecastDayType === 'friday' ? 0.84 : 0.45;

    return HOURLY_TRAFFIC_DATA.map((row) => {
      const baseVal =
        categoryFocus === 'all'
          ? row.total
          : row[categoryFocus];
      const maxCap =
        categoryFocus === 'all'
          ? stats.totalSpaces
          : categoryFocus === 'cars'
          ? stats.carStats.totalSpaces
          : categoryFocus === 'bikes'
          ? stats.bikeStats.totalSpaces
          : categoryFocus === 'staff'
          ? stats.staffStats.totalSpaces
          : categoryFocus === 'visitors'
          ? stats.visitorStats.totalSpaces
          : stats.busStats.totalSpaces;

      const historicalAvg = Math.round(baseVal * multiplier);
      const estimatedDemand = Math.min(maxCap, Math.round((row.predictedTotal || baseVal * 1.04) * multiplier));
      const occupancyPct = maxCap > 0 ? Math.round((estimatedDemand / maxCap) * 100) : 0;

      return {
        time: row.time,
        historicalAvg,
        estimatedDemand,
        occupancyPct,
        periodClass:
          occupancyPct >= 75 ? 'Busy' : occupancyPct <= 45 ? 'Quiet' : 'Moderate',
      };
    });
  }, [forecastDayType, categoryFocus, stats]);

  const busyWindows = useMemo(
    () => forecastHourlyData.filter((d) => d.occupancyPct >= 75),
    [forecastHourlyData]
  );

  const quietWindows = useMemo(
    () => forecastHourlyData.filter((d) => d.occupancyPct <= 45),
    [forecastHourlyData]
  );

  const avgPeakPct = useMemo(() => {
    if (filteredDaily.length === 0) return 0;
    return Math.round(
      filteredDaily.reduce((acc, d) => acc + d.peakOccupancyPct, 0) / filteredDaily.length
    );
  }, [filteredDaily]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Historical Baseline &amp; Statistical Demand Estimation
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Parking Insights &amp; Demand Forecast
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Analyze hourly and daily campus parking patterns, identify historical peak hours, and plan arrivals around expected busy and quiet periods.
          </p>
        </div>

        {/* Date & Forecast Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value) as 7 | 14)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value={7}>Historical Window: Last 7 Days</option>
            <option value={14}>Historical Window: Last 14 Days</option>
          </select>

          <select
            value={forecastDayType}
            onChange={(e) => setForecastDayType(e.target.value as 'weekday' | 'friday' | 'weekend')}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="weekday">Forecast Profile: Mon–Thu Lecture Day</option>
            <option value="friday">Forecast Profile: Friday Schedule</option>
            <option value="weekend">Forecast Profile: Sat–Sun Campus</option>
          </select>

          <select
            value={categoryFocus}
            onChange={(e) => setCategoryFocus(e.target.value as typeof categoryFocus)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">All Categories (200 Bays)</option>
            <option value="cars">Cars Only</option>
            <option value="bikes">Bikes Only</option>
            <option value="staff">Staff Vehicles Only</option>
            <option value="visitors">Visitors Only</option>
            <option value="buses">Buses Only</option>
          </select>
        </div>
      </div>

      {/* Explicit Transparency Notice */}
      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Data Source Transparency:</strong> Multi-day historical curves and future demand estimates use clearly labelled sample campus historical records and moving-average projections, not live physical roadbed sensors.
        </span>
      </div>

      {/* Summary Insights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 tabular-nums">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Expected Busy Periods (&ge;75% Full)</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {busyWindows.length > 0
              ? `${busyWindows[0].time} – ${busyWindows[busyWindows.length - 1].time}`
              : 'None Projected'}
          </div>
          <p className="text-xs text-slate-500">
            Advance QR reservation strongly advised during lecture changeover peaks.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Expected Quiet Periods (&le;45% Full)</span>
          </div>
          <div className="text-lg font-bold text-emerald-700">
            {quietWindows.map((q) => q.time).join(', ') || 'Early Morning / Evening'}
          </div>
          <p className="text-xs text-slate-500">
            High immediate walk-in availability across North &amp; Central zones.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>{rangeDays}-Day Avg Peak Occupancy</span>
          </div>
          <div className="text-lg font-bold text-slate-900">{avgPeakPct}% at 12:00 PM</div>
          <p className="text-xs text-slate-500">
            Computed across the past {rangeDays} historical campus operating days.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Historical vs Forecasted Demand */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Hourly Occupancy &amp; Estimated Demand Curve
            </h3>
            <p className="text-xs text-slate-500">
              Historical sample average vs projected vehicle demand by hour
            </p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={forecastHourlyData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="historicalAvg"
                  fill="#dbeafe"
                  stroke="#3b82f6"
                  name="Historical Avg Vehicles"
                />
                <Line
                  type="monotone"
                  dataKey="estimatedDemand"
                  stroke="#0f172a"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  name="Estimated Demand (Sample Forecast)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Historical Occupancy Chart */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Daily Occupancy History ({rangeDays} Days)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Average vs peak daily occupancy percentage (%)
            </p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredDaily}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="avgOccupancyPct" fill="#3b82f6" name="Avg Occupancy %" radius={[3, 3, 0, 0]} />
                <Bar dataKey="peakOccupancyPct" fill="#0f172a" name="Peak Occupancy %" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hourly Period Breakdown Visual Report */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Expected Busy &amp; Quiet Time-of-Day Guide</span>
            </h3>
            <p className="text-xs text-slate-500">
              Projected slot utilization rate by operating time block
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 tabular-nums">
          {forecastHourlyData.map((item) => {
            const cls =
              item.periodClass === 'Busy'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : item.periodClass === 'Quiet'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-800';

            return (
              <div key={item.time} className={`p-3 rounded-lg border text-center ${cls}`}>
                <div className="text-xs font-mono font-semibold">{item.time}</div>
                <div className="text-lg font-bold my-1">{item.occupancyPct}%</div>
                <div className="text-[11px] font-semibold">{item.periodClass}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
