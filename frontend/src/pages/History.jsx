import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  History, Calendar, Sprout, AlertTriangle, ShieldCheck, ArrowUpRight, 
  Search, X, ListChecks, DollarSign, RefreshCw, Loader2, Info
} from 'lucide-react';

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail sidebar state
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Sort history by timestamp descending, checking timestamp format defensively
        const sortedHistory = (data.history || []).sort((a, b) => {
          const getMs = (item) => {
            if (!item || !item.timestamp) return 0;
            if (typeof item.timestamp === 'object' && item.timestamp._seconds) {
              return item.timestamp._seconds * 1000;
            }
            const date = new Date(item.timestamp);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          };
          return getMs(b) - getMs(a);
        });
        setHistoryList(sortedHistory);
      } else {
        const err = await response.json();
        setError(err.detail || "Failed to load scan history logs.");
      }
    } catch (e) {
      console.error(e);
      setError("Network error fetching previous scan history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Formatting utility for timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown Date';
    if (typeof timestamp === 'object' && timestamp._seconds) {
      const date = new Date(timestamp._seconds * 1000);
      return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Helper to normalize fields across new/old schemas
  const getRecordDetails = (record) => {
    if (!record) return {};
    
    // Plant species
    const cropSpecies = record.plant_name || record.crop_species || record.prediction || 'Unknown';
    
    // Disease name parsing helper
    let diseaseName = record.disease_name;
    if (!diseaseName && record.prediction) {
      if (record.prediction.includes('___')) {
        diseaseName = record.prediction.split('___')[1].replace(/_/g, ' ');
      } else {
        diseaseName = record.prediction;
      }
    }
    diseaseName = diseaseName || 'N/A';
    
    // Healthy check
    const isHealthy = diseaseName.toLowerCase().includes("healthy");

    // Severity / Impact
    const impact = record.impact || record.crop_impact || 'Low';

    // Confidence mapping
    let confidencePct = 0;
    if (record.confidence !== undefined) {
      const c = parseFloat(record.confidence);
      confidencePct = c <= 1.0 ? Math.round(c * 100) : Math.round(c);
    }

    // Yield
    const predictedYield = record.predicted_yield_kg_per_acre !== undefined
      ? parseFloat(record.predicted_yield_kg_per_acre).toFixed(1)
      : 'N/A';

    // Yield reduction %
    let yieldLossPct = record.yield_reduction_pct;
    if (yieldLossPct === undefined && record.yield_reduction_factor !== undefined) {
      yieldLossPct = Math.round(record.yield_reduction_factor * 100);
    }
    yieldLossPct = yieldLossPct || 0;

    // Market Price
    const marketPrice = record.market_price_per_kg !== undefined
      ? parseFloat(record.market_price_per_kg).toFixed(1)
      : (record.market_price_inr !== undefined ? parseFloat(record.market_price_inr).toFixed(1) : 'N/A');

    // Recommendations mapping
    const harvestRecs = (record.recommendations && typeof record.recommendations === 'object')
      ? record.recommendations.harvest_recommendations
      : record.harvest_recommendations;
      
    const sellingRecs = (record.recommendations && typeof record.recommendations === 'object')
      ? record.recommendations.selling_strategies
      : record.selling_strategies;

    const bargainingRecs = (record.recommendations && typeof record.recommendations === 'object')
      ? record.recommendations.bargaining_tips
      : record.bargaining_tips;

    return {
      cropSpecies,
      diseaseName,
      isHealthy,
      impact,
      confidencePct,
      predictedYield,
      yieldLossPct,
      marketPrice,
      harvestRecs,
      sellingRecs,
      bargainingRecs
    };
  };

  // Filtering defensively
  const filteredHistory = historyList.filter(record => {
    const term = searchQuery.toLowerCase();
    const { cropSpecies, diseaseName, impact } = getRecordDetails(record);
    return (
      cropSpecies.toLowerCase().includes(term) ||
      diseaseName.toLowerCase().includes(term) ||
      impact.toLowerCase().includes(term)
    );
  });

  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto py-4 px-4 sm:px-6">
        
        {/* Header and search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <History className="h-8 w-8 text-emerald-400" />
              <span>Scan Database</span>
            </h1>
            <p className="mt-2 text-slate-400">History of all previous leaf diagnoses, economic values, and expert suggestions.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crop or disease..."
                className="w-64 rounded-xl bg-slate-900 border border-slate-800 py-2.5 pl-9 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl cursor-pointer transition-colors"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium mb-6">
            {error}
          </div>
        )}

        {/* History Table */}
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="text-slate-400 font-medium text-sm">Consulting database logs...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="border border-dashed border-slate-850 rounded-2xl p-16 text-slate-500 text-center flex flex-col items-center gap-2 bg-slate-900/10">
            <Info className="h-8 w-8 text-slate-700" />
            <p className="text-sm font-semibold text-slate-400">No records found</p>
            <p className="text-xs text-slate-500">
              {searchQuery ? "Try refining your search terms." : "Diagnose your first leaf to view records here."}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-slate-950/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Date & Time</th>
                    <th className="py-4 px-6">Crop</th>
                    <th className="py-4 px-6">Disease Classification</th>
                    <th className="py-4 px-6">Confidence</th>
                    <th className="py-4 px-6">Severity</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-200">
                  {filteredHistory.map((record) => {
                    if (!record) return null;
                    const {
                      cropSpecies,
                      diseaseName,
                      isHealthy,
                      impact,
                      confidencePct
                    } = getRecordDetails(record);
                    const dateFormatted = formatTimestamp(record.timestamp);

                    return (
                      <tr 
                        key={record.id || Math.random().toString()} 
                        className="hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-4 px-6 font-medium text-slate-400 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-600" />
                          <span>{dateFormatted}</span>
                        </td>
                        <td className="py-4 px-6 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Sprout className="h-4 w-4 text-emerald-500/80" />
                            <span>{cropSpecies}</span>
                          </span>
                        </td>
                        <td className={`py-4 px-6 font-bold ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {diseaseName}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-300">
                          {confidencePct}%
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            impact === 'High' 
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                              : impact === 'Medium' 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                            {impact}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 text-xs font-bold rounded-xl transition-all cursor-pointer hover:text-white"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Slide-out Sidebar Drawer for Recommendations */}
      {selectedRecord && (() => {
        const {
          cropSpecies,
          diseaseName,
          isHealthy,
          impact,
          predictedYield,
          yieldLossPct,
          marketPrice,
          harvestRecs,
          sellingRecs,
          bargainingRecs
        } = getRecordDetails(selectedRecord);

        return (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300">
            
            {/* Overlay closer */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedRecord(null)}></div>
            
            {/* Content block */}
            <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-screen flex flex-col p-6 shadow-2xl transition-transform duration-300 overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-emerald-400" />
                  <span>Diagnostic Details</span>
                </h2>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 text-slate-500 hover:text-white transition-colors cursor-pointer border border-slate-800 hover:border-slate-750 bg-slate-950 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                
                {/* Species and status */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Record Info</span>
                  <p className="text-sm font-semibold text-slate-300 mt-1">
                    Crop: <span className="text-white font-extrabold">{cropSpecies}</span>
                  </p>
                  <p className="text-sm font-semibold text-slate-350 mt-1">
                    Status: <span className={`font-extrabold ${isHealthy ? "text-emerald-400" : "text-amber-400"}`}>{diseaseName}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">
                    ID: {selectedRecord.id || 'N/A'}
                  </p>
                </div>

                {/* Economic stats */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Telemetry Stats</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Yield Est:</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">{predictedYield} kg/acre</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Market Price:</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">₹{marketPrice}/kg</span>
                    </div>
                  </div>
                </div>

                {/* Harvesting recommendations */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ListChecks className="h-4 w-4 text-emerald-400" />
                    <span>Harvesting Recommendations</span>
                  </span>
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                    {harvestRecs || "Proceed with standard harvesting schedules."}
                  </div>
                </div>

                {/* Selling strategy */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-purple-400" />
                    <span>Selling Strategy</span>
                  </span>
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                    {sellingRecs || "Seek local mandi listings for best rates."}
                  </div>
                </div>

                {/* Bargaining tips */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-purple-400" />
                    <span>Bargaining Tips</span>
                  </span>
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                    {bargainingRecs || "Negotiate rates based on prime grade sorting."}
                  </div>
                </div>

              </div>

            </div>

          </div>
        );
      })()}

    </div>
  );
}
