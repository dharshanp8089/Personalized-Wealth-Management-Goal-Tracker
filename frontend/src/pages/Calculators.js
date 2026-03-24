import React, { useState } from 'react';

const Calculators = () => {
  const [activeTab, setActiveTab] = useState('sip');

  // SIP State
  const [sipMonthly, setSipMonthly] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);
  
  // Retirement State
  const [retCurrentAge, setRetCurrentAge] = useState(30);
  const [retRetirementAge, setRetRetirementAge] = useState(60);
  const [retCurrentSavings, setRetCurrentSavings] = useState(100000);
  const [retMonthlyContribution, setRetMonthlyContribution] = useState(10000);
  const [retRate, setRetRate] = useState(10);
  
  // Loan State
  const [loanPrincipal, setLoanPrincipal] = useState(500000);
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanYears, setLoanYears] = useState(5);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(val)).replace("INR", "₹");

  const calculateSIP = () => {
    const monthlyRate = sipRate / 12 / 100;
    const months = sipYears * 12;
    const futureValue = sipMonthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const invested = sipMonthly * months;
    return { futureValue, invested, wealthGained: futureValue - invested };
  };

  const calculateRetirement = () => {
    const years = retRetirementAge - retCurrentAge;
    const monthlyRate = retRate / 12 / 100;
    const months = years * 12;
    const futureSavings = retCurrentSavings * Math.pow(1 + retRate/100, years);
    const futureContributions = retMonthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const totalCorpus = futureSavings + futureContributions;
    return { totalCorpus };
  };

  const calculateLoan = () => {
    const monthlyRate = loanRate / 12 / 100;
    const months = loanYears * 12;
    const emi = (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - loanPrincipal;
    return { emi, totalPayment, totalInterest };
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tighter">Financial Calculators</h1>
        <p className="text-slate-500 mt-2 font-medium">Model and forecast your wealth using industry-standard tools.</p>
      </header>
      
      <div className="flex space-x-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
        <button className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'sip' ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-white'}`} onClick={() => setActiveTab('sip')}>SIP Calculator</button>
        <button className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'retirement' ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-white'}`} onClick={() => setActiveTab('retirement')}>Retirement Planner</button>
        <button className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'loan' ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-white'}`} onClick={() => setActiveTab('loan')}>Loan EMI / Payoff</button>
      </div>

      <div className="bg-slate-900 shadow-xl border border-slate-800 rounded-3xl p-8">
        {activeTab === 'sip' && (() => {
          const { futureValue, invested, wealthGained } = calculateSIP();
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Investment (₹)</label>
                  <input type="number" value={sipMonthly} onChange={e => setSipMonthly(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected Return Rate (%)</label>
                  <input type="number" value={sipRate} onChange={e => setSipRate(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time Period (Years)</label>
                  <input type="number" value={sipYears} onChange={e => setSipYears(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
              </div>
              <div className="flex flex-col justify-center bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Expected Value</p>
                <h2 className="text-5xl font-black text-cyan-400 mb-6">{formatCurrency(futureValue)}</h2>
                <div className="flex justify-between text-slate-400 text-sm font-bold">
                  <span>Total Investment: {formatCurrency(invested)}</span>
                  <span className="text-green-400">Wealth Gained: {formatCurrency(wealthGained)}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'retirement' && (() => {
          const { totalCorpus } = calculateRetirement();
          return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Age</label>
                  <input type="number" value={retCurrentAge} onChange={e => setRetCurrentAge(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retirement Age</label>
                  <input type="number" value={retRetirementAge} onChange={e => setRetRetirementAge(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Savings (₹)</label>
                  <input type="number" value={retCurrentSavings} onChange={e => setRetCurrentSavings(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Contribution (₹)</label>
                  <input type="number" value={retMonthlyContribution} onChange={e => setRetMonthlyContribution(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected Return (%)</label>
                  <input type="number" value={retRate} onChange={e => setRetRate(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
              </div>
               <div className="flex flex-col justify-center bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Projected Retirement Corpus</p>
                <h2 className="text-5xl font-black text-cyan-400 mb-6">{formatCurrency(totalCorpus)}</h2>
              </div>
            </div>
          );
        })()}

        {activeTab === 'loan' && (() => {
          const { emi, totalPayment, totalInterest } = calculateLoan();
          return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loan Amount (₹)</label>
                  <input type="number" value={loanPrincipal} onChange={e => setLoanPrincipal(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interest Rate (%)</label>
                  <input type="number" value={loanRate} onChange={e => setLoanRate(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
                 <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loan Tenure (Years)</label>
                  <input type="number" value={loanYears} onChange={e => setLoanYears(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl mt-2 p-4 text-white font-bold" />
                </div>
              </div>
                <div className="flex flex-col justify-center bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Monthly EMI</p>
                <h2 className="text-5xl font-black text-rose-400 mb-6">{formatCurrency(emi)}</h2>
                <div className="flex justify-between text-slate-400 text-sm font-bold">
                  <span>Total Interest: {formatCurrency(totalInterest)}</span>
                  <span>Total Amount Paid: {formatCurrency(totalPayment)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Calculators;
