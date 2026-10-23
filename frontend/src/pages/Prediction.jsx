import React, { useState, useRef } from 'react';
import { auth } from '../firebase';
import { 
  Upload, Image as ImageIcon, X, Loader2, ShieldCheck, Sprout, AlertOctagon, 
  TrendingDown, DollarSign, ListChecks, HelpCircle, FileSpreadsheet, Percent, Info
} from 'lucide-react';

export default function Prediction() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        setPreviewUrl(URL.createObjectURL(droppedFile));
        setError('');
      } else {
        setError("Please drop a valid image file.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.prediction);
      } else {
        const err = await response.json();
        setError(err.detail || "Diagnosis failed. Please verify the leaf image is clear and try again.");
      }
    } catch (e) {
      console.error(e);
      setError("Network error communicating with diagnosis API.");
    } finally {
      setAnalyzing(false);
    }
  };

  const isHealthy = result?.disease_name ? result.disease_name.toLowerCase().includes("healthy") : false;

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Leaf Disease Diagnoser</h1>
        <p className="mt-2 text-slate-400">Upload a photo of a crop leaf. Gemini AI will classify the disease, estimate yield impact, and provide harvesting/bargaining tips.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Upload panel (Width: 5/12 in wide screen) */}
        <div className="md:col-span-5 space-y-4">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px] transition-all ${
              dragActive ? 'border-emerald-400 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'
            }`}
          >
            {previewUrl ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <img 
                  src={previewUrl} 
                  alt="Leaf preview" 
                  className="max-h-60 rounded-xl object-contain border border-slate-800"
                />
                <button
                  type="button"
                  onClick={clearSelection}
                  className="absolute -top-2 -right-2 p-1.5 bg-slate-850 hover:bg-slate-750 text-slate-400 hover:text-white rounded-full border border-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-slate-500 mt-2 font-mono truncate max-w-full">{file?.name}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 bg-slate-850 rounded-2xl text-slate-400 mb-4 border border-slate-800/80">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-slate-200">Drag & drop your leaf photo here</p>
                <p className="text-xs text-slate-500 mt-1">Supports JPEG, PNG up to 10MB</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Browse File
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {file && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 text-sm tracking-wide transition-all cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing leaf...</span>
                </>
              ) : (
                <>
                  <Sprout className="h-4 w-4" />
                  <span>Analyze Plant</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Results Panel (Width: 7/12) */}
        <div className="md:col-span-7">
          {result ? (
            <div className="space-y-6">
              
              {/* Core Diagnosis Card */}
              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Diagnosis Details</h3>
                    <h2 className="text-2xl font-black text-white mt-1">
                      {result.crop_species || 'Unknown Crop'} — <span className={isHealthy ? "text-emerald-400" : "text-amber-400"}>{result.disease_name || 'N/A'}</span>
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Confidence</span>
                    <span className="text-lg font-black text-emerald-400 mt-1 block">{((result.confidence || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Key indicators */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-850">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-semibold text-slate-500 block">Severity</span>
                    <span className={`text-sm font-bold mt-1 block ${
                      result.crop_impact === 'High' ? 'text-rose-400' : result.crop_impact === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {result.crop_impact || 'Low'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-semibold text-slate-500 block">Yield Loss</span>
                    <span className="text-sm font-bold text-white mt-1 block flex items-center gap-0.5">
                      <Percent className="h-3.5 w-3.5 text-slate-500" />
                      <span>{result.yield_reduction_pct || 0}%</span>
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-semibold text-slate-500 block">Market Value</span>
                    <span className="text-sm font-bold text-white mt-1 block flex items-center gap-0.5">
                      <span className="text-xs text-slate-500">₹</span>
                      <span>{result.market_price_inr || 0}/kg</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Economic stats and Advice grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Financial impact */}
                {!isHealthy ? (
                  <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-rose-400" />
                      <span>Loss Assessment</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                        <span className="text-xs text-slate-400 block">Forecasted crop yield loss:</span>
                        <span className="text-lg font-extrabold text-rose-400 mt-1 block">-{result.yield_reduction_pct || 0}% yield decrease</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        <Info className="h-3 w-3 inline mr-1 text-slate-600 align-text-bottom" />
                        This estimate is based on the disease severity, standard sowing yields, and current localized market indexes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-4 flex flex-col justify-center text-center">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full mx-auto">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2">Crop is Healthy</h3>
                    <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-1 leading-relaxed">
                      Your crop shows no signs of active disease. Maintain current schedule.
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-emerald-400" />
                    <span>Harvest Planning</span>
                  </h3>
                  <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                    <p>
                      <strong className="text-slate-400 block mb-0.5">Advice:</strong>
                      {result.harvest_recommendations || "Proceed with standard harvesting schedules."}
                    </p>
                  </div>
                </div>

              </div>

              {/* Marketing strategy */}
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-400" />
                  <span>Selling & Bargaining Advice</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                    <span className="font-bold text-purple-400 block mb-1">Selling Strategy</span>
                    <p className="leading-relaxed">{result.selling_strategies || "Seek local mandi listings for best rates."}</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                    <span className="font-bold text-purple-400 block mb-1">Bargaining Tips</span>
                    <p className="leading-relaxed">{result.bargaining_tips || "Negotiate rates based on prime grade sorting."}</p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-2xl p-12 text-slate-500 text-center gap-3 min-h-[300px] bg-slate-900/10">
              <ImageIcon className="h-10 w-10 text-slate-700" />
              <div>
                <p className="text-sm font-semibold text-slate-400">Diagnosis Details Awaiting Image</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Upload a leaf photo on the left panel and click 'Analyze Plant' to generate the diagnostic dashboard.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
