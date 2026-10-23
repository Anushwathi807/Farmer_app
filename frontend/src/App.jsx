import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, signOut } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Leaf, LayoutDashboard, History, LogOut, Loader2, PlusCircle } from 'lucide-react';

import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Prediction from './pages/Prediction';
import HistoryPage from './pages/History';

// Custom header navigation component
function Navbar({ user, hasOnboarded }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-all duration-300">
            <Leaf className="h-6 w-6 text-emerald-400" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Farmer's Companion
          </span>
        </Link>

        {user && (
          <nav className="flex items-center gap-6">
            {hasOnboarded && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
                    isActive('/dashboard') ? 'text-emerald-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/onboarding"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
                    isActive('/onboarding') ? 'text-emerald-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Plot</span>
                </Link>
                <Link
                  to="/prediction"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
                    isActive('/prediction') ? 'text-emerald-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Analyze Disease</span>
                </Link>
                <Link
                  to="/history"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${
                    isActive('/history') ? 'text-emerald-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-rose-400 transition-colors duration-200 ml-4 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}

function MainApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [checkingOnboard, setCheckingOnboard] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setCheckingOnboard(true);
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch('/api/user-status', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setHasOnboarded(data.has_onboarded);
          }
        } catch (e) {
          console.error("Error checking onboarding status:", e);
        } finally {
          setCheckingOnboard(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshOnboardingStatus = async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/user-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHasOnboarded(data.has_onboarded);
      }
    } catch (e) {
      console.error("Error refreshing onboarding status:", e);
    }
  };

  if (loading || checkingOnboard) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 gap-4">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-medium">Loading credentials...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0b1329] text-slate-100 flex flex-col">
        <Navbar user={user} hasOnboarded={hasOnboarded} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route 
              path="/login" 
              element={user ? (hasOnboarded ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />) : <Login />} 
            />
            <Route 
              path="/onboarding" 
              element={
                user ? (
                  <Onboarding onComplete={refreshOnboardingStatus} hasOnboarded={hasOnboarded} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                user ? (
                  hasOnboarded ? <Dashboard /> : <Navigate to="/onboarding" />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/prediction" 
              element={user ? <Prediction /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/history" 
              element={user ? <HistoryPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="*" 
              element={<Navigate to={user ? (hasOnboarded ? "/dashboard" : "/onboarding") : "/login"} />} 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default MainApp;
