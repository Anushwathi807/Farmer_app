import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { MapPin, Navigation, Search, PlusCircle, Trash2, Save, Loader2, Wheat, Calendar } from 'lucide-react';

export default function Onboarding({ onComplete, hasOnboarded }) {
  const navigate = useNavigate();
  const [plotName, setPlotName] = useState('');
  const [area, setArea] = useState('');
  const [unit, setUnit] = useState('Acres');
  
  // Location
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Crop adding
  const [cropName, setCropName] = useState('Paddy');
  const [sowingDate, setSowingDate] = useState('');
  const [cropsList, setCropsList] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cropOptions = [
    "Paddy", "Wheat", "Corn", "Cotton", "Sugarcane", "Tomato", "Grape", 
    "Potato", "Apple", "Orange", "Strawberry", "Soybean", "Carrot", "Onion"
  ];

  const handleGetCurrentLocation = () => {
    setLocationStatus("Accessing GPS...");
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported by browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocationStatus("GPS Location Set.");
        setManualLocation("GPS Location");
      },
      (err) => {
        console.error(err);
        setLocationStatus("Permission denied or GPS unavailable.");
      }
    );
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError('');
    setLocationStatus('');

    try {
      const token = await auth.currentUser.getIdToken();
      const resp = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setManualLocation(data.name);
        setLocationStatus(`Location set to: ${data.name}`);
      } else {
        const data = await resp.json();
        setError(data.detail || "Location search failed.");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred during location search.");
    } finally {
      setSearching(false);
    }
  };

  const handleAddCrop = () => {
    if (!sowingDate) {
      setError("Please select a sowing date.");
      return;
    }
    setError('');

    // Check duplicate
    if (cropsList.some(c => c.crop_name === cropName)) {
      setError(`${cropName} is already added to this plot.`);
      return;
    }

    setCropsList([...cropsList, { crop_name: cropName, sowing_date: sowingDate }]);
    // Reset inputs
    setSowingDate('');
  };

  const handleRemoveCrop = (index) => {
    setCropsList(cropsList.filter((_, i) => i !== index));
  };

  const handleSavePlot = async () => {
    if (!plotName.trim()) {
      setError("Plot name is required.");
      return;
    }
    if (!area || isNaN(area) || parseFloat(area) <= 0) {
      setError("Please enter a valid plot area.");
      return;
    }
    if (!latitude || !longitude) {
      setError("Please set a location using search or GPS.");
      return;
    }
    if (cropsList.length === 0) {
      setError("Please add at least one crop to your plot.");
      return;
    }

    setError('');
    setSaving(true);

    const payload = {
      name: plotName,
      area: parseFloat(area),
      unit: unit,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        manual_entry: manualLocation || "India"
      },
      crops: cropsList
    };

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Complete onboarding
        await onComplete();
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.detail || "Failed to save onboarding details.");
      }
    } catch (e) {
      console.error(e);
      setError("Network error saving onboarding details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          {hasOnboarded ? "Add New Land Plot" : "Onboard Your Farm"}
        </h1>
        <p className="mt-2 text-slate-400">
          {hasOnboarded 
            ? "Configure a new land plot and add its crops to receive AI-generated agronomic schedules." 
            : "Let's set up your first land plot and crops to generate your AI scheduling calendars."}
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left column: Plot details */}
        <div className="space-y-6 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-3">1. Plot Metadata</h2>
          
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Plot Name</label>
            <input
              type="text"
              value={plotName}
              onChange={(e) => setPlotName(e.target.value)}
              placeholder="e.g. North Vineyard"
              className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Area Size</label>
              <input
                type="number"
                step="any"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="2.5"
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all cursor-pointer"
              >
                <option value="Acres">Acres</option>
                <option value="Hectares">Hectares</option>
                <option value="Bigha">Bigha</option>
                <option value="Guntha">Guntha</option>
              </select>
            </div>
          </div>

          {/* Location setup */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Farm Location</label>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city/region (e.g. Nashik)"
                className="flex-1 rounded-xl bg-slate-950 border border-slate-800 py-3 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
              />
              <button
                type="button"
                onClick={handleSearchLocation}
                disabled={searching}
                className="px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all cursor-pointer flex items-center gap-1 border border-slate-700/50"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span>Search</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>- OR -</span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Use GPS Location</span>
              </button>
            </div>

            {(latitude || longitude || locationStatus) && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                {locationStatus && <p className="font-semibold text-emerald-400">{locationStatus}</p>}
                {(latitude && longitude) && (
                  <p className="text-slate-400 font-mono">Lat: {latitude} | Lon: {longitude}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Crop management */}
        <div className="space-y-6 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex flex-col">
          <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-3">2. Crops Grown</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Crop Name</label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all cursor-pointer"
              >
                {cropOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Sowing Date</label>
              <input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCrop}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold py-3 text-sm transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Crop to Plot</span>
          </button>

          {/* Crops List */}
          <div className="flex-1 flex flex-col justify-start">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Crops List ({cropsList.length})</label>
            {cropsList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-8 text-slate-500 text-center gap-2">
                <Wheat className="h-8 w-8 text-slate-600" />
                <p className="text-sm">No crops added yet. Configure details above and click 'Add Crop'.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {cropsList.map((crop, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-850 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Wheat className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{crop.crop_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>Sown: {crop.sowing_date}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Submit Button */}
      <div className="mt-8 flex justify-end gap-4">
        {hasOnboarded && (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold py-4 px-8 text-sm tracking-wide transition-all cursor-pointer border border-slate-750"
          >
            <span>Cancel</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleSavePlot}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-4 px-8 text-sm tracking-wide transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating AI Farming Schedules...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save New Plot & Crops</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
