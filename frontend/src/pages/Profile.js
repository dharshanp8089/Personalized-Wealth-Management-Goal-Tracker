import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState(user?.kyc_status || 'unverified');
  const [loading, setLoading] = useState(false);

  const verifyKyc = async () => {
    setLoading(true);
    try {
      await api.post('/kyc/verify');
      setKycStatus('verified');
      // In a real app, you would force context refresh here, but updating local state is fine for UX
    } catch (err) {
      console.error("KYC Verification failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-white">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header>
        <h1 className="text-5xl font-black text-white tracking-tighter">Identity & Security</h1>
        <p className="text-slate-500 mt-2 text-xl font-medium">Manage your KYC details and Investor Profile.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-8">
          <h2 className="text-2xl font-black text-white tracking-tight">Personal Details</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Full Name</p>
              <p className="text-xl font-bold text-white">{user.name}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Email Address</p>
              <p className="text-lg font-medium text-slate-300">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl space-y-8 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 transition-transform text-8xl">
            {kycStatus === 'verified' ? '✅' : '⏳'}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Compliance & KYC</h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Verification Status</p>
              {kycStatus === 'verified' ? (
                <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Fully Verified</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Unverified Identity</span>
                </div>
              )}
            </div>

            {kycStatus !== 'verified' && (
              <div className="pt-4 border-t border-slate-800/50">
                <p className="text-slate-400 text-xs font-medium mb-4">You have not completed standard regulatory requirements. Features might be limited.</p>
                <button
                  onClick={verifyKyc}
                  disabled={loading}
                  className="w-full bg-cyan-400 text-slate-900 py-4 rounded-2xl font-black hover:bg-cyan-300 transition-all uppercase tracking-widest shadow-lg shadow-cyan-900/20 text-xs"
                >
                  {loading ? "Processing Documents..." : "Simulate KYC Approval"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
          <h2 className="text-2xl font-black text-white tracking-tight mb-8">Risk Topography</h2>
          <div className="flex justify-between items-center bg-slate-800/30 p-6 rounded-2xl">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Calculated Profile</p>
              <p className={`text-3xl font-black tracking-tighter ${user.risk_profile === 'Aggressive' ? 'text-rose-400' : user.risk_profile === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {user.risk_profile || "UNDETERMINED"}
              </p>
            </div>
            <a href="/risk-test" className="text-cyan-400 text-xs font-black uppercase tracking-widest hover:text-cyan-300 border-b border-cyan-400/20">
              Retake Assessment →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
