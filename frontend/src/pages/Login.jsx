import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from '../firebase';
import { Leaf, Mail, Lock, ShieldCheck, ArrowRight, UserPlus, LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      console.error(e);
      let errMsg = "Authentication failed. Please check your credentials.";
      if (e.code === 'auth/email-already-in-use') errMsg = "Email is already in use.";
      if (e.code === 'auth/weak-password') errMsg = "Password should be at least 6 characters.";
      if (e.code === 'auth/invalid-credential') errMsg = "Incorrect email or password.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error(e);
      setError("Failed to sign in as guest. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-slate-900/40 border border-slate-800/80 p-8 rounded-2xl shadow-xl shadow-slate-950/50 backdrop-blur-sm">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-emerald-500/10 rounded-xl mb-4 text-emerald-400">
            <Leaf className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            {isRegister ? "Join Farmer's Companion" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isRegister 
              ? "Create your free account to track crops and analyze diseases." 
              : "Access your farming dashboard and telemetry."}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl bg-slate-950 border border-slate-800 py-3 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 text-sm tracking-wide transition-all duration-300 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                {isRegister ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                <span>{isRegister ? "Sign Up" : "Sign In"}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800/80"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs font-medium uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-slate-800/80"></div>
        </div>

        {/* Guest access */}
        <button
          type="button"
          onClick={handleGuestSignIn}
          disabled={guestLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 text-sm transition-all cursor-pointer border border-slate-700/50"
        >
          {guestLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Continue as Guest</span>
            </>
          )}
        </button>

        {/* Toggle */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            {isRegister ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}
