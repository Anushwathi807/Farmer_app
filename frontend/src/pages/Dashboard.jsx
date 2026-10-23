import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  CloudSun, Droplets, Thermometer, Wind, Calendar, TrendingUp, AlertTriangle, 
  ChevronRight, RefreshCw, Layers, Sprout, ChevronDown, CheckCircle
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Selection states
  const [selectedPlotId, setSelectedPlotId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  
  // Custom week view (defaults to current crop week)
  const [customWeekKey, setCustomWeekKey] = useState('');
  
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = async (plotId = '', cropId = '') => {
    setError('');
    try {
      const token = await auth.currentUser.getIdToken();
      let url = '/api/dashboard-data';
      const params = [];
      if (plotId) params.push(`plot_id=${plotId}`);
      if (cropId) params.push(`crop_id=${cropId}`);
      if (params.length) url += `?${params.join('&')}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const resData = await response.json();
        setData(resData);
        
        // Auto select first plot & crop if not set
        const plots = resData.all_plots || [];
        if (plots.length > 0) {
          const activePlot = plotId ? plots.find(p => p.id === plotId) : plots[0];
          setSelectedPlotId(activePlot.id);
          
          if (activePlot.crops && activePlot.crops.length > 0) {
            const activeCrop = cropId ? activePlot.crops.find(c => c.crop_id === cropId) : activePlot.crops[0];
            setSelectedCropId(activeCrop.crop_id);
            
            // Set current week view
            const currentWeekRange = calculateCurrentWeekRange(activeCrop.sowing_date, activeCrop.ai_workflow);
            setCustomWeekKey(currentWeekRange);
          }
        }
      } else {
        const err = await response.json();
        setError(err.detail || "Could not fetch dashboard metrics.");
      }
    } catch (e) {
      console.error(e);
      setError("Network error fetching dashboard details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(selectedPlotId, selectedCropId);
  };

  const handlePlotChange = (e) => {
    const newPlotId = e.target.value;
    setSelectedPlotId(newPlotId);
    // Find the first crop of the new plot and select it
    const activePlot = data.all_plots.find(p => p.id === newPlotId);
    if (activePlot && activePlot.crops && activePlot.crops.length > 0) {
      setSelectedCropId(activePlot.crops[0].crop_id);
      fetchDashboardData(newPlotId, activePlot.crops[0].crop_id);
    } else {
      setSelectedCropId('');
      fetchDashboardData(newPlotId, '');
    }
  };

  const handleCropChange = (e) => {
    const newCropId = e.target.value;
    setSelectedCropId(newCropId);
    fetchDashboardData(selectedPlotId, newCropId);
  };

  // Helper: calculate week key (e.g. "Week 1-2") based on sowing date and workflow keys
  const calculateCurrentWeekRange = (sowingDateStr, workflow) => {
    if (!sowingDateStr || !workflow || typeof workflow !== 'object' || workflow.error) return '';
    const sowing = new Date(sowingDateStr);
    const today = new Date();
    const diffTime = Math.abs(today - sowing);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentWeekNum = Math.floor(diffDays / 7) + 1;

    // Find matching range key in workflow (e.g. "Week 1-2", "Week 3-4")
    const keys = Object.keys(workflow);
    for (const key of keys) {
      // Parse week range from key e.g. "Week 3-4" -> [3, 4]
      const match = key.match(/(\d+)-(\d+)/);
      if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        if (currentWeekNum >= start && currentWeekNum <= end) {
          return key;
        }
      }
    }
    // Return first week key as fallback
    return keys[0] || '';
  };

  // Helper: get current week number since sowing
  const getWeekNumberSinceSowing = (sowingDateStr) => {
    if (!sowingDateStr) return 0;
    const sowing = new Date(sowingDateStr);
    const today = new Date();
    const diffTime = today - sowing;
    return Math.max(1, Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-medium">Assembling farm statistics...</p>
      </div>
    );
  }

  if (error || !data || !data.all_plots || data.all_plots.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl inline-flex mb-4 text-rose-400">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Dashboard</h2>
        <p className="text-slate-400 mb-6">{error || "Ensure you have onboarded your land and added crops."}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const activePlot = data.all_plots.find(p => p.id === selectedPlotId) || data.all_plots[0];
  const activeCrop = activePlot.crops ? activePlot.crops.find(c => c.crop_id === selectedCropId) || activePlot.crops[0] : null;

  // Build Charts data
  const priceChartData = {
    labels: (data.price_trend || []).map(d => d.week.replace(/20\d{2}-W/, 'W')),
    datasets: [{
      label: 'Est. Price (INR/kg)',
      data: (data.price_trend || []).map(d => d.price),
      borderColor: 'rgba(168, 85, 247, 1)',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgba(168, 85, 247, 1)',
    }]
  };

  const tempChartData = {
    labels: (data.temp_trend || []).map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })),
    datasets: [
      {
        label: 'Max Temp (°C)',
        data: (data.temp_trend || []).map(d => d.max_temp),
        borderColor: 'rgba(251, 146, 60, 1)',
        backgroundColor: 'rgba(251, 146, 60, 0.05)',
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Min Temp (°C)',
        data: (data.temp_trend || []).map(d => d.min_temp),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.4,
        fill: false,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#94a3b8',
        bodyColor: '#f8fafc',
        borderColor: '#1e293b',
        borderWidth: 1,
      }
    },
    scales: {
      y: { 
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
      }
    }
  };

  // Weather variables
  const weather = data.weather_forecast || {};
  const currentWeather = weather.current || {};
  const weatherCondition = currentWeather.condition || {};
  const forecastdays = (weather.forecast?.forecastday) || [];

  // Workflow rendering helper
  const workflow = activeCrop?.ai_workflow || {};
  const workflowKeys = Object.keys(workflow).filter(k => k !== 'error');
  const selectedWorkflowDetails = workflow[customWeekKey] || {};

  return (
    <div className="space-y-8">
      
      {/* Selector and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-wrap gap-4 items-center">
          
          {/* Plot select */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Layers className="h-4 w-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Plot</span>
              <select
                value={selectedPlotId}
                onChange={handlePlotChange}
                className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer pr-4"
              >
                {data.all_plots.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.area} {p.unit})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Crop select */}
          {activePlot && activePlot.crops && activePlot.crops.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <Sprout className="h-4 w-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Crop</span>
                <select
                  value={selectedCropId}
                  onChange={handleCropChange}
                  className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer pr-4"
                >
                  {activePlot.crops.map(c => (
                    <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 font-semibold text-sm transition-all cursor-pointer ml-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Charts and Weather Summary (Width: 5/12) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Weather details card */}
          {currentWeather.temp_c !== undefined ? (
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">Local Weather</h3>
                  <p className="text-sm text-slate-400 mt-1">{activePlot.location.manual_entry}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-300 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl">
                  <CloudSun className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-medium">{weatherCondition.text}</span>
                </div>
              </div>

              {/* Weather parameters */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Thermometer className="h-5 w-5 text-amber-500 mb-1" />
                  <span className="text-xs text-slate-500 font-semibold">Temperature</span>
                  <span className="text-base font-extrabold text-white mt-1">{currentWeather.temp_c}°C</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Droplets className="h-5 w-5 text-blue-400 mb-1" />
                  <span className="text-xs text-slate-500 font-semibold">Humidity</span>
                  <span className="text-base font-extrabold text-white mt-1">{currentWeather.humidity}%</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Wind className="h-5 w-5 text-emerald-400 mb-1" />
                  <span className="text-xs text-slate-500 font-semibold">Wind</span>
                  <span className="text-base font-extrabold text-white mt-1">{currentWeather.wind_kph} kph</span>
                </div>
              </div>

              {/* 4 day Weather forecast */}
              {forecastdays.length > 0 && (
                <div className="pt-4 border-t border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">4-Day Outlook</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {forecastdays.map((day, idx) => (
                      <div key={idx} className="bg-slate-950/40 p-2 rounded-xl text-center flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <img 
                          src={day.day.condition.icon} 
                          alt="forecast condition" 
                          className="h-7 w-7 my-1"
                        />
                        <span className="text-xs font-bold text-slate-300">{Math.round(day.day.maxtemp_c)}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl text-center text-slate-500">
              No weather data available. Configured API key may be invalid or missing.
            </div>
          )}

          {/* Pricing trend telemetry chart */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <span>Market Price Trend</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">INR/kg for '{activeCrop?.crop_name}' (Ascending by week)</p>
              </div>
            </div>
            <div className="h-52 w-full relative">
              {data.price_trend && data.price_trend.length > 0 ? (
                <Line data={priceChartData} options={chartOptions} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  Fetching market values...
                </div>
              )}
            </div>
          </div>

          {/* 7-day Temperature curve chart */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-orange-400" />
                  <span>Temperature Curve</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Past 3 Days + Next 4 Days Forecast</p>
              </div>
            </div>
            <div className="h-48 w-full relative">
              {data.temp_trend && data.temp_trend.length > 0 ? (
                <Line data={tempChartData} options={chartOptions} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  Awaiting temperature coordinates...
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: AI Guru Schedule and Calendar (Width: 7/12) */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex flex-col h-full">
            
            {/* Agronomist header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-5 gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sprout className="h-6 w-6 text-emerald-400" />
                  <span>AI-Generated Workflow for {activeCrop?.crop_name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Sowing Date: {activeCrop?.sowing_date} (Currently Week {activeCrop ? getWeekNumberSinceSowing(activeCrop.sowing_date) : 'N/A'})</span>
                </p>
              </div>

              {/* Selector for custom week range */}
              {workflowKeys.length > 0 && (
                <div className="relative">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-semibold text-slate-400">View Schedule:</span>
                    <select
                      value={customWeekKey}
                      onChange={(e) => setCustomWeekKey(e.target.value)}
                      className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer pr-4"
                    >
                      {workflowKeys.map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Agronomist Weekly Schedule details */}
            {workflow.error || !customWeekKey ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-center gap-2 border border-slate-850 rounded-xl mt-6">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="text-sm font-medium">{workflow.error || "No workflow tasks found. Please verify details."}</p>
              </div>
            ) : (
              <div className="space-y-6 mt-6">
                
                <div className="bg-slate-950 border border-slate-850 px-4 py-3 rounded-xl inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Displaying instructions for: </span>
                  <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">{customWeekKey}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Irrigation Card */}
                  <div className="bg-slate-950/60 border border-slate-850/80 p-4 rounded-xl flex flex-col">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Irrigation</span>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {selectedWorkflowDetails.irrigation || "No custom instructions for this week."}
                    </p>
                  </div>

                  {/* Fertilizer Card */}
                  <div className="bg-slate-950/60 border border-slate-850/80 p-4 rounded-xl flex flex-col">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fertilizer</span>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {selectedWorkflowDetails.fertilizer || "No custom instructions for this week."}
                    </p>
                  </div>

                  {/* Pest Control Card */}
                  <div className="bg-slate-950/60 border border-slate-850/80 p-4 rounded-xl flex flex-col">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pest Control</span>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {selectedWorkflowDetails.pest_control || "No custom instructions for this week."}
                    </p>
                  </div>

                  {/* General Tasks Card */}
                  <div className="bg-slate-950/60 border border-slate-850/80 p-4 rounded-xl flex flex-col">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">General Tasks</span>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {selectedWorkflowDetails.general_tasks || "No custom instructions for this week."}
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
