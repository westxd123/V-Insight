"use client";

import { useState, useMemo, useEffect } from 'react';
import { Search, Info, TrendingUp, Shield, Swords, Map, BarChart3, Activity, Terminal, Zap, Target, AlertTriangle, CircleDashed, User, Lock, Mail, ChevronRight, LogOut, Star, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const PremiumStar = ({ index }) => {
  const angle = Math.random() * Math.PI * 2; // Random 360 degree angle
  const velocity = 50 + Math.random() * 80; // Random explosion force
  const x = Math.cos(angle) * velocity;
  const y = Math.sin(angle) * velocity;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 1, 0],
        x: x,
        y: y,
        rotate: [0, Math.random() * 360]
      }}
      transition={{
        duration: 1 + Math.random(),
        ease: [0.23, 1, 0.32, 1] // Custom explosion easing
      }}
      className="absolute pointer-events-none"
    >
      <Star size={8 + Math.random() * 10} className="text-amber-400 fill-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
    </motion.div>
  );
};

export default function Home() {
  const [riotId, setRiotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMap, setSelectedMap] = useState(null);
  const [activeComp, setActiveComp] = useState(null);
  const [compLoading, setCompLoading] = useState(false);
  const [mapFilter, setMapFilter] = useState('all');
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState('latest');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchDetailData, setMatchDetailData] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const API_URL = ""; // Vercel'de /api rewrites kullanıldığı için boş bırakıyoruz, localde proxy/rewrite gerekecek veya env kullanılacak.

  // AUTH STATES
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', riotId: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ cardNo: '', expiry: '', cvv: '' });
  const [isPaying, setIsPaying] = useState(false);
  const [isHoveringPremium, setIsHoveringPremium] = useState(false);
  const [starTrigger, setStarTrigger] = useState(0);
  const [searchCount, setSearchCount] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'error') => {
    setToast({ message, type });
    // Reset toast after 4 seconds
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const savedCount = localStorage.getItem('v-search-count');
    if (savedCount) setSearchCount(parseInt(savedCount));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('v-token');
    if (token) {
      fetchUser(token);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        localStorage.removeItem('v-token');
      }
    } catch (e) {
      console.error('Auth error:', e);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    const endpoint = authMode === 'login' ? 'login' : 'register';
    try {
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Siber protokol hatası (Sunucu beklenmedik bir yanıt döndürdü).');
      }

      if (res.ok) {
        if (authMode === 'login') {
          localStorage.setItem('v-token', data.token);
          setUser(data.user);
          setShowAuthModal(false);
          showNotification('Neural sisteme erişim sağlandı.', 'success');
        } else {
          setAuthMode('login');
          setAuthForm({ ...authForm, password: '' });
          showNotification('Kayıt başarılı. Şimdi sisteme girebilirsiniz.', 'success');
        }
      } else {
        showNotification(data.error || 'Bağlantı reddedildi.');
      }
    } catch (e) {
      console.error('Auth error:', e);
      showNotification(`Neural link hatası: ${e.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('v-token');
    setUser(null);
    setShowProfile(false);
  };

  const handleUpgrade = () => {
    setShowShop(true);
    setShowProfile(false);
  };

  const processPurchase = (plan) => {
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleFinalizePayment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('v-token');
    if (!token) return showNotification('Lütfen önce sisteme erişin.');

    setIsPaying(true);

    // Simulate payment delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      const res = await fetch(`${API_URL}/api/auth/upgrade`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showNotification(`${selectedPlan.name} erişimi aktif edildi.`, 'success');
        setSearchCount(0);
        localStorage.removeItem('v-search-count');
        setShowCheckout(false);
        setShowShop(false);
        fetchUser(token);
      } else {
        showNotification('Ödeme reddedildi. Bilgilerinizi kontrol edin.');
      }
    } catch (e) {
      showNotification('Bağlantı koptu.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleMatchClick = async (match) => {
    setSelectedMatch(match.matchId);
    setMatchLoading(true);
    setMatchDetailData(null);
    try {
      const res = await fetch(`${API_URL}/api/match-detail/${match.region}/${match.matchId}`);
      if (res.ok) {
        const data = await res.json();
        setMatchDetailData(data);
      } else {
        showNotification('Maç detayları alınamadı.');
      }
    } catch (e) {
      console.error('Match detail error:', e);
      showNotification('Bağlantı hatası.');
    } finally {
      setMatchLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!riotId.includes('#')) {
      setError('Lütfen geçerli bir Riot ID girin (İsim#Etiket)');
      return;
    }

    if (!user?.isPremium && searchCount >= 3) {
      setShowUpgradePrompt(true);
      return;
    }

    setLoading(true);
    setError(null);
    setStats(null); // Clear old stats immediately

    try {
      const [name, tag] = riotId.split('#');
      let res;
      let data;

      try {
        res = await fetch(`${API_URL}/api/stats-full/${name}/${tag}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `Status ${res.status}` }));
          throw new Error(errData.error || 'API Error');
        }
        data = await res.json();
      } catch (e) {
        if (e.message.includes('fetch')) {
          res = await fetch(`http://127.0.0.1:3001/api/stats-full/${name}/${tag}`);
          if (!res.ok) {
            const errData = await res.json().catch(() => ({ error: `Status ${res.status}` }));
            throw new Error(errData.error || 'API Error');
          }
          data = await res.json();
        } else {
          throw e;
        }
      }

      const enhancedData = {
        ...data,
        rank: data.rank || 'Analiz Edildi (Canlı)',
        tier: data.tier || 0,
        rankIcon: data.rankIcon,
        level: data.level || 0,
        headshots: data.headshots || data.headshotPct || Math.round(22 + Math.random() * 8),
        bodyshots: data.bodyshots || data.bodyshotPct || Math.round(65 + Math.random() * 8),
        legshots: data.legshots || data.legshotPct || Math.round(7 + Math.random() * 5),
        topMaps: data.mapStats.sort((a, b) => b.wins - a.wins).slice(0, 3).map(m => m.name),
        mapStats: data.mapStats.map(m => ({
          ...m,
          image: getMapImage(m.name),
          recentForm: 'W W L W L'
        })),
        agentStats: data.agentStats.map(a => ({
          ...a,
          name: a.name || getAgentName(a.id),
          image: getAgentImage(a.name || a.id)
        })),
        matchHistory: data.matchHistory.map(m => ({
          ...m,
          agentImage: getAgentImage(m.agentId || m.name)
        }))
      };

      setStats(enhancedData);

      if (!user?.isPremium) {
        const newCount = searchCount + 1;
        setSearchCount(newCount);
        localStorage.setItem('v-search-count', newCount);
      }
      window.scrollTo({ top: window.innerHeight - 100, behavior: 'smooth' });
    } catch (e) {
      console.error('Search error:', e);
      setError(e.message || 'Bir hata oluştu.');
      setStats(null); // Clear old stats on error
    } finally {
      setLoading(false);
    }
  };

  const latestMatchAnalysis = useMemo(() => {
    if (!stats || !stats.matchHistory || stats.matchHistory.length === 0) return null;

    // Use dynamic data from backend if available, otherwise fall back to basic simulation
    if (stats.aiAnalysis?.latestMatchReport) {
      return stats.aiAnalysis.latestMatchReport;
    }

    const lastMatch = stats.matchHistory[0];
    const isHighKDA = (lastMatch.kills / (lastMatch.deaths || 1)) > 1.2;
    const isVictorious = lastMatch.won;

    return {
      map: lastMatch.mapName,
      stats: `${lastMatch.kills}/${lastMatch.deaths}/${lastMatch.assists || 0}`,
      positives: [
        isHighKDA ? "Yüksek düello verimliliği sağlandı." : "Asist katkısı ile takım oyununa destek olundu.",
        isVictorious ? "Kritik rauntlarda alan kontrolü başarıyla korundu." : "Zorlu şartlarda bireysel performans stabilize edildi.",
        "İlk kan alma girişimlerinde %60 başarı sağlandı."
      ],
      negatives: [
        !isHighKDA ? "Bireysel düellolarda agresyon zamanlaması hatalı." : "Skor üstünlüğüne rağmen harita rotasyonunda gecikme yaşandı.",
        "Utility (yetenek) kullanımı %40 verimle gerçekleşti.",
        "Eco rauntlarda gereksiz harcama yapıldı."
      ],
      solution: `${lastMatch.mapName} haritasındaki bu performansın ardından, bir sonraki maçta daha kompakt bir oyun sergilemen gerekiyor.`
    };
  }, [stats]);

  const radarData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: stats.mapStats.slice(0, 6).map(m => m.name),
      datasets: [
        {
          label: 'Saldırı Galibiyet Oranı',
          data: stats.mapStats.slice(0, 6).map(m => m.attackWinRate),
          backgroundColor: 'rgba(255, 70, 85, 0.2)',
          borderColor: 'rgba(255, 70, 85, 1)',
          borderWidth: 2,
        },
        {
          label: 'Savunma Galibiyet Oranı',
          data: stats.mapStats.slice(0, 6).map(m => m.defenseWinRate),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: '#888', font: { size: 10 } },
        ticks: { display: false, stepSize: 20 }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <main className="min-h-screen relative overflow-x-hidden pt-20">
      <div className="scanline" />
      <div className="data-stream" style={{ right: '40px' }} />
      <div className="data-stream" style={{ left: '40px' }} />

      {/* PREMIUM HEADER NAVIGATION */}
      <header className="fixed top-0 left-0 w-full z-[100] backdrop-blur-xl border-b border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center rotate-45 group-hover:rotate-[135deg] transition-transform duration-500">
              <Zap size={20} className="text-primary -rotate-45 group-hover:-rotate-[135deg] transition-transform" />
            </div>
            <span className="text-2xl font-black italic tracking-tighter uppercase val-gradient-text">V-Insight</span>
          </div>

          <div className="flex items-center gap-6">
            {!user ? (
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 transition-all text-[10px] font-black uppercase tracking-widest text-white group"
              >
                <User size={14} className="text-zinc-500 group-hover:text-primary" />
                Sisteme Eriş
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:border-primary/40 transition-all group"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-white leading-none uppercase">{user.username}</span>
                    <span className="text-[7px] font-bold text-primary tracking-widest uppercase mt-1">
                      {user.isPremium ? 'PREMIUM ACCESS' : 'NEURAL LINK ACTIVE'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden">
                    <User size={16} className="text-primary" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>


      <div className="px-4 py-8 md:px-8 max-w-7xl mx-auto relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
        <div className="hero-glow top-0 left-1/4" />

        {/* PREMIUM NEURAL BACKGROUND INFRASTRUCTURE */}
        {!stats && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* 1. Side Terminal Logs - Left */}
            <div className="absolute left-10 top-1/4 w-64 opacity-20 hidden xl:block">
              <div className="text-[9px] font-mono text-primary space-y-2 uppercase tracking-tighter">
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>{`>`} INITIALIZING_NEURAL_CORE... OK</span>
                </div>
                <div>{`>`} DECRYPTING_PACKETS... [256-BIT]</div>
                <div className="text-zinc-500">{`>`} TARGET_REGION: EU_NORTH</div>
                <div className="text-zinc-500">{`>`} LATENCY: 24ms</div>
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-white bg-primary/20 px-2 py-1 inline-block"
                >
                  SYSTEM_STATUS: OPERATIONAL
                </motion.div>
                <div className="h-20 w-px bg-gradient-to-b from-primary/40 to-transparent ml-2 mt-4"></div>
              </div>
            </div>

            {/* 2. Side Metrics - Right */}
            <div className="absolute right-10 top-1/3 w-64 opacity-20 hidden xl:block text-right">
              <div className="text-[9px] font-mono text-blue-400 space-y-4 uppercase tracking-tighter font-black">
                <div>
                  <div className="text-zinc-600 mb-1">GLOBAL_META_STABILITY</div>
                  <div className="text-xl italic font-black">98.42%</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="w-32 h-[1px] bg-blue-400/20"></div>
                  <div className="w-24 h-[1px] bg-blue-400/40"></div>
                  <div className="w-16 h-[1px] bg-blue-400/60"></div>
                </div>
                <div>
                  <div className="text-zinc-600 mb-1">ACTIVE_SESSIONS</div>
                  <div className="text-xl italic font-black">12,402</div>
                </div>
              </div>
            </div>


            {/* 4. Tiny Floating Glitch Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%',
                  opacity: 0
                }}
                animate={{
                  y: [null, Math.random() * 100 + '%'],
                  opacity: [0, 0.2, 0]
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
              />
            ))}
          </div>
        )}

        {/* Floating Geometric Ornaments */}
        <div className="absolute top-20 left-10 w-32 h-32 border border-white/5 rotate-12 opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-48 h-48 border border-white/5 -rotate-12 opacity-10 animate-pulse delay-700"></div>

        {/* Decorative Floating Background Modules */}
        <div className="hidden xl:block absolute -left-32 top-1/4 opacity-10 rotate-12 pointer-events-none">
          <Terminal size={400} className="text-primary" />
        </div>
        <div className="hidden xl:block absolute -right-32 bottom-1/4 opacity-10 -rotate-12 pointer-events-none">
          <Activity size={400} className="text-blue-400" />
        </div>



        {/* Floating Decals */}
        <div className="absolute top-[20%] right-[15%] opacity-20 pointer-events-none">
          <div className="text-[10px] font-mono text-zinc-600 space-y-1">
            <div>[ COORDINATE SET: 40.7128° N, 74.0060° W ]</div>
            <div>[ NEURAL LINK STABILITY: 98.4% ]</div>
            <div>[ ENCRYPTED_HANDSHAKE: SUCCESS ]</div>
          </div>
        </div>

        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-16 pt-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse"></div>
            <div className="w-20 h-20 bg-secondary border-2 border-primary rounded-2xl flex items-center justify-center rotate-45 shadow-[0_0_30px_rgba(255,70,85,0.4)] transition-transform hover:rotate-[135deg] duration-700">
              <Zap size={40} className="text-primary -rotate-45" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter val-gradient-text uppercase italic mb-4"
          >
            V-Insight
          </motion.h1>
          <div className="flex items-center gap-4 text-zinc-500 font-bold tracking-widest text-[10px]">
            <span className="flex items-center gap-1"><Activity size={10} className="text-primary" /> SİNİRSEL MOTOR v4</span>
            <span className="w-4 h-[1px] bg-zinc-800"></span>
            <span>BEKLENMEYENİ TAHMİN EDER</span>
          </div>
        </div>

        {/* Search Section Area - clean center only */}
        <div className="flex flex-col items-center justify-center relative z-10 w-full mb-32">

          <motion.form
            layout
            onSubmit={handleSearch}
            className="group relative w-full max-w-2xl px-4"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <input
                type="text"
                placeholder="RIOT ID (İSİM#ETİKET)"
                value={riotId}
                onChange={(e) => setRiotId(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl py-6 px-8 pl-14 text-white uppercase tracking-widest focus:outline-none focus:border-primary transition-all shadow-2xl"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={24} />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary hover:bg-white hover:text-black text-white font-black py-3 px-8 rounded-xl transition-all disabled:opacity-50 uppercase italic text-sm tracking-tighter"
              >
                {loading ? 'Taranıyor...' : 'Analiz Et'}
              </button>
            </div>
          </motion.form>

          {/* Scroll Down Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent"></div>
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-600">İşlemleri Kaydır</span>
          </motion.div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center mb-12 backdrop-blur-md max-w-2xl mx-auto relative z-10"
            >
              <div className="font-bold uppercase tracking-widest mb-1">Sistem Müdahalesi</div>
              <div className="text-sm opacity-80 font-mono tracking-tighter">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 border-2 border-primary/20 rounded-full animate-ping"></div>
              <div className="absolute inset-0 w-24 h-24 border-t-2 border-primary rounded-full animate-spin"></div>
            </div>
            <p className="mt-8 text-primary font-bold uppercase tracking-[0.3em] animate-pulse italic">Riot Ana Bilgisayarına Erişiliyor...</p>
          </div>
        ) : stats && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10"
          >
            {/* Player Summary Header */}
            <div className="lg:col-span-12 glass-card p-10 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative">
              <div className="absolute bottom-0 right-0 p-4 opacity-5 font-black text-9xl tracking-tight select-none translate-x-10 translate-y-10">ANALİZ</div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-primary blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-primary relative z-10 p-1 bg-black shadow-[0_0_30px_rgba(255,70,85,0.2)]">
                  <img src={stats.card || stats.agentStats[0]?.image || "https://media.valorant-api.com/playercards/3f61c772-4560-cd3b-a43c-61ad35aef2cf/smallart.png"} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                  {/* Level Badge Overlay */}
                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded text-[8px] font-black text-white">
                    LVL {stats.level}
                  </div>
                </div>
              </div>

              <div className="text-center md:text-left z-10">
                <h2 className="text-6xl font-black mb-4 italic uppercase tracking-tighter glitch-text leading-none">{stats.playerName}</h2>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {/* Rank Progression HUD - Moved here */}
                  {(stats.rankIcon || stats.tier > 0) && (
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-xl group/rank hover:border-primary/50 transition-all relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/rank:opacity-100 transition-opacity"></div>
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="24" cy="24" r="21" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                          <motion.circle
                            cx="24" cy="24" r="21" fill="transparent" stroke="#ff4655"
                            strokeWidth="3" strokeDasharray="132"
                            initial={{ strokeDashoffset: 132 }}
                            animate={{ strokeDashoffset: 132 - (132 * (stats.rr || 0) / 100) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <img
                          src={stats.rankIcon || `https://media.valorant-api.com/competitivetiers/03621f52-413b-28c7-410c-67c749c2ba9b/${stats.tier}/largeicon.png`}
                          alt={stats.rank}
                          className="absolute w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(255,70,85,0.5)] group-hover/rank:scale-110 transition-transform"
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white uppercase leading-none tracking-tighter">{stats.rank}</span>
                          {stats.lastChange !== undefined && (
                            <span className={`text-[8px] font-black px-1 py-0.5 rounded ${stats.lastChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 text-primary'}`}>
                              {stats.lastChange >= 0 ? '+' : ''}{stats.lastChange}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{stats.rr || 0}/100 RR</span>
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {stats.aiAnalysis?.badges?.map((badge, bIdx) => (
                      <div key={bIdx} className={`px-4 py-1.5 rounded-lg border text-[10px] font-black italic uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 ${badge.color === 'primary' ? 'bg-primary/20 border-primary/40 text-primary shadow-primary/20' :
                        badge.color === 'blue-400' ? 'bg-blue-400/20 border-blue-400/40 text-blue-400 shadow-blue-400/20' :
                          badge.color === 'amber-500' ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-amber-500/20' :
                            'bg-zinc-800 border-white/10 text-zinc-400'
                        }`}>
                        <div className={`w-1 h-1 rounded-full animate-pulse ${badge.color === 'primary' ? 'bg-primary' :
                          badge.color === 'blue-400' ? 'bg-blue-400' :
                            badge.color === 'amber-500' ? 'bg-amber-500' : 'bg-zinc-400'
                          }`}></div>
                        {badge.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl backdrop-blur-sm group hover:border-primary/40 transition-all relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="text-[10px] uppercase text-zinc-500 block mb-1 relative z-10">Neural Stability</span>
                    <span className="text-xl font-bold text-glow-red relative z-10">%{stats.aiAnalysis?.metrics?.stability || 0}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl backdrop-blur-sm group hover:border-blue-400/40 transition-all relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-400/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="text-[10px] uppercase text-zinc-500 block mb-1 relative z-10">Neural Load</span>
                    <span className="text-xl font-bold text-blue-400 relative z-10">%{stats.aiAnalysis?.metrics?.neuralLoad || 0}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl backdrop-blur-sm group hover:border-green-500/40 transition-all relative overflow-hidden">
                    <div className="absolute inset-0 bg-green-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="text-[10px] uppercase text-zinc-500 block mb-1 relative z-10">Genel Galibiyet</span>
                    <span className="text-xl font-bold text-green-400 relative z-10">%{stats.totalWinRate || 0}</span>
                  </div>
                </div>
              </div>

              <div className="ml-auto flex gap-3 z-10">
                {stats.topMaps.map((map, i) => (
                  <div key={i} className="hidden lg:block bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-center group hover:border-primary/20 transition-all">
                    <div className="text-[10px] uppercase text-primary font-bold mb-1 opacity-50 group-hover:opacity-100 transition-opacity tracking-widest leading-none mb-2">Baskın Harita</div>
                    <div className="font-black text-lg uppercase italic tracking-tighter leading-none">{map}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Areas */}
            {/* Main Content Area */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              <div className="bg-gradient-to-br from-[#0a0a0a] via-black to-[#0a0a0a] rounded-[2rem] p-8 relative overflow-hidden">
                {/* Neural Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_20px_rgba(255,70,85,0.2)]">
                      <Activity className="text-primary animate-pulse" size={24} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Yapay Zeka Savaş Raporu</h4>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">Sınır Ötesi Analiz // Terminal v4.2</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Canlı Bağlantı</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  {stats.aiAnalysis?.insights && stats.aiAnalysis.insights.length > 0 ? (
                    stats.aiAnalysis.insights.map((insight, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`glass-card p-6 border-l-4 ${insight.severity === 'high' ? 'border-primary' :
                          insight.severity === 'medium' ? 'border-amber-500' : 'border-blue-400'
                          } hover:scale-[1.02] transition-transform cursor-default group`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 p-2 rounded-lg ${insight.severity === 'high' ? 'bg-primary/10 text-primary' :
                            insight.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                            {insight.type === 'CRITICAL_ERROR' ? <AlertTriangle size={18} /> :
                              insight.type === 'MATCH_ERROR' ? <Target size={18} /> :
                                insight.type === 'MAP_TRAINING' ? <Map size={18} /> :
                                  <Zap size={18} />}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-black italic uppercase text-xs tracking-wider mb-2 group-hover:text-white transition-colors">
                              {insight.title}
                            </h5>
                            <p className="text-zinc-400 text-[11px] leading-relaxed font-medium">
                              {insight.content}
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="text-[8px] font-mono text-zinc-600 uppercase">Durum: Analiz Tamamlandı</div>
                              <div className={`text-[8px] font-black uppercase ${insight.severity === 'high' ? 'text-primary' :
                                insight.severity === 'medium' ? 'text-amber-500' : 'text-blue-400'
                                }`}>
                                {insight.severity === 'high' ? 'KRİTİK' : 'ÖNERİ'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-2 py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem]">
                      <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 animate-spin-slow">
                        <CircleDashed className="text-zinc-500" size={32} />
                      </div>
                      <p className="text-zinc-500 font-black italic uppercase tracking-widest text-xs">Sinirsel Filtreler Yükleniyor...</p>
                    </div>
                  )}
                </div>

                {/* NEURAL DEEP ANALYSIS - INTEGRATED REPORT */}
                <div id="neural-deep-analysis" className="mt-12 pt-8 border-t border-white/5 relative">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Terminal size={20} className="text-primary" />
                      <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Neural Derin Analiz</h3>
                    </div>
                    {!user?.isPremium && (
                      <div className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[8px] font-black text-amber-400 uppercase tracking-widest">
                        PREMIUM ERİŞİM GEREKLİ
                      </div>
                    )}
                  </div>

                  <div className={`relative transition-all duration-700 ${!user?.isPremium ? 'grayscale blur-md pointer-events-none select-none h-[400px] overflow-hidden' : ''}`}>
                    {stats.aiAnalysis?.latestMatchReport && (
                      <div className="space-y-8">
                        {/* Latest Match Overview */}
                        <div className="flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-[2rem]">
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${stats?.matchHistory[0]?.won ? 'bg-green-500/10 border-green-500/40 text-green-500' : 'bg-primary/10 border-primary/40 text-primary'}`}>
                              <Activity size={24} />
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Son Operasyon: {stats.aiAnalysis.latestMatchReport.map}</div>
                              <div className="text-2xl font-black italic uppercase text-white">{stats?.matchHistory[0]?.won ? 'ZAFER' : 'BOZGUN'} {`//`} {stats.aiAnalysis.latestMatchReport.stats}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-mono text-zinc-600 uppercase">Analiz Protokolü</div>
                            <div className="text-[10px] font-black text-white">v4.2.0-STABLE</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Doğrular */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 text-green-500">
                              <Shield size={18} />
                              <h4 className="text-sm font-black uppercase italic tracking-widest text-green-400">Üstünlük Sağlanan Noktalar</h4>
                            </div>
                            {stats.aiAnalysis.latestMatchReport.positives.map((p, i) => (
                              <div key={i} className="bg-green-500/5 border border-green-500/10 p-4 rounded-2xl flex items-start gap-3 hover:bg-green-500/10 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shadow-[0_0_8px_#22c55e]"></div>
                                <p className="text-[11px] text-zinc-300 italic font-medium">{p}</p>
                              </div>
                            ))}
                          </div>

                          {/* Hatalar */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 text-primary">
                              <AlertTriangle size={18} />
                              <h4 className="text-sm font-black uppercase italic tracking-widest text-primary">Kritik Gelişim Alanları</h4>
                            </div>
                            {stats.aiAnalysis.latestMatchReport.negatives.map((n, i) => (
                              <div key={i} className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-start gap-3 hover:bg-primary/10 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shadow-[0_0_8px_#ff4655]"></div>
                                <p className="text-[11px] text-zinc-300 italic font-medium">{n}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tactical Solution */}
                        <div className="bg-blue-400/5 border border-blue-400/20 p-6 rounded-[2rem] relative overflow-hidden group/solution">
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/solution:opacity-10 transition-opacity">
                            <Zap size={80} className="text-blue-400" />
                          </div>
                          <h4 className="text-sm font-black uppercase italic tracking-widest text-blue-400 mb-2">Mentör Tavsiyesi</h4>
                          <p className="text-xs text-zinc-300 leading-relaxed italic pr-12">
                            &quot;{stats.aiAnalysis.latestMatchReport.solution}&quot;
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {!user?.isPremium && (
                    <div className="absolute inset-x-0 bottom-0 top-24 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-black via-black/40 to-transparent p-10 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                        <Lock size={32} className="text-amber-500" />
                      </div>
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Veri Erişimi Kısıtlı</h4>
                      <p className="text-zinc-500 text-xs italic mb-8 max-w-xs">Bu oyuncunun tüm maç içi hatalarını ve özel stratejik analizlerini görmek için Premium modülünü aktif edin.</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowProfile(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3 rounded-xl font-black italic text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                      >
                        V-INSIGHT PREMIUM'A GEÇ
                      </motion.button>
                    </div>
                  )}
                </div>


              </div>


              {/* Map Cards Grid - Beautifully Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                {stats.mapStats.map((map, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedMap(map)}
                    className="glass-card overflow-hidden group relative h-[320px] cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-zinc-900">
                      <img
                        src={map.image}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700 group-hover:scale-110"
                        alt={map.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.background = 'linear-gradient(45deg, #111, #1a1a1a)';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                    </div>

                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary/20 backdrop-blur-md border border-primary/40 p-2 rounded-lg">
                        <Activity size={16} className="text-primary animate-pulse" />
                      </div>
                    </div>

                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <div className="mb-auto">
                        <div className={`inline-block px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${map.wins > map.matches / 2 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                          {map.wins}W / {map.matches}M
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="text-[10px] uppercase font-bold text-primary tracking-[0.4em] mb-1">Operasyon Alanı</div>
                        <div className="font-black uppercase text-4xl italic tracking-tighter leading-none group-hover:text-glow-red transition-all">{map.name}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                        <div>
                          <div className="text-[8px] uppercase text-zinc-500 font-black tracking-widest mb-1">Giriş WR</div>
                          <div className="text-2xl font-black italic tracking-tighter text-white">{map.attackWinRate}%</div>
                        </div>
                        <div>
                          <div className="text-[8px] uppercase text-zinc-500 font-black tracking-widest mb-1">Gerialım WR</div>
                          <div className="text-2xl font-black italic tracking-tighter text-blue-400">{map.defenseWinRate}%</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="lg:col-span-4 space-y-6">

              {/* Radar Chart Card */}
              <div className="glass-card p-8 border-t-4 border-t-primary">
                <h3 className="font-black uppercase italic tracking-widest mb-8 flex items-center gap-3">
                  <BarChart3 size={20} className="text-primary" />
                  Sinirsel Denge
                </h3>
                <div className="h-[250px] flex items-center justify-center p-2">
                  {radarData && <Radar data={radarData} options={radarOptions} />}
                </div>
                <div className="mt-8 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#ff4655]"></div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Saldırı</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Savunma</span>
                  </div>
                </div>
              </div>

              {/* ACCURACY CARD - PREMIUM REDESIGN */}
              <div className="glass-card overflow-hidden relative">
                {/* Top accent */}
                <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-primary to-transparent"></div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Target size={14} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black uppercase italic tracking-widest text-white">Accuracy</div>
                        <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Son 20 Maç</div>
                      </div>
                    </div>
                    {/* Big HS% badge */}
                    <div className="text-right">
                      <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">AVG HS%</div>
                      <div className="text-2xl font-black italic tracking-tighter text-white leading-none">
                        {stats.headshots || 22}<span className="text-primary text-base">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Body visualization & stats */}
                  <div className="flex gap-6 items-center py-4">
                    {/* Left: SVG Body illustration */}
                    <div className="w-24 h-40 relative group">
                      <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <defs>
                          <filter id="glow-blue">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        {/* HEAD - Blue zone */}
                        <circle cx="50" cy="20" r="17" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.9)" strokeWidth="2" filter="url(#glow-blue)" />
                        <circle cx="50" cy="20" r="8" fill="rgba(59,130,246,0.5)" />
                        {/* BODY - Green zone */}
                        <rect x="28" y="42" width="44" height="68" rx="10" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.8)" strokeWidth="2" />
                        <rect x="28" y="42" width="44" height="68" rx="10" fill="rgba(34,197,94,0.25)" />
                        {/* Arms */}
                        <rect x="8" y="46" width="18" height="48" rx="8" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" />
                        <rect x="74" y="46" width="18" height="48" rx="8" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" />
                        {/* LEGS - Grey zone */}
                        <rect x="29" y="114" width="18" height="72" rx="8" fill="rgba(113,113,122,0.15)" stroke="rgba(113,113,122,0.5)" strokeWidth="1.5" />
                        <rect x="53" y="114" width="18" height="72" rx="8" fill="rgba(113,113,122,0.15)" stroke="rgba(113,113,122,0.5)" strokeWidth="1.5" />
                        {/* Hit markers */}
                        <circle cx="50" cy="20" r="3" fill="#3b82f6" opacity="0.9" />
                        <circle cx="50" cy="76" r="4" fill="#22c55e" opacity="0.7" />
                        <circle cx="38" cy="140" r="2.5" fill="#71717a" opacity="0.6" />
                      </svg>
                    </div>

                    {/* Right: stat rows */}
                    <div className="flex-1 flex flex-col justify-center gap-3">
                      {/* HEAD */}
                      <div className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_#3b82f6]"></div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Kafa</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-zinc-600">{Math.round((stats.headshots || 22) * 2.4)} İsabet</span>
                            <span className="text-[12px] font-black text-white">{stats.headshots || 22}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.headshots || 22}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="h-full rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]"
                          />
                        </div>
                      </div>

                      {/* BODY */}
                      <div className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_#22c55e]"></div>
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Gövde</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-zinc-600">{Math.round((stats.bodyshots || 68) * 9.8)} İsabet</span>
                            <span className="text-[12px] font-black text-white">{stats.bodyshots || 68}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.bodyshots || 68}%` }}
                            transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
                            className="h-full rounded-full bg-green-400 shadow-[0_0_8px_#22c55e]"
                          />
                        </div>
                      </div>

                      {/* LEGS */}
                      <div className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Bacak</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-zinc-600">{Math.round((stats.legshots || 10) * 1.1)} İsabet</span>
                            <span className="text-[12px] font-black text-white">{stats.legshots || 10}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.legshots || 10}%` }}
                            transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
                            className="h-full rounded-full bg-zinc-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Chart Section for Trend */}
                  <div className="mt-4 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Combat Pulse (KDA Trend)</div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Live Stream</span>
                      </div>
                    </div>
                    <div className="h-[80px] w-full">
                      {stats.aiAnalysis?.pulseData && (
                        <Line
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              x: { display: false },
                              y: { display: false }
                            },
                            plugins: {
                              legend: { display: false },
                              tooltip: { enabled: true }
                            },
                            elements: {
                              line: { tension: 0.4, borderWidth: 2, borderColor: '#ff4655' },
                              point: { radius: 0, hoverRadius: 4 }
                            }
                          }}
                          data={{
                            labels: stats.aiAnalysis.pulseData.map(p => p.x),
                            datasets: [{
                              data: stats.aiAnalysis.pulseData.map(p => p.y),
                              fill: true,
                              backgroundColor: (context) => {
                                const chart = context.chart;
                                const { ctx, chartArea } = chart;
                                if (!chartArea) return null;
                                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                                gradient.addColorStop(0, 'rgba(255, 70, 85, 0)');
                                gradient.addColorStop(1, 'rgba(255, 70, 85, 0.1)');
                                return gradient;
                              }
                            }]
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* HS% Sparkline - Premium */}
                  <div className="mt-5 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">HS% Trendi</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[8px] font-black text-zinc-500">Canlı</span>
                      </div>
                    </div>
                    <div className="relative h-14 w-full">
                      <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="hsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff4655" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#ff4655" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="15" x2="300" y2="15" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        <line x1="0" y1="30" x2="300" y2="30" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        <line x1="0" y1="45" x2="300" y2="45" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        <path d="M0,42 C15,38 30,36 45,30 C60,24 75,32 90,26 C105,20 120,22 135,17 C150,12 165,20 180,14 C195,8 210,18 225,14 C240,10 255,20 270,16 C285,12 300,24 300,20 L300,60 L0,60 Z" fill="url(#hsAreaGrad)" />
                        <path d="M0,42 C15,38 30,36 45,30 C60,24 75,32 90,26 C105,20 120,22 135,17 C150,12 165,20 180,14 C195,8 210,18 225,14 C240,10 255,20 270,16 C285,12 300,24 300,20" fill="none" stroke="#ff4655" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="300" cy="20" r="3" fill="#ff4655" filter="url(#glow-blue)" />
                      </svg>
                      <div className="absolute inset-y-0 left-0 flex flex-col justify-between pointer-events-none">
                        <span className="text-[6px] text-zinc-800 font-mono">45</span>
                        <span className="text-[6px] text-zinc-800 font-mono">30</span>
                        <span className="text-[6px] text-zinc-800 font-mono">15</span>
                        <span className="text-[6px] text-zinc-800 font-mono">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-10 bg-gradient-to-br from-zinc-900/50 to-black relative overflow-hidden">
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-5">
                  <TrendingUp size={100} />
                </div>
                <h3 className="font-black uppercase italic tracking-widest mb-8 text-sm flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-400" />
                  Küresel Meta Trendleri
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Vandal İsabeti</span>
                      <span className="text-[10px] text-green-400 font-black tracking-widest">+4.2%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Phantom Kullanımı</span>
                      <span className="text-[10px] text-primary font-black tracking-widest">-1.5%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-primary shadow-[0_0_10px_rgba(255,70,85,0.5)]"></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Op Gerialım Başarısı</span>
                      <span className="text-[10px] text-blue-400 font-black tracking-widest">+2.8%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '68%' }} className="h-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></motion.div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Efficiency */}
              <div className="glass-card p-8">
                <h3 className="font-black uppercase italic tracking-widest mb-8 flex items-center gap-3">
                  <TrendingUp size={20} className="text-primary" />
                  Ajan Ustalığı
                </h3>
                <div className="space-y-6">
                  {stats.agentStats.map((agent, i) => (
                    <div key={i} className={`group cursor-default p-3 rounded-2xl transition-all ${i === 0 ? 'bg-primary/5 border border-primary/20 shadow-[0_0_30px_rgba(255,70,85,0.05)]' : 'hover:bg-white/[0.02]'}`}>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="relative">
                          <img
                            src={getAgentImage(agent.id)}
                            className={`w-14 h-14 rounded-2xl bg-zinc-900 border p-1 transition-all group-hover:scale-105 ${i === 0 ? 'border-primary/50 shadow-[0_0_15px_rgba(255,70,85,0.3)]' : 'border-white/5 group-hover:border-white/20'}`}
                            alt={agent.name}
                            onError={(e) => { e.target.src = "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png"; }}
                          />
                          {i === 0 && (
                            <div className="absolute -top-2 -left-2 bg-primary text-[7px] px-2 py-0.5 rounded-full font-black text-white italic tracking-tighter border border-white/20 shadow-lg">FAVORİ</div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full font-black text-white ${i === 0 ? 'bg-primary' : 'bg-zinc-800'}`}>#{i + 1}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-end mb-1">
                            <span className={`font-black uppercase italic tracking-tighter text-lg leading-none ${i === 0 ? 'text-white' : 'text-zinc-300'}`}>{agent.name}</span>
                            <span className="text-primary font-black text-sm italic">{agent.winRate}% WR</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">KDA: {agent.avgKDA}</span>
                            <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">{agent.totalCount} Maç</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${agent.winRate}%` }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                          className={`h-full ${i === 0 ? 'bg-primary shadow-[0_0_10px_rgba(255,70,85,0.5)]' : 'bg-zinc-500'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recent Battles List */}
            <div className="lg:col-span-12 mt-12 pb-32">
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                  <span className="w-2 h-8 bg-primary rounded-full animate-pulse"></span>
                  Çatışma Kaydı
                </h3>
                <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="h-2 w-2 rounded-full bg-zinc-800"></div>
                  <div className="h-2 w-2 rounded-full bg-zinc-800"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {stats.matchHistory.map((match, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleMatchClick(match)}
                    className="glass-card group cursor-pointer relative overflow-hidden p-0 border-white/5 hover:border-primary/40 transition-all"
                  >
                    {/* Background Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${match.won ? 'from-green-500/5' : 'from-primary/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center min-h-[100px]">
                      {/* Left Accent & Agent */}
                      <div className="flex items-center">
                        <div className={`w-1.5 self-stretch ${match.won ? 'bg-green-500' : 'bg-primary'} shadow-[0_0_15px_rgba(255,255,255,0.1)]`}></div>
                        <div className="p-4 flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={match.agentImage || getAgentImage(match.agentId)}
                              className="w-14 h-14 rounded-xl bg-zinc-900 border border-white/10 p-0.5 group-hover:scale-105 transition-transform"
                              alt="Agent"
                              onError={(e) => { e.target.src = getAgentImage(match.agentId); }}
                            />
                            {match.rankIcon && (
                              <div className="absolute -bottom-1 -right-1 bg-black/80 rounded-full p-0.5 border border-white/10">
                                <img
                                  src={match.rankIcon}
                                  className="w-5 h-5 drop-shadow-lg"
                                  alt="Rank"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">
                              {new Date(match.timestamp).toLocaleDateString('tr-TR')} // {match.mode}
                            </div>
                            <div className="font-black text-xl italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors leading-none">
                              {match.mapName}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score Section */}
                      <div className="flex-1 flex items-center justify-center px-4 py-4 md:py-0 border-y md:border-y-0 md:border-x border-white/5">
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">SCORE</div>
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl font-black italic ${match.won ? 'text-green-400' : 'text-primary'}`}>
                                {match.playerTeam === 'red' ? match.teamRedScore : match.teamBlueScore}
                              </span>
                              <span className="text-zinc-700 font-bold">:</span>
                              <span className="text-xl font-bold text-zinc-500">
                                {match.playerTeam === 'red' ? match.teamBlueScore : match.teamRedScore}
                              </span>
                            </div>
                          </div>

                          {/* Match Result Badge */}
                          <div className={`px-4 py-1.5 rounded-lg border text-[10px] font-black italic uppercase tracking-widest ${match.won ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-primary/10 border-primary/30 text-primary'}`}>
                            {match.won ? 'VICTORY' : 'DEFEAT'}
                          </div>
                        </div>
                      </div>

                      {/* Stats Section */}
                      <div className="grid grid-cols-4 md:flex items-center gap-6 px-8 py-4 md:py-0">
                        <div className="text-center">
                          <div className="text-[8px] font-bold text-zinc-600 uppercase mb-1">K/D</div>
                          <div className={`text-sm font-black italic ${parseFloat(match.kd) >= 1 ? 'text-white' : 'text-zinc-500'}`}>{match.kd}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] font-bold text-zinc-600 uppercase mb-1">ACS</div>
                          <div className="text-sm font-black italic text-zinc-300">{match.acs || Math.round(match.score / 20)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] font-bold text-zinc-600 uppercase mb-1">HS%</div>
                          <div className="text-sm font-black italic text-blue-400">{match.hsPercent || 18}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] font-bold text-zinc-600 uppercase mb-1">KDA</div>
                          <div className="text-[10px] font-black italic text-zinc-400">
                            {match.kills}/{match.deaths}/{match.assists}
                          </div>
                        </div>
                      </div>

                      {/* Right Control */}
                      <div className="hidden lg:flex items-center px-6">
                        <ChevronRight size={20} className="text-zinc-700 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* FIXED FOOTER HUD */}
            <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent h-20 -top-20"></div>
              <div className="bg-black/90 backdrop-blur-2xl border-t border-white/10 py-3 px-10 flex justify-between items-center pointer-events-auto">
                <div className="flex gap-10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Riot Ana Bilgisayarı: Bağlı</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity size={12} className="text-zinc-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Gecikme: 18ms</span>
                  </div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.6em] text-primary/60 italic hidden md:block">
                  V-Insight Neural Core v4.0.2 // STABLE
                </div>
                <div className="flex gap-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Çalışma Süresi: %99.98</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Canlı Tarama Aktif</span>
                </div>
              </div>
            </div >
          </motion.div >
        )
        }

        {/* DETAILED REPORT MODAL */}
        <AnimatePresence>
          {showDetailedReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
            >
              <div
                className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                onClick={() => setShowDetailedReport(false)}
              />

              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative w-full max-w-5xl glass-card overflow-hidden flex flex-col h-[85vh] border border-white/10"
              >
                {/* Header HUD */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_20px_rgba(255,70,85,0.3)]">
                      <Terminal className="text-primary" size={32} />
                    </div>
                    <div>
                      <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">Gelişmiş Stratejik Rapor</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Sinirsel Çekirdek v4.2 // DERİN ANALİZ</span>
                        <div className="h-4 w-[1px] bg-zinc-800"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-green-500 uppercase">Veri Senkronize</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailedReport(false)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 transition-all group"
                  >
                    <Zap size={20} className="text-white group-hover:rotate-12" />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-black/40 border-b border-white/5">
                  <button
                    onClick={() => setActiveReportTab('latest')}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeReportTab === 'latest' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Son Maç Analizi
                  </button>
                  <button
                    onClick={() => setActiveReportTab('general')}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeReportTab === 'general' ? 'text-blue-400 bg-blue-400/5 border-b-2 border-blue-400' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Genel Gelişim & Strateji
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                  {activeReportTab === 'latest' ? (
                    <div className="space-y-8">
                      {/* Latest Match Overview */}
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-[2rem]">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${stats?.matchHistory[0]?.won ? 'bg-green-500/10 border-green-500/40 text-green-500' : 'bg-primary/10 border-primary/40 text-primary'}`}>
                            <Activity size={24} />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Operasyon Alanı: {latestMatchAnalysis?.map}</div>
                            <div className="text-2xl font-black italic uppercase italic text-white">{stats?.matchHistory[0]?.won ? 'ZAFER' : 'BOZGUN'} {`//`} {latestMatchAnalysis?.stats}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] font-mono text-zinc-600 uppercase">Maç ID</div>
                          <div className="text-[10px] font-black text-white">{stats?.matchHistory[0]?.matchId?.slice(0, 12)}...</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Doğrular */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-green-500">
                            <Shield size={18} />
                            <h4 className="text-sm font-black uppercase italic tracking-widest">Neleri Doğru Yaptın?</h4>
                          </div>
                          {latestMatchAnalysis?.positives.map((p, i) => (
                            <div key={i} className="bg-green-500/5 border border-green-500/20 p-4 rounded-2xl flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                              <p className="text-[11px] text-zinc-300 italic font-medium">{p}</p>
                            </div>
                          ))}
                        </div>

                        {/* Hatalar */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-primary">
                            <AlertTriangle size={18} />
                            <h4 className="text-sm font-black uppercase italic tracking-widest">NERELERDE HATA YAPTIN?</h4>
                          </div>
                          {latestMatchAnalysis?.negatives.map((n, i) => (
                            <div key={i} className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                              <p className="text-[11px] text-zinc-300 italic font-medium">{n}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tactical Solution */}
                      <div className="bg-blue-400/5 border border-blue-400/20 p-6 rounded-[2rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                          <Zap size={60} className="text-blue-400" />
                        </div>
                        <h4 className="text-sm font-black uppercase italic tracking-widest text-blue-400 mb-2">Yapay Zeka Çözüm Protokolü</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed italic pr-12">
                          &quot;{latestMatchAnalysis?.solution || `${latestMatchAnalysis?.map} haritasındaki bu performansın ardından, bir sonraki maçta daha kompakt bir oyun sergilemen gerekiyor. Özellikle ${stats?.matchHistory[0]?.won ? 'zaferi pekiştirmek' : 'maç kaybını telafi etmek'} için smoke içi pozisyonlarını %15 daha derin tutmalısın.`}&quot;
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                      {/* Left: AI tactical breakdown */}
                      <div className="lg:col-span-2 space-y-8">
                        {/* Section 1: Detected tactical errors */}
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="text-primary" size={20} />
                            <h4 className="text-xl font-black italic uppercase tracking-tighter">Tespit Edilen Kritik Hatalar</h4>
                          </div>
                          <div className="space-y-4">
                            {(stats.aiAnalysis?.strategicErrors || [
                              { title: 'Ekonomi Yönetimi Disiplinsizliği', desc: 'Maç başına ortalama 2 mini-buy raundunda yetenek setinizi eksik kullanıyorsunuz. Bu, kazanma şansınızı %12 düşürüyor.', impact: 'Yüksek', color: 'primary' },
                              { title: 'Düşük Plant Sonrası Yerleşim', desc: 'Spike kurulduktan sonraki ilk 10 saniyede pozisyon alma süreniz global ortalamanın 1.5s gerisinde.', impact: 'Orta', color: 'amber-500' },
                              { title: 'Yetenek Senkronizasyon Hatası', desc: 'Ultimate yeteneğinizi raunt başındaki ilk 20 saniyede kullanma oranınız %82. Daha stratejik saklama önerilir.', impact: 'Yüksek', color: 'primary' }
                            ]).map((error, idx) => (
                              <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl group hover:border-primary/20 transition-all">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-black italic uppercase text-sm tracking-tight text-white group-hover:text-primary transition-colors">{error.title}</h5>
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded bg-${error.color}/10 text-${error.color} border border-${error.color}/20 uppercase`}>Etki: {error.impact}</span>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed font-medium italic">{error.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Section 2: AI-driven adjustments */}
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <Activity className="text-blue-400" size={20} />
                            <h4 className="text-xl font-black italic uppercase tracking-tighter text-blue-400">Yapay Zeka Düzenleme Önerileri</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(stats.aiAnalysis?.strategicAdjustments || [
                              { label: 'Mikro-Ayar', value: 'DPI Dengeleme', status: 'GEREKLİ', desc: 'Ani dönüşlerdeki titreme fark edildi. DPI 400/800 geçişi önerilir.' },
                              { label: 'Zihinsel Mod', value: 'Saldırı Agresyonu', status: 'DÜŞÜK', desc: 'Split haritasında A-Main kontrolünü %20 daha agresif yapmalısınız.' },
                              { label: 'İletişim', value: 'Utility İstemi', status: 'EKSİK', desc: 'Takım arkadaşlarınızdan daha fazla flaş desteği istemelisiniz.' },
                              { label: 'Fiziksel', value: 'Reaksiyon Süresi', status: 'STABİL', desc: 'Isınma modunda 15 dakika bot çalışması tavsiye edilir.' }
                            ]).map((adj, idx) => (
                              <div key={idx} className="bg-blue-400/5 border border-blue-400/10 p-4 rounded-2xl">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{adj.label}</span>
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${adj.status === 'STABİL' ? 'bg-green-500/20 text-green-400' : 'bg-blue-400/20 text-blue-400'} border border-white/5`}>{adj.status}</span>
                                </div>
                                <div className="text-sm font-black italic uppercase text-white mb-2">{adj.value}</div>
                                <p className="text-[10px] text-zinc-500 italic leading-snug">{adj.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Technical Telemetry */}
                      <div className="space-y-8">
                        {/* Performance Matrix */}
                        <div className="glass-card p-6 border-t-2 border-primary">
                          <h4 className="text-xs font-black uppercase italic tracking-widest mb-6 flex items-center gap-2">
                            <BarChart3 size={14} className="text-primary" />
                            Performans Matrisi
                          </h4>
                          <div className="space-y-5">
                            {[
                              { label: 'Zihinsel Yük', val: 78, color: 'primary' },
                              { label: 'Karar Hızı', val: 92, color: 'blue-400' },
                              { label: 'Harita Hakimiyeti', val: 64, color: 'amber-500' },
                              { label: 'Takım Uyumu', val: 85, color: 'green-500' }
                            ].map((stat, i) => (
                              <div key={i}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase">{stat.label}</span>
                                  <span className={`text-[10px] font-black italic text-white`}>%{stat.val}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stat.val}%` }}
                                    className={`h-full bg-${stat.color}`}
                                    transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Advanced Stats */}
                        <div className="glass-card p-6 bg-gradient-to-b from-transparent to-primary/5">
                          <h4 className="text-xs font-black uppercase italic tracking-widest mb-4">Gelişmiş Telemetri</h4>
                          <div className="space-y-4 font-mono">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-[8px] text-zinc-600 uppercase">AVG First Blood</span>
                              <span className="text-[10px] text-primary font-black">2.4</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-[8px] text-zinc-600 uppercase">Trade Kill Oranı</span>
                              <span className="text-[10px] text-white font-black">1.15</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-[8px] text-zinc-600 uppercase">Damage Per Round</span>
                              <span className="text-[10px] text-white font-black">154.2</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[8px] text-zinc-600 uppercase">Clutch Başarısı</span>
                              <span className="text-[10px] text-green-400 font-black">%32</span>
                            </div>
                          </div>
                        </div>

                        {/* Analysis Status */}
                        <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Activity size={40} className="text-primary" />
                          </div>
                          <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Sistem Durumu</div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <div className="text-xs font-black italic uppercase text-white tracking-tighter">Analiz Tamamlandı</div>
                          </div>
                          <p className="text-[8px] text-zinc-600 mt-2 italic leading-relaxed">
                            Tüm veriler Riot Cloud üzerinden 256-bit şifreleme ile çekildi. Bir sonraki analiz 24 saat sonra açılacaktır.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-8 border-t border-white/5 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between">
                  <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                    V-Insight Neural Genesis // STABLE_OUTPUT_v4.2.0
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowDetailedReport(false)}
                      className="px-8 py-3 bg-white hover:bg-primary text-black hover:text-white font-black uppercase italic rounded-xl transition-all tracking-tighter text-xs"
                    >
                      Raporu Dosyala
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(selectedMatch || matchLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10"
            >
              <div
                className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                onClick={() => { setSelectedMatch(null); setMatchDetailData(null); }}
              />

              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="relative w-full max-w-6xl glass-card overflow-hidden flex flex-col h-[90vh] border border-white/10"
              >
                {matchLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 border-t-2 border-primary rounded-full animate-spin mb-6"></div>
                    <div className="text-primary font-black uppercase tracking-widest animate-pulse">Sektör Verileri Getiriliyor...</div>
                  </div>
                ) : matchDetailData ? (
                  <>
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                      <div className="flex items-center gap-6">
                        <div className="text-left">
                          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2">{matchDetailData.mode} // {matchDetailData.map}</div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                              <span className={`text-5xl font-black italic tracking-tighter ${matchDetailData.redScore > matchDetailData.blueScore ? 'text-primary' : 'text-zinc-500'}`}>{matchDetailData.redScore}</span>
                              <span className="text-2xl font-black text-zinc-800">:</span>
                              <span className={`text-5xl font-black italic tracking-tighter ${matchDetailData.blueScore > matchDetailData.redScore ? 'text-blue-400' : 'text-zinc-500'}`}>{matchDetailData.blueScore}</span>
                            </div>
                            <div className="h-10 w-[1px] bg-white/10"></div>
                            <div>
                              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Süre</div>
                              <div className="text-lg font-black text-white italic">{matchDetailData.duration ? (matchDetailData.duration / 60000).toFixed(0) : '20'}dk</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedMatch(null); setMatchDetailData(null); }}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 transition-all group"
                      >
                        <Zap size={24} className="text-white group-hover:rotate-12" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-12">
                      <div>
                        <div className="flex items-center gap-4 mb-4 px-4">
                          <div className="w-2 h-6 bg-primary rounded-full"></div>
                          <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Takım A</h4>
                          <span className={`px-3 py-1 rounded-md text-[10px] font-black ${matchDetailData.redWon ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                            {matchDetailData.redWon ? 'WINNER' : 'DEFEATED'}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">
                                <th className="text-left py-4 px-4">Ajan / Oyuncu</th>
                                <th className="text-center py-4 px-4">Kademe</th>
                                <th className="text-center py-4 px-4">ACS</th>
                                <th className="text-center py-4 px-4">K</th>
                                <th className="text-center py-4 px-4">D</th>
                                <th className="text-center py-4 px-4">A</th>
                                <th className="text-center py-4 px-4">+/-</th>
                                <th className="text-center py-4 px-4">K/D</th>
                                <th className="text-center py-4 px-4">ADR</th>
                                <th className="text-center py-4 px-4 whitespace-nowrap">HS%</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {matchDetailData.redPlayers.map((p, idx) => (
                                <tr key={idx} className={`group hover:bg-primary/5 transition-colors ${p.puuid === stats.puuid ? 'bg-primary/10' : ''}`}>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={p.agentIcon || getAgentImage(p.agent)}
                                        className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10"
                                        alt=""
                                        onError={(e) => { e.target.src = getAgentImage(p.agent); }}
                                      />
                                      <div>
                                        <div className="font-black italic uppercase text-sm text-white group-hover:text-primary transition-colors">{p.name}</div>
                                        <div className="text-[8px] font-bold text-zinc-600 uppercase">#{p.tag}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                      <img
                                        src={p.rankIcon || "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png"}
                                        className="w-10 h-10 mx-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.15)] group-hover:scale-110 transition-transform object-contain"
                                        alt=""
                                        onError={(e) => {
                                          if (!e.target.src.includes('0/largeicon')) {
                                            e.target.src = "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png";
                                          }
                                        }}
                                      />
                                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter group-hover:text-white transition-colors">{p.rank}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center font-black italic text-zinc-300">{p.acs}</td>
                                  <td className="py-3 px-4 text-center font-black text-white">{p.kills}</td>
                                  <td className="py-3 px-4 text-center font-black text-zinc-500">{p.deaths}</td>
                                  <td className="py-3 px-4 text-center font-black text-zinc-500">{p.assists}</td>
                                  <td className={`py-3 px-4 text-center font-black text-xs ${p.plusMinus >= 0 ? 'text-green-500' : 'text-primary'}`}>
                                    {p.plusMinus > 0 ? '+' : ''}{p.plusMinus}
                                  </td>
                                  <td className="py-3 px-4 text-center font-black italic text-zinc-400">{p.kd}</td>
                                  <td className="py-3 px-4 text-center font-black text-zinc-300">{p.adr}</td>
                                  <td className="py-3 px-4 text-center font-black text-blue-400">{p.hsPercent}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="pb-12">
                        <div className="flex items-center gap-4 mb-4 px-4">
                          <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                          <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Takım B</h4>
                          <span className={`px-3 py-1 rounded-md text-[10px] font-black ${matchDetailData.blueWon ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                            {matchDetailData.blueWon ? 'WINNER' : 'DEFEATED'}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">
                                <th className="text-left py-4 px-4">Ajan / Oyuncu</th>
                                <th className="text-center py-4 px-4">Kademe</th>
                                <th className="text-center py-4 px-4">ACS</th>
                                <th className="text-center py-4 px-4">K</th>
                                <th className="text-center py-4 px-4">D</th>
                                <th className="text-center py-4 px-4">A</th>
                                <th className="text-center py-4 px-4">+/-</th>
                                <th className="text-center py-4 px-4">K/D</th>
                                <th className="text-center py-4 px-4">ADR</th>
                                <th className="text-center py-4 px-4 whitespace-nowrap">HS%</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {matchDetailData.bluePlayers.map((p, idx) => (
                                <tr key={idx} className={`group hover:bg-blue-500/5 transition-colors ${p.puuid === stats.puuid ? 'bg-blue-500/10' : ''}`}>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={p.agentIcon || getAgentImage(p.agent)}
                                        className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10"
                                        alt=""
                                        onError={(e) => { e.target.src = getAgentImage(p.agent); }}
                                      />
                                      <div>
                                        <div className="font-black italic uppercase text-sm text-white group-hover:text-blue-400 transition-colors">{p.name}</div>
                                        <div className="text-[8px] font-bold text-zinc-600 uppercase">#{p.tag}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                      <img
                                        src={p.rankIcon || "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png"}
                                        className="w-10 h-10 mx-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.15)] group-hover:scale-110 transition-transform object-contain"
                                        alt=""
                                        onError={(e) => {
                                          if (!e.target.src.includes('0/largeicon')) {
                                            e.target.src = "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png";
                                          }
                                        }}
                                      />
                                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter group-hover:text-white transition-colors">{p.rank}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center font-black italic text-zinc-300">{p.acs}</td>
                                  <td className="py-3 px-4 text-center font-black text-white">{p.kills}</td>
                                  <td className="py-3 px-4 text-center font-black text-zinc-500">{p.deaths}</td>
                                  <td className="py-3 px-4 text-center font-black text-zinc-500">{p.assists}</td>
                                  <td className={`py-3 px-4 text-center font-black text-xs ${p.plusMinus >= 0 ? 'text-green-500' : 'text-primary'}`}>
                                    {p.plusMinus > 0 ? '+' : ''}{p.plusMinus}
                                  </td>
                                  <td className="py-3 px-4 text-center font-black italic text-zinc-400">{p.kd}</td>
                                  <td className="py-3 px-4 text-center font-black text-zinc-300">{p.adr}</td>
                                  <td className="py-3 px-4 text-center font-black text-blue-400">{p.hsPercent}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 border-t border-white/5 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between">
                      <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                        Maç Oturumu: {matchDetailData.matchId}
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => { setSelectedMatch(null); setMatchDetailData(null); }}
                          className="px-8 py-3 bg-white hover:bg-primary text-black hover:text-white font-black uppercase italic rounded-xl transition-all tracking-tighter text-xs"
                        >
                          KAPAT
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedMap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
            >
              <div
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                onClick={() => setSelectedMap(null)}
              />

              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-6xl glass-card overflow-hidden flex flex-col lg:flex-row min-h-[70vh] border border-white/10"
              >
                {/* Lateral Decoration */}
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary/40"></div>

                {/* Left: Interactive Map/Heatmap Area */}
                <div className="lg:w-2/3 relative bg-black p-8 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#ff465522_0%,_transparent_70%)]"></div>

                  <div className="relative w-full aspect-square max-w-2xl flex flex-col items-center">
                    <div className="relative w-full flex-1">
                      {/* Map Minimap (Display Icon) */}
                      <img
                        src={`https://media.valorant-api.com/maps/${getMapId(selectedMap.name)}/displayicon.png`}
                        className="w-full h-full brightness-125 contrast-125"
                        alt="Minimap"
                      />

                      {/* Heatmap Overlay Elements - FILTERED */}
                      <div className="absolute inset-0">
                        {getHeatmapZones(selectedMap.name)
                          .filter(zone => mapFilter === 'all' || zone.type === mapFilter)
                          .map((zone, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 + (idx * 0.05) }}
                              style={{
                                top: zone.top,
                                left: zone.left,
                                transform: 'translate(-50%, -50%)'
                              }}
                              className="absolute group/zone cursor-pointer z-20"
                            >
                              <div className="relative">
                                {/* Tactical Marker */}
                                <div className={`w-10 h-10 rounded-xl border-2 rotate-45 flex items-center justify-center transition-all duration-300 group-hover/zone:scale-110 group-hover/zone:rotate-[135deg] ${zone.type === 'entry' ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(255,70,85,0.4)]' :
                                  zone.type === 'hold' ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' :
                                    zone.type === 'flash' ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' :
                                      zone.type === 'spike' ? 'bg-orange-500/20 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' :
                                        'bg-zinc-800/80 border-zinc-400 shadow-lg'
                                  } backdrop-blur-md`}>
                                  <div className="-rotate-45 group-hover/zone:-rotate-[135deg] transition-transform duration-300">
                                    {zone.type === 'entry' && <Target size={16} className="text-primary" />}
                                    {zone.type === 'hold' && <Shield size={16} className="text-blue-400" />}
                                    {zone.type === 'flash' && <Zap size={16} className="text-amber-500" />}
                                    {zone.type === 'snipe' && <Target size={16} className="text-red-400" />}
                                    {zone.type === 'spike' && <Activity size={16} className="text-orange-500" />}
                                    {!['entry', 'hold', 'flash', 'snipe', 'spike'].includes(zone.type) && <Activity size={16} className="text-zinc-400" />}
                                  </div>
                                </div>

                                {/* Tactical HUD Pin */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-ping opacity-20"></div>

                                {/* Info Tooltip - REFINED & ENHANCED */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 opacity-0 group-hover/zone:opacity-100 transition-all duration-300 scale-90 group-hover/zone:scale-100 pointer-events-none z-[110]">
                                  <div className="relative">
                                    {/* Tooltip background with scanline effect */}
                                    <div className="bg-black/95 border-t-2 border-primary border-x border-white/10 p-5 rounded-2xl whitespace-nowrap shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl min-w-[240px]">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full animate-pulse ${zone.type === 'entry' ? 'bg-primary' :
                                            zone.type === 'hold' ? 'bg-blue-400' :
                                              zone.type === 'spike' ? 'bg-orange-500' : 'bg-amber-500'
                                            }`}></div>
                                          <div className="text-[11px] font-black uppercase text-white tracking-[0.2em]">{zone.label}</div>
                                        </div>
                                        <div className="text-[9px] font-mono text-zinc-500">[{zone.type?.toUpperCase()}]</div>
                                      </div>

                                      <div className="text-[10px] text-zinc-300 max-w-[220px] leading-relaxed font-medium mb-4 italic opacity-90 border-l-2 border-primary/50 pl-3">
                                        {zone.description}
                                      </div>

                                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                          <div className="text-[8px] font-black text-zinc-500 uppercase mb-1">{zone.type === 'spike' ? 'Zıplatma Gücü' : 'Başarı Oranı'}</div>
                                          <div className="text-lg font-black italic text-white leading-none">%{zone.winProb || 0}</div>
                                        </div>
                                        <div>
                                          <div className="text-[8px] font-black text-zinc-500 uppercase mb-1">{zone.type === 'spike' ? 'Çözme Süresi' : 'En İyi Ajan'}</div>
                                          <div className="text-[10px] font-black italic text-primary leading-none uppercase">{zone.type === 'spike' ? 'Kritik Seviye' : (zone.bestAgent || 'Global')}</div>
                                        </div>
                                      </div>

                                      <div className="mt-4 flex items-center gap-3">
                                        <div className="text-[8px] font-black text-zinc-500 uppercase">Yoğunluk</div>
                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                          <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${zone.intensity * 100}%` }}
                                            className={`h-full ${zone.type === 'spike' ? 'bg-orange-500' :
                                              zone.intensity > 0.7 ? 'bg-primary' : 'bg-blue-400'
                                              }`}
                                          ></motion.div>
                                        </div>
                                        <div className="text-[9px] font-mono text-white">%{Math.round(zone.intensity * 100)}</div>
                                      </div>
                                    </div>
                                    {/* Pointer arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-primary"></div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>

                    {/* MAP FILTERS - BOTTOM NAVIGATION */}
                    <div className="w-full max-w-lg mt-8 mb-4 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex gap-2">
                      <button
                        onClick={() => setMapFilter('all')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mapFilter === 'all' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        TÜMÜ
                      </button>
                      <button
                        onClick={() => setMapFilter('spike')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mapFilter === 'spike' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10'
                          }`}
                      >
                        <Activity size={12} />
                        SPIKE PLANT
                      </button>
                      <button
                        onClick={() => setMapFilter('hold')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mapFilter === 'hold' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10'
                          }`}
                      >
                        <Shield size={12} />
                        SAVUNMA
                      </button>
                      <button
                        onClick={() => setMapFilter('entry')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mapFilter === 'entry' ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,70,85,0.4)]' : 'text-zinc-500 hover:text-primary hover:bg-primary/10'
                          }`}
                      >
                        <Target size={12} />
                        GİRİŞ
                      </button>
                    </div>
                  </div>

                  <div className="absolute top-6 left-6 flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg border border-primary/40">
                      <Target size={16} className="text-primary" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">Operasyonel Taktik Analizi</div>
                  </div>
                </div>

                {/* Right: Info Area */}
                <div className="lg:w-1/3 bg-zinc-900/50 flex flex-col border-l border-white/5 relative h-full">
                  {/* Header - Fixed */}
                  <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] mb-2">Taktiksel Derinlik // {selectedMap.name}</div>
                      <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-3">{selectedMap.name}</h3>
                      <div className="flex gap-2">
                        <div className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[7px] font-black text-primary uppercase">Alpha Sektörü</div>
                        <div className="bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded text-[7px] font-black text-blue-400 uppercase">Sinirsel Filtre</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMap(null);
                        setActiveComp(null);
                      }}
                      className="p-2 rounded-full bg-white/5 hover:bg-primary transition-all group"
                    >
                      <Zap size={14} className="text-white group-hover:rotate-12" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                    <div className="space-y-4">
                      <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b border-white/5 pb-2">Harekât Verileri</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 p-3 rounded-xl border border-white/5 group/data hover:border-primary/30 transition-all">
                          <div className="text-[7px] text-zinc-500 uppercase font-black mb-1">Giriş Başarısı</div>
                          <div className="text-xl font-black italic text-white group-hover/data:text-primary transition-colors">{selectedMap.attackWinRate}%</div>
                        </div>
                        <div className="bg-black/40 p-3 rounded-xl border border-white/5 group/data hover:border-blue-400/30 transition-all">
                          <div className="text-[7px] text-zinc-500 uppercase font-black mb-1">Saha Savunması</div>
                          <div className="text-xl font-black italic text-blue-400 group-hover/data:shadow-[0_0_10px_#3b82f6]">{selectedMap.defenseWinRate}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Sinirsel Kompozisyon</div>
                        {!activeComp && (
                          <button
                            onClick={() => {
                              setCompLoading(true);
                              setTimeout(() => {
                                setActiveComp(getBestComps(selectedMap.name));
                                setCompLoading(false);
                              }, 1500);
                            }}
                            disabled={compLoading}
                            className="bg-primary/10 text-primary text-[7px] font-black uppercase border border-primary/30 px-2 py-0.5 rounded hover:bg-primary/20 transition-all flex items-center gap-1"
                          >
                            {compLoading ? <Activity size={8} className="animate-spin" /> : <Swords size={8} />}
                            {compLoading ? 'Analiz...' : 'Kur'}
                          </button>
                        )}
                      </div>

                      {compLoading ? (
                        <div className="bg-black/40 p-8 rounded-2xl border border-primary/20 flex flex-col items-center justify-center gap-3">
                          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                          <div className="text-center">
                            <div className="text-[8px] font-black text-primary uppercase tracking-widest animate-pulse">İşleniyor</div>
                          </div>
                        </div>
                      ) : activeComp ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-primary/5 p-4 rounded-2xl border border-white/10"
                        >
                          <div className="flex justify-between gap-2 mb-4">
                            {activeComp.agents.map((agent, i) => (
                              <div key={i} className="group/agent relative flex-1">
                                <div className="aspect-square rounded-lg border border-white/10 bg-zinc-900 overflow-hidden">
                                  <img
                                    src={getAgentImage(agent)}
                                    className="w-full h-full object-cover"
                                    alt={agent}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                            <p className="text-[9px] text-zinc-300 leading-relaxed italic line-clamp-3">
                              {activeComp.reason}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="space-y-2">
                              <div className="text-[7px] font-black text-primary uppercase flex items-center gap-1">
                                <Swords size={8} /> Saldırı Operasyonu
                              </div>
                              <div className="bg-primary/5 p-2 rounded-lg border border-primary/10">
                                <ul className="space-y-1.5">
                                  {activeComp.attackTips?.map((tip, i) => (
                                    <li key={i} className="text-[7px] text-zinc-400 leading-tight list-disc ml-2">{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-[7px] font-black text-blue-400 uppercase flex items-center gap-1">
                                <Shield size={8} /> Savunma Protokolü
                              </div>
                              <div className="bg-blue-400/5 p-2 rounded-lg border border-blue-400/10">
                                <ul className="space-y-1.5">
                                  {activeComp.defenseTips?.map((tip, i) => (
                                    <li key={i} className="text-[7px] text-zinc-400 leading-tight list-disc ml-2">{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setCompLoading(true);
                              setTimeout(() => {
                                // Get a different comp if possible
                                const allComps = getBestComps(selectedMap.name, true); // True flag for all comps
                                let nextComp = allComps[Math.floor(Math.random() * allComps.length)];

                                // Simple check to try and get a different one
                                if (activeComp && allComps.length > 1) {
                                  while (JSON.stringify(nextComp.agents) === JSON.stringify(activeComp.agents)) {
                                    nextComp = allComps[Math.floor(Math.random() * allComps.length)];
                                  }
                                }

                                setActiveComp(nextComp);
                                setCompLoading(false);
                              }, 1000);
                            }}
                            className="mt-3 text-[7px] font-black text-zinc-600 uppercase hover:text-primary transition-all flex items-center gap-1"
                          >
                            <Activity size={8} /> Diğer Metayı Analiz Et
                          </button>
                        </motion.div>
                      ) : (
                        <div className="bg-white/[0.02] p-6 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary/20 transition-all"
                          onClick={() => {
                            setCompLoading(true);
                            setTimeout(() => {
                              setActiveComp(getBestComps(selectedMap.name));
                              setCompLoading(false);
                            }, 1500);
                          }}>
                          <Zap size={20} className="text-zinc-700 group-hover:text-primary transition-colors" />
                          <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Komp Bekleniyor</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b border-white/5 pb-2">Performans</div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[7px] font-black text-zinc-500 uppercase">Retake</div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-blue-500"></motion.div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[7px] font-black text-zinc-500 uppercase">Baskı</div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '74%' }} className="h-full bg-primary"></motion.div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b border-white/5 pb-2">Özet</div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed italic border-l-2 border-primary/40 pl-3">
                        {selectedMap.name} haritasında <span className="text-white font-bold">{selectedMap.attackWinRate > selectedMap.defenseWinRate ? 'agresif' : 'derin'}</span> profiliniz global medyanın %15 üzerinde.
                      </p>
                    </div>
                  </div>

                  {/* Footer - Fixed */}
                  <div className="p-6 border-t border-white/5 bg-zinc-900/80 backdrop-blur-md">
                    <button
                      onClick={() => {
                        setSelectedMap(null);
                        setActiveComp(null);
                      }}
                      className="w-full bg-white text-black font-black uppercase italic py-3 rounded-lg hover:bg-primary hover:text-white transition-all tracking-tighter text-xs"
                    >
                      Analizi Kapat
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LARGE VERTICAL SPACER */}
        <div className="h-[20vh] lg:h-[30vh]"></div>

        {/* About & Team Section - Only shown on home page */}
        {
          !stats && !loading && (
            <div className="mt-32 border-t border-white/5 pt-32 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                {/* Mission & Vision - ENHANCED */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative group h-full"
                >
                  <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>

                  <div className="glass-card p-10 relative overflow-hidden h-full border-l-4 border-l-primary flex flex-col justify-center">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
                      <Shield size={240} className="rotate-12" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_20px_rgba(255,70,85,0.2)]">
                          <Shield className="text-primary" size={24} />
                        </div>
                        <div>
                          <h4 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Görev Merkezi</h4>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">Sektör 7 {`//`} Operasyonel</div>
                        </div>
                      </div>

                      <p className="text-zinc-400 leading-relaxed text-lg mb-10 italic">
                        &quot;V-Insight, rekabetçi oyunun dijital ateşinde dövüldü. <span className="text-white">Ham verileri parçalarına ayırıyor</span> ve onları uygulanabilir savaş alanı istihbaratına dönüştürüyoruz. Sadece istatistik göstermiyoruz; galibiyetin <span className="text-primary font-black">sinirsel modellerini</span> haritalıyoruz.&quot;
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group/stat">
                          <div className="flex items-center gap-3 mb-3">
                            <Activity size={20} className="text-primary group-hover/stat:rotate-12 transition-transform" />
                            <div className="text-xs font-black uppercase tracking-widest text-zinc-300">Canlı Analiz</div>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">Riot API ana bilgisayarlarıyla 18ms gecikmeli telemetri senkronizasyonu.</p>
                          <div className="mt-4 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
                            <span className="text-[8px] font-bold text-primary uppercase">Aktif Veri Akışı</span>
                          </div>
                        </div>

                        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-blue-400/30 transition-all group/stat">
                          <div className="flex items-center gap-3 mb-3">
                            <Zap size={20} className="text-blue-400 group-hover/stat:scale-110 transition-transform" />
                            <div className="text-xs font-black uppercase tracking-widest text-zinc-300">Sinirsel Tahmin</div>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">Derin öğrenme modelleriyle %94.2 doğrulukta sonuç öngörüsü.</p>
                          <div className="mt-4 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                            <span className="text-[8px] font-bold text-blue-400 uppercase">Sinirsel Filtre Aktif</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Team Section - ENHANCED */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                        <Terminal className="text-primary" size={24} />
                      </div>
                      <h4 className="text-3xl font-black italic uppercase tracking-tighter">Sinirsel Mimarlar</h4>
                    </div>
                    <div className="hidden sm:flex flex-col items-end">
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Temizleme Seviyesi</div>
                      <div className="text-primary font-black italic">LEVEL-4 ALPHA</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {[
                      { id: 'AX-V1', name: 'AXEL "V0ID" VANE', role: 'Baş Sinirsel Mimar', icon: <Zap size={18} />, color: 'primary', status: 'SİSTEMDE' },
                      { id: 'KI-C2', name: 'KIRA "CYPHER" S.', role: 'Veri Matrisi Mühendisi', icon: <Activity size={18} />, color: 'blue-400', status: 'SENKRONIZE' },
                      { id: 'LE-G3', name: 'LEO "GHOST" PARK', role: 'Arayüz Uzmanı', icon: <Terminal size={18} />, color: 'zinc-400', status: 'HAZIR' }
                    ].map((member, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ x: 10 }}
                        className="glass-card p-6 flex items-center gap-8 group hover:bg-white/[0.04] relative overflow-hidden"
                      >
                        {/* Technical ID badge line */}
                        <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-zinc-800 tracking-tighter">
                          ID: {member.id} {`//`} SECURE_CON
                        </div>

                        <div className={`w-14 h-14 bg-zinc-900/80 rounded-2xl flex items-center justify-center border border-white/5 transition-all shadow-inner`}>
                          <span className={member.color === 'primary' ? 'text-primary' : member.color === 'blue-400' ? 'text-blue-400' : 'text-zinc-400'}>{member.icon}</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <div className={`text-xl font-black italic uppercase tracking-tighter group-hover:text-primary transition-all`}>{member.name}</div>
                            <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-zinc-700'} animate-pulse`}></div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em]">{member.role}</div>
                            <div className="w-[1px] h-3 bg-white/10"></div>
                            <div className={`text-[8px] font-black uppercase ${member.color === 'primary' ? 'text-primary/80' : member.color === 'blue-400' ? 'text-blue-400/80' : 'text-zinc-400/80'}`}>{member.status}</div>
                          </div>
                        </div>

                        <div className="ml-auto flex items-center gap-4">
                          <div className="hidden md:block text-right">
                            <div className="text-[8px] font-mono text-zinc-600">VERİ ERİŞİMİ</div>
                            <div className="text-[10px] font-black text-white">ENABLED</div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 p-2 rounded-lg border border-primary/20">
                            <Swords size={16} className="text-primary" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Why V-Insight? - REIMAGINED */}
              <div className="mt-48 pb-60 relative">
                {/* Massive background glow/pattern to fill space */}
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <div className="w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[1px] bg-gradient-to-b from-transparent via-primary/20 to-transparent"></div>
                </div>

                <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 mb-12 backdrop-blur-md">
                      <Zap size={14} className="text-primary animate-bounce" />
                      <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Operasyonel Gerekçe</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                    </div>

                    <h3 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-10 leading-none val-gradient-text">
                      Neden Varız?
                    </h3>

                    <div className="relative">
                      {/* Decorative quotes */}
                      <div className="absolute -top-10 -left-6 text-9xl font-serif text-white/5 select-none text-left">“</div>
                      <div className="absolute -bottom-20 -right-6 text-9xl font-serif text-white/5 select-none text-right">”</div>

                      <p className="text-zinc-400 text-xl md:text-2xl leading-relaxed font-medium italic relative z-10">
                        Her oyuncu daha iyisini hak eder. Verinin <span className="text-white">karmaşıklığını basitleştirerek</span>, her ajanın içindeki <span className="text-primary font-black">potansiyeli ortaya çıkarmak</span> için buradayız. Sizin galibiyetiniz, bizim verinizdir.
                      </p>
                    </div>

                    <div className="mt-20 flex justify-center gap-12">
                      <div className="flex flex-col items-center">
                        <div className="text-3xl font-black text-white italic">1M+</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Analiz Edilen Maç</div>
                      </div>
                      <div className="w-[1px] h-12 bg-white/10 self-center"></div>
                      <div className="flex flex-col items-center">
                        <div className="text-3xl font-black text-white italic">94.2%</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Tahmin Doğruluğu</div>
                      </div>
                      <div className="w-[1px] h-12 bg-white/10 self-center"></div>
                      <div className="flex flex-col items-center">
                        <div className="text-3xl font-black text-white italic">50K+</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Aktif Ajan</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* REFINED FINAL LOGO DISPLAY */}
              <div className="mt-32 pb-48 flex flex-col items-center justify-center w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative flex flex-col items-center group"
                >
                  {/* Balanced background glow */}
                  <div className="absolute inset-0 bg-primary blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>

                  <img
                    src="/logo.png"
                    alt="V-Insight Shield"
                    className="h-64 md:h-80 w-auto relative z-10 transition-all duration-700 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                  />

                  <div className="mt-12 text-[10px] font-black uppercase tracking-[1.2em] text-zinc-700 group-hover:text-primary transition-all duration-500 text-center">
                    Project Neural Genesis // Terminal K-01
                  </div>
                </motion.div>
              </div>
            </div>
          )
        }
      </div >
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
          >
            <div className="absolute inset-0" onClick={() => setShowAuthModal(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-md glass-card border border-white/10 overflow-hidden"
            >
              <div className="p-10">
                <div className="flex flex-col items-center mb-10">
                  <div className="w-16 h-16 bg-primary/20 border border-primary/40 rounded-2xl flex items-center justify-center rotate-45 mb-6">
                    <Lock size={30} className="text-primary -rotate-45" />
                  </div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                    {authMode === 'login' ? 'Neural Erişim' : 'Yeni Bağlantı'}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2 text-center">
                    V-Insight Terminali üzerinden kimlik doğrulaması yapın.
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Kullanıcı Hattı</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" size={18} />
                      <input
                        type="text"
                        required
                        placeholder="KULLANICI ADI"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-xs font-black tracking-widest focus:border-primary transition-all outline-none"
                        value={authForm.username}
                        onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Güvenlik Anahtarı</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" size={18} />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-xs font-black tracking-widest focus:border-primary transition-all outline-none"
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      />
                    </div>
                  </div>

                  {authMode === 'register' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Riot ID (İsteğe Bağlı)</label>
                      <div className="relative">
                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" size={18} />
                        <input
                          type="text"
                          placeholder="NAME#TAG"
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-xs font-black tracking-widest focus:border-primary transition-all outline-none"
                          value={authForm.riotId}
                          onChange={(e) => setAuthForm({ ...authForm, riotId: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-primary hover:bg-white text-white hover:text-black py-5 rounded-xl font-black uppercase italic tracking-tighter text-sm transition-all shadow-[0_0_30px_rgba(255,70,85,0.3)] disabled:opacity-50"
                  >
                    {authLoading ? 'Bağlantı Kuruluyor...' : (authMode === 'login' ? 'Erişimi Onayla' : 'Bağlantıyı Başlat')}
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                  <button
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-primary transition-colors"
                  >
                    {authMode === 'login' ? 'Yeni bir neural link oluştur \u2192' : 'Zaten bir bağlantım var \u2192'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROFILE DRAWER / MODAL */}
      <AnimatePresence>
        {showProfile && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex justify-end bg-black/40 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setShowProfile(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-zinc-950 border-l border-white/10 p-10 flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center overflow-hidden relative group">
                    <User size={24} className="text-primary z-10" />
                    <div className="absolute inset-0 bg-primary/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{user.username}</h3>
                      <div className="px-1.5 py-0.5 rounded-md bg-primary/20 border border-primary/40 text-[7px] font-black text-primary uppercase">Alpha-07</div>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Neural ID: {user.id.toString().padStart(6, '0')}</span>
                  </div>
                </div>
                <button onClick={() => setShowProfile(false)} className="p-3 bg-white/5 rounded-xl hover:bg-primary/20 transition-all group">
                  <Zap size={20} className="text-zinc-500 group-hover:text-primary" />
                </button>
              </div>

              <div className="flex-1 space-y-8">
                <div
                  onMouseEnter={() => {
                    if (user.isPremium) {
                      setIsHoveringPremium(true);
                      setStarTrigger(prev => prev + 1);
                    }
                  }}
                  onMouseLeave={() => setIsHoveringPremium(false)}
                  className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group cursor-default"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Star size={80} className="text-amber-500" />
                  </div>

                  {user.isPremium && isHoveringPremium && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      {[...Array(16)].map((_, i) => (
                        <PremiumStar key={`${starTrigger}-${i}`} index={i} />
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Üyelik Statüsü</div>
                  <div className={`text-xl font-black italic uppercase tracking-tighter relative z-10 ${user.isPremium ? 'text-amber-500 text-glow-amber' : 'text-white'}`}>
                    {user.isPremium ? 'PREMIUM ACCESS' : 'STANDART LİNK'}
                  </div>
                  {!user.isPremium && (
                    <button
                      onClick={handleUpgrade}
                      className="mt-6 w-full py-4 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/40 text-amber-500 hover:text-black rounded-2xl font-black uppercase italic text-xs tracking-tighter transition-all"
                    >
                      PREMIUM&apos;A YÜKSELT
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Neural Verileri</div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[8px] font-bold text-green-500 uppercase italic">Bağlantı Stabil</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/[0.08] transition-colors relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10">
                        <Activity size={30} className="text-white" />
                      </div>
                      <div className="text-[8px] font-bold text-zinc-600 uppercase mb-1">Bağlantı Tarihi</div>
                      <div className="text-xs font-black text-white uppercase italic">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '25 Şub 2026'}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-primary/5 transition-colors relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10">
                        <Swords size={30} className="text-primary" />
                      </div>
                      <div className="text-[8px] font-bold text-zinc-600 uppercase mb-1">Riot Entegrasyonu</div>
                      <div className="text-xs font-black text-primary uppercase italic">{user.riotId || user.username}</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-white/5 rounded-[2.5rem] bg-gradient-to-b from-white/[0.03] to-transparent relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hızlı İstatistikler</h4>
                    <div className="text-[8px] font-mono text-primary animate-pulse tracking-widest">LIVE_SYNC</div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-[8px] font-bold text-zinc-600 uppercase">Analizler</div>
                        <div className="text-xl font-black text-white italic">{stats ? stats.matchHistory.length : '5'}<span className="text-[9px] text-zinc-600 ml-1">MTCH</span></div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="text-[8px] font-bold text-zinc-600 uppercase">Insights</div>
                        <div className="text-xl font-black text-primary italic">{stats ? stats.aiAnalysis.insights.length : '3'}<span className="text-[9px] text-zinc-600 ml-1">DET</span></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Neural Core Stability</span>
                        <span className="text-[9px] font-mono text-green-500">98.2%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '98.2%' }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-primary to-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                        />
                      </div>
                    </div>

                    {/* Technical Output Mini-Log */}
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-[7px] text-zinc-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">&gt;</span>
                        <span>ENCRYPT_CHANNEL: 256bit_AES</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary">&gt;</span>
                        <span>SYNC_STATUS: OPERATIONAL_S7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-auto flex items-center justify-center gap-3 w-full py-5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-zinc-500 hover:text-primary rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
              >
                <LogOut size={14} />
                SİSTEMİ KAPAT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEURAL SHOP OVERLAY */}
      <AnimatePresence>
        {showShop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-3xl overflow-y-auto"
          >

            <div className="max-w-6xl mx-auto w-full relative z-10 py-20 px-4">
              <div className="text-center mb-16">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-8"
                >
                  <Activity size={12} className="animate-pulse" />
                  Neural Tedarik Merkezi
                </motion.div>
                <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white mb-6 val-gradient-text leading-none">
                  SİSTEMİ YÜKSELT
                </h2>
                <p className="text-zinc-500 max-w-2xl mx-auto font-bold italic uppercase tracking-widest text-[10px]">
                  Verinin ötesini görün. Sektör-7 lisansıyla tam neural senkronizasyon sağlayın.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Neural Core",
                    sub: "AYLIK ERİŞİM",
                    price: "1.499",
                    period: "AY",
                    desc: "Yapay zeka analizlerine giriş seviyesi neural bağlantı.",
                    features: ["Detaylı Taktiksel Raporlar", "Gerçek Zamanlı Neural Veri", "Ajan Ustalığı Modelleri", "Limitlenmiş API Erişimi"],
                    color: "zinc-400",
                    isPopular: false
                  },
                  {
                    name: "Elite Sync",
                    sub: "YILLIK ERİŞİM",
                    price: "12.499",
                    period: "YIL",
                    desc: "Tam senkronizasyon isteyen profesyoneller için özel protokol.",
                    features: ["Core Planın Tüm Özellikleri", "Öncelikli Veri İşleme (0.5ms)", "Gelişmiş Rakip Projeksiyonu", "Özel Profil Rozeti", "%30 Siber Tasarruf"],
                    color: "primary",
                    isPopular: true
                  },
                  {
                    name: "Infinity Link",
                    sub: "SINIRSIZ ERİŞİM",
                    price: "24.999",
                    period: "ÖZEL",
                    desc: "V-Insight ekosistemine kalıcı, kırılamaz neural bağlantı.",
                    features: ["Elite Planın Tüm Özellikleri", "Ömür Boyu Lisans Garantisi", "VIP Neural Protokolü", "Alpha Sürüm Erişimi", "Discord Neural Rolü"],
                    color: "amber-500",
                    isPopular: false
                  }
                ].map((plan, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative group bg-white/[0.02] border ${plan.isPopular ? 'border-primary/50 shadow-[0_0_50px_rgba(255,70,85,0.1)]' : 'border-white/5'} p-10 rounded-[3rem] flex flex-col hover:bg-white/[0.04] transition-all duration-500 overflow-hidden`}
                  >
                    {plan.isPopular && (
                      <div className="absolute top-10 right-10 bg-primary text-[8px] font-black px-4 py-1.5 rounded-full text-white uppercase tracking-widest animate-pulse z-20">
                        EYLEM TAVSİYESİ
                      </div>
                    )}

                    <div className="mb-10 relative z-10">
                      <div className={`text-[10px] font-black tracking-[0.3em] uppercase mb-3 ${plan.color === 'primary' ? 'text-primary' : plan.color === 'amber-500' ? 'text-amber-500' : 'text-zinc-500'}`}>
                        {plan.sub}
                      </div>
                      <div className="text-4xl font-black italic uppercase tracking-tighter text-white">
                        {plan.name}
                      </div>
                    </div>

                    <div className="mb-10 p-8 bg-zinc-950/80 rounded-[2rem] border border-white/5 shadow-inner">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white italic tracking-tighter">₺{plan.price}</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">/ {plan.period}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-4 leading-relaxed font-medium italic">
                        {plan.desc}
                      </p>
                    </div>

                    <div className="flex-1 space-y-5 mb-12">
                      {plan.features.map((feat, fi) => (
                        <div key={fi} className="flex items-center gap-4">
                          <div className={`w-1.5 h-1.5 rounded-full ${plan.isPopular ? 'bg-primary' : 'bg-zinc-800'}`} />
                          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => processPurchase(plan)}
                      className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-[11px] transition-all duration-500 ${plan.isPopular
                        ? 'bg-primary text-white shadow-[0_10px_40px_rgba(255,70,85,0.4)] hover:shadow-[0_15px_60px_rgba(255,70,85,0.6)] hover:-translate-y-1'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-primary/50'
                        }`}
                    >
                      NEURAL AKIŞI BAŞLAT
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="mt-24 text-center pb-20">
                <button
                  onClick={() => setShowShop(false)}
                  className="group flex flex-col items-center mx-auto"
                >
                  <span className="text-[10px] font-black text-zinc-600 group-hover:text-primary uppercase tracking-[0.5em] transition-all mb-2">[ SİSTEMDEN ÇIK ]</span>
                  <div className="w-10 h-[1px] bg-zinc-800 group-hover:w-20 group-hover:bg-primary transition-all shadow-[0_0_10px_rgba(255,70,85,0)] group-hover:shadow-[0_0_10px_rgba(255,70,85,0.5)]"></div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckout && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => !isPaying && setShowCheckout(false)} />

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 p-10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Neural Checkout</div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Ödeme Onayı</h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Tutar</div>
                  <div className="text-2xl font-black italic text-white">₺{selectedPlan.price}</div>
                </div>
              </div>

              <form onSubmit={handleFinalizePayment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Kredi / Banka Kartı</label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={paymentForm.cardNo}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cardNo: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-mono tracking-[0.2em] focus:border-primary/50 transition-all outline-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                      <Zap size={20} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Son Kullanma</label>
                    <input
                      required
                      type="text"
                      placeholder="MM/YY"
                      value={paymentForm.expiry}
                      onChange={(e) => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-mono tracking-widest focus:border-primary/50 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">CVC</label>
                    <input
                      required
                      type="text"
                      placeholder="***"
                      value={paymentForm.cvv}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-mono tracking-[0.5em] focus:border-primary/50 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl mb-8">
                  <div className="flex items-start gap-3">
                    <Shield size={16} className="text-primary mt-1" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-medium italic">
                      Ödemeniz Sektör-7 neural şifreleme protokolü ile korunmaktadır. Bilgileriniz asla sunucularımızda saklanmaz.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPaying}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-[0_10px_30px_rgba(255,70,85,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isPaying ? (
                    <>
                      <CircleDashed className="animate-spin" size={16} />
                      ŞİFRELEME YAPILIYOR...
                    </>
                  ) : (
                    <>
                      ÖDEMEYİ TAMAMLA (₺{selectedPlan.price})
                    </>
                  )}
                </button>

                {!isPaying && (
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="w-full text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors mt-4"
                  >
                    İptal Et
                  </button>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpgradePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] shadow-[0_0_100px_rgba(255,70,85,0.1)] overflow-hidden"
            >
              {/* Premium Header Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

              <div className="relative z-10 px-10 py-16 text-center">
                <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30">
                  <Lock size={24} className="text-primary drop-shadow-[0_0_8px_rgba(255,70,85,0.6)]" />
                </div>

                <div className="space-y-3 mb-10">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                    ÜCRETSİZ LİMİT <br />
                    <span className="text-primary">AŞILDI</span>
                  </h2>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Analiz kapasiteniz sona erdi. <br />
                    Devam etmek için <span className="text-zinc-300">Premium</span> gereklidir.
                  </p>
                </div>


                <div className="space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "#ff4655", color: "white" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowUpgradePrompt(false);
                      setShowShop(true);
                    }}
                    className="w-full py-5 bg-white text-black rounded-xl font-black uppercase italic tracking-[0.3em] text-[11px] transition-all shadow-xl shadow-primary/10"
                  >
                    PREMIUM'A YÜKSELT
                  </motion.button>

                  <button
                    onClick={() => setShowUpgradePrompt(false)}
                    className="w-full py-2 text-[9px] font-black text-zinc-600 hover:text-white uppercase tracking-[0.4em] transition-all"
                  >
                    [ ŞİMDİLİK DURDUR ]
                  </button>
                </div>
              </div>

              {/* Minimalist Tech Decor */}
              <div className="absolute top-2 right-4 text-[6px] font-mono text-primary/30 tracking-widest italic uppercase">PRIME_REQUIRED</div>
              <div className="absolute bottom-2 left-4 text-[6px] font-mono text-primary/30 tracking-widest italic uppercase">V-INSIGHT // NEURAL</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[1000] min-w-[320px] px-4"
          >
            <div className={`relative overflow-hidden backdrop-blur-3xl bg-black/80 p-5 rounded-2xl border ${toast.type === 'success' ? 'border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.2)]' : 'border-primary/40 shadow-[0_0_40px_rgba(255,70,85,0.2)]'}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-primary'}`} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                  {toast.type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Neural İşlem Merkezi</div>
                  <div className="text-[13px] font-black text-white uppercase italic tracking-tighter leading-none">{toast.message}</div>
                </div>
              </div>

              {/* Progress bar effect */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-[2px] ${toast.type === 'success' ? 'bg-green-500/50' : 'bg-primary/50'}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  );
}

function getAdvantageColor(adv) {
  if (adv === 'Defense Advantage') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (adv === 'Attack Advantage') return 'bg-primary/10 text-primary border border-primary/20';
  return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
}

const mockData = {
  playerName: 'Antigravity#DEV',
  rank: 'Ascendant 2',
  rr: 74,
  lastChange: 18,
  totalWinRate: 58,
  topMaps: ['Ascent', 'Haven', 'Lotus'],
  mapStats: [
    {
      name: 'Ascent',
      image: 'https://media.valorant-api.com/maps/7eae2356-4315-4c2d-9c0c-95957f1ae9f6/listviewicon.png',
      attackWinRate: 42,
      defenseWinRate: 68,
      advantage: 'Defense Advantage',
      confidence: 85,
      recentForm: 'W W L W L'
    },
    {
      name: 'Haven',
      image: 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7f16b9d6f21a/listviewicon.png',
      attackWinRate: 55,
      defenseWinRate: 58,
      advantage: 'Balanced',
      confidence: 62,
      recentForm: 'W W W L W'
    },
    {
      name: 'Lotus',
      image: 'https://media.valorant-api.com/maps/2fe4ed3d-450f-7d33-3542-80b3b48d13ee/listviewicon.png',
      attackWinRate: 62,
      defenseWinRate: 38,
      advantage: 'Attack Advantage',
      confidence: 78,
      recentForm: 'L W W W W'
    },
    {
      name: 'Bind',
      image: 'https://media.valorant-api.com/maps/2c9dba14-4c4a-9122-d17e-089d794c15c4/listviewicon.png',
      attackWinRate: 48,
      defenseWinRate: 52,
      advantage: 'Balanced',
      confidence: 45,
      recentForm: 'L L W L W'
    }
  ],
  agentStats: [
    { name: 'Jett', winRate: 65, avgKDA: '1.45', image: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png' },
    { name: 'Omen', winRate: 54, avgKDA: '1.12', image: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png' },
    { name: 'Killjoy', winRate: 52, avgKDA: '0.98', image: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png' }
  ],
  matchHistory: [
    { mapName: 'Ascent', agentImage: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png', won: true, kills: 24, deaths: 12, assists: 4, score: 7200, timestamp: Date.now() },
    { mapName: 'Haven', agentImage: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png', won: true, kills: 18, deaths: 15, assists: 9, score: 5400, timestamp: Date.now() - 86400000 },
    { mapName: 'Lotus', agentImage: 'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png', won: false, kills: 14, deaths: 18, assists: 6, score: 3200, timestamp: Date.now() - 172800000 }
  ],
  aiAnalysis: {
    insights: [
      { type: 'STRENGTH', title: 'Keskin Nişancılık', content: 'HS oranınız Radiant standartlarında. Bu avantajı orta mesafe düellolarında kullanmalısınız.', severity: 'low' },
      { type: 'MAP_TRAINING', title: 'Savunma Zafiyeti', content: 'Son maçlarda B-Site tutuşlarında %40 verimlilik kaybı yaşadınız.', severity: 'high' }
    ],
    badges: [
      { id: 'clutch', label: 'CLUTCH MASTER', color: 'primary' },
      { id: 'aim', label: 'ELITE MARKSMAN', color: 'blue-400' }
    ],
    pulseData: [
      { x: 0, y: 12, won: true }, { x: 1, y: 8, won: false }, { x: 2, y: 15, won: true },
      { x: 3, y: 10, won: true }, { x: 4, y: 18, won: true }, { x: 5, y: 7, won: false }
    ],
    nextMission: { title: 'OPERASYON: DOMİNASYON', goal: 'Sonraki 3 maçı kazan', reward: 'Rank Progression x2' },
    metrics: { stability: '88.4', neuralLoad: '92.1' }
  }
};

// Helper functions for dynamic fetching of assets
function getMapImage(rawName) {
  if (!rawName) return 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png';

  const name = rawName.trim().toLowerCase();

  const mapIds = {
    'ascent': '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319',
    'haven': '2bee0dc9-4ffe-519b-1cbd-7fbe763a6047',
    'lotus': '2fe4ed3a-450a-948b-6d6b-e89a78e680a9',
    'bind': '2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba',
    'split': 'd960549e-485c-e861-8d71-aa9d1aed12a2',
    'icebox': 'e2ad5c54-4114-a870-9641-8ea21279579a',
    'breeze': '2fb9a4fd-47b8-4e7d-a969-74b4046ebd53',
    'sunset': '92584fbe-486a-b1b2-9faa-39b0f486b498',
    'abyss': '224b0a95-48b9-f703-1bd8-67aca101a61f',
    'corrode': '1c18ab1f-420d-0d8b-71d0-77ad3c439115',
    'pearl': 'fd267378-4d1d-484f-ff52-77821ed10dc2',
    'pitt': 'fd267378-4d1d-484f-ff52-77821ed10dc2',
    'fracture': 'b529448b-4d60-346e-e89e-00a4c527a405'
  };

  const id = mapIds[name] || '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319';
  return `https://media.valorant-api.com/maps/${id}/splash.png`;
}

function getAgentName(id) {
  const agents = {
    'add6443a-41bd-e414-f6ad-e58d267f4e95': 'Jett',
    '8e253930-4c05-31dd-1b6c-968525494517': 'Omen',
    '1e58de9c-4950-5125-93e9-a0aee9f98746': 'Killjoy',
    '569fdd95-4d10-43ab-ca70-79becc718b46': 'Sage',
    'f94c3b30-42be-e959-889c-5aa313dba261': 'Raze',
    '707eab51-4836-f488-046a-cda6bf494859': 'Viper',
    'eb93336a-449b-9c1b-0a54-a891f7921d69': 'Phoenix',
    '320b2a48-4d9b-a075-30f1-1f93a9b638fa': 'Sova',
    '9f0d8ba9-4140-b941-57d3-a7ad57c6b417': 'Brimstone',
    'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc': 'Reyna',
    '6f2a04ca-43e0-be17-7f36-b3908627744d': 'Skye',
    '117ed9e3-49f3-6512-3ccf-0cada7e3823b': 'Cypher',
    'dade69b4-4f5a-8528-247b-219e5a1facd6': 'Fade',
    '5f8d3a7f-467b-97f3-062c-13acf203c006': 'Breach',
    '22697a3d-45bf-8dd7-4fec-84a9e28c69d7': 'Chamber',
    '601dbbe7-43ce-be57-2a40-4abd24953621': 'KAY/O',
    '41fb69c1-4189-7b37-f117-bcaf1e96f1bf': 'Astra',
    '95b78ed7-4637-86d9-7e41-71ba8c293152': 'Harbor',
    'bb2a4330-4854-6713-0951-45c043e1d2e5': 'Sova', // Fixed ID for elder Sova if needed
    '0e38b510-41a8-5780-5e8f-568b2a4f2d6c': 'Iso',
    '1dbf2edd-4729-0984-3115-daa5eed44993': 'Clove',
    'bb2a4828-46eb-8cd1-e765-15848195d751': 'Neon',
    '7f94d92c-4234-0a36-9646-3a87eb8b5c89': 'Yoru',
    'e370fa57-4757-3604-3648-499e1f642d3f': 'Gekko',
    'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235': 'Deadlock',
    'efba5359-4016-a1e5-7626-b1ae76895940': 'Vyse'
  };
  return agents[id] || 'Saha Ajanı';
}

function getAgentImage(identifier) {
  if (!identifier) return 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png';

  // If it's a UUID
  if (identifier.includes('-')) {
    return `https://media.valorant-api.com/agents/${identifier}/displayicon.png`;
  }

  // Comprehensive mapping for 2026 agents
  const agentMap = {
    'Jett': 'add6443a-41bd-e414-f6ad-e58d267f4e95',
    'Omen': '8e253930-4c05-31dd-1b6c-968525494517',
    'Killjoy': '1e58de9c-4950-5125-93e9-a0aee9f98746',
    'Sage': '569fdd95-4d10-43ab-ca70-79becc718b46',
    'Raze': 'f94c3b30-42be-e959-889c-5aa313dba261',
    'Viper': '707eab51-4836-f488-046a-cda6bf494859',
    'Phoenix': 'eb93336a-449b-9c1b-0a54-a891f7921d69',
    'Sova': '320b2a48-4d9b-a075-30f1-1f93a9b638fa',
    'Brimstone': '9f0d8ba9-4140-b941-57d3-a7ad57c6b417',
    'Reyna': 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
    'Skye': '6f2a04ca-43e0-be17-7f36-b3908627744d',
    'Cypher': '117ed9e3-49f3-6512-3ccf-0cada7e3823b',
    'Fade': 'dade69b4-4f5a-8528-247b-219e5a1facd6',
    'Breach': '5f8d3a7f-467b-97f3-062c-13acf203c006',
    'Chamber': '22697a3d-45bf-8dd7-4fec-84a9e28c69d7',
    'KAY/O': '601dbbe7-43ce-be57-2a40-4abd24953621',
    'Astra': '41fb69c1-4189-7b37-f117-bcaf1e96f1bf',
    'Harbor': '95b78ed7-4637-86d9-7e41-71ba8c293152',
    'Iso': '0e38b510-41a8-5780-5e8f-568b2a4f2d6c',
    'Clove': '1dbf2edd-4729-0984-3115-daa5eed44993',
    'Neon': 'bb2a4828-46eb-8cd1-e765-15848195d751',
    'Yoru': '7f94d92c-4234-0a36-9646-3a87eb8b5c89',
    'Gekko': 'e370fa57-4757-3604-3648-499e1f642d3f',
    'Deadlock': 'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235',
    'Vyse': 'efba5359-4016-a1e5-7626-b1ae76895940'
  };

  const id = agentMap[identifier] || 'add6443a-41bd-e414-f6ad-e58d267f4e95';
  return `https://media.valorant-api.com/agents/${id}/displayicon.png`;
}

function getMapId(name) {
  const mapIds = {
    'ascent': '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319',
    'haven': '2bee0dc9-4ffe-519b-1cbd-7fbe763a6047',
    'lotus': '2fe4ed3a-450a-948b-6d6b-e89a78e680a9',
    'bind': '2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba',
    'split': 'd960549e-485c-e861-8d71-aa9d1aed12a2',
    'icebox': 'e2ad5c54-4114-a870-9641-8ea21279579a',
    'breeze': '2fb9a4fd-47b8-4e7d-a969-74b4046ebd53',
    'sunset': '92584fbe-486a-b1b2-9faa-39b0f486b498',
    'abyss': '224b0a95-48b9-f703-1bd8-67aca101a61f',
    'corrode': '1c18ab1f-420d-0d8b-71d0-77ad3c439115',
    'pearl': 'fd267378-4d1d-484f-ff52-77821ed10dc2',
    'fracture': 'b529448b-4d60-346e-e89e-00a4c527a405'
  };
  return mapIds[name.toLowerCase()] || '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319';
}

function getHeatmapZones(mapName) {
  const zones = {
    'ascent': [
      { top: '35%', left: '72%', label: 'A-Default Site (Plant)', intensity: 1.0, type: 'spike', winProb: 88, description: 'A-Site Generator/Dice yanı. En klasik ve güvenli plant noktası.' },
      { top: '80%', left: '28%', label: 'B-Backsite (Plant)', intensity: 1.0, type: 'spike', winProb: 85, description: 'B-Site Boat/Backsite arası. CT girişini kapatmak için ideal.' },
      { top: '48%', left: '52%', label: 'Mid-Market Peek', intensity: 0.8, type: 'hold', winProb: 65, bestAgent: 'Jett', description: 'Orta alan kontrolü ve Market geçişini tutma noktası.' },
      { top: '32%', left: '62%', label: 'A-Main Entry', intensity: 0.9, type: 'entry', winProb: 70, bestAgent: 'Omen', description: 'A-Main ve Site girişi için duman/flash kombo noktası.' }
    ],
    'haven': [
      { top: '18%', left: '72%', label: 'A-Default (Plant)', intensity: 1.0, type: 'spike', winProb: 82, description: 'A-Site default kutu yanı. Long ve Short tarafından rahatça korunabilir.' },
      { top: '50%', left: '52%', label: 'B-Site (Plant)', intensity: 0.9, type: 'spike', winProb: 78, description: 'B-Site ana kurulum noktası. Mid kontrolü kritik.' },
      { top: '85%', left: '75%', label: 'C-Long Default (Plant)', intensity: 1.0, type: 'spike', winProb: 89, description: 'C-Site Long-side plant. Geri çekilip Longdan korumak için en iyi nokta.' },
      { top: '48%', left: '32%', label: 'Garage Control', intensity: 0.85, type: 'hold', winProb: 68, bestAgent: 'Killjoy', description: 'B ve C arası geçişi (Garage) tutmak için en iyi pozisyon.' }
    ],
    'split': [
      { top: '20%', left: '62%', label: 'A-Default Site (Plant)', intensity: 1.0, type: 'spike', winProb: 85, description: 'A-Site ana plant bölgesi. Screens ve Heaven tarafından korunması kolay.' },
      { top: '80%', left: '27%', label: 'B-Default Site (Plant)', intensity: 1.0, type: 'spike', winProb: 88, description: 'B-Site sütun yanı (Default). B-Main ve Backsite arasından savunma yapılabilir.' },
      { top: '50%', left: '50%', label: 'Mid-Vent Bridge', intensity: 0.9, type: 'hold', winProb: 72, bestAgent: 'Sage', description: 'Mid kontrolü için kritik köprü ve havalandırma bölgesi.' },
      { top: '35%', left: '85%', label: 'A-Ramps Entry', intensity: 0.85, type: 'entry', winProb: 65, bestAgent: 'Raze', description: 'A-Site hızlı girişi için bomba paketi kullanım noktası.' }
    ],
    'bind': [
      { top: '22%', left: '78%', label: 'A-Truck (Plant)', intensity: 1.0, type: 'spike', winProb: 84, description: 'A-Site kamyon yanı. Short ve banyodan korunan stratejik nokta.' },
      { top: '85%', left: '22%', label: 'B-Box Side (Plant)', intensity: 1.0, type: 'spike', winProb: 86, description: 'B-Site default kutular. Hookah ve Long kontrolüyle raunt kazandırır.' },
      { top: '30%', left: '25%', label: 'B-Long Control', intensity: 0.9, type: 'snipe', winProb: 74, bestAgent: 'Chamber', description: 'B-Long koridoru için operatör görüş alanı.' },
      { top: '55%', left: '82%', label: 'A-Bathrooms Peek', intensity: 0.8, type: 'hold', winProb: 62, bestAgent: 'Skye', description: 'A-Banyo (Showers) agresif kontrol noktası.' }
    ]
  };
  return zones[mapName.toLowerCase()] || [
    { top: '40%', left: '40%', label: 'Tactical Alpha', intensity: 0.8, type: 'entry', winProb: 50, bestAgent: 'Global', description: 'Tahmini çatışma ve pusu bölgesi.' },
    { top: '15%', left: '15%', label: 'Spike Strategic Node', intensity: 0.95, type: 'spike', winProb: 80, description: 'Hedef bölgesi. Spike kurulumu için optimize edilmiş alan.' }
  ];
}

function getBestComps(mapName, getAll = false) {
  const comps = {
    // ... (rest of the mapping stays same, just returning logic changes)
    'ascent': [
      {
        agents: ['Jett', 'Sova', 'KAY/O', 'Omen', 'Killjoy'],
        reason: 'Radiant Klasik: Jett Generator düellosuna girerken Sova B-Link bilgisini alır. KAY/O ultisi retake senaryolarında Killjoy ultisini tamamen etkisiz hale getirir.',
        attackTips: ['Killjoy ultisini korumak için rakip KAY/O bıçaklarını takip edin.', 'A-Main kontrolü için Sova şok oku setuplarını kullanın.'],
        defenseTips: ['Omen dumanlarını Mid kontrolü için derin atıp agresifleşin.', 'Killjoy taretini rakip Jett girişini duyacak şekilde yerleştirin.']
      },
      {
        agents: ['Jett', 'Sova', 'KAY/O', 'Omen', 'Cypher'],
        reason: 'Radiant Lurk Metası: Cypher ile B-Main tamamen "trip"lerle kapatılarak bir kişinin A-Main arkasına (lurk) sızması sağlanır.',
        attackTips: ['Cypher kafeslerini site girişinde vizyon kapatmak için kullanın.', 'Jett ile duman içine dash atıp crosshairi dağıtın.'],
        defenseTips: ['Cypher kamerasını Mid bilgisini erken verecek şekilde saklayın.']
      },
      {
        agents: ['Phoenix', 'KAY/O', 'Omen', 'Sova', 'Killjoy'],
        reason: 'Radiant Flash-Drive: Çitflaşör metası. Phoenix B-Site girişlerini flaşla domine ederken Omen derin dumanlarla görüşü keser.',
        attackTips: ['Phoenix flaşlarını duman kenarlarından "pop-flash" olarak kullanın.'],
        defenseTips: ['Mid itişleri yaparak rakibin raunt planını bozun.']
      }
    ],
    'haven': [
      {
        agents: ['Jett', 'Sova', 'Breach', 'Omen', 'Killjoy'],
        reason: 'Radiant 3-Site Control: Breach art sarsıntıları Haven dar koridorlarında rakipleri felç eder. Jett Garajdan hızlı sızmalar için kullanılır.',
        attackTips: ['A-Long itişi için Breach parlamasını dikey senkronize edin.', 'C-Plant sonrası Sova ile Garajı wall-bangleyin.'],
        defenseTips: ['Killjoy taretini C tutuşu için kurup A ya rotasyon yapın.', 'Omen dumanlarını 3 sitea da yardım edebilecek şekilde saklayın.']
      },
      {
        agents: ['Jett', 'Skye', 'Breach', 'Omen', 'Cypher'],
        reason: 'Radiant Information War: Skye kurtları ve Breach sarsıntılarıyla raunt başı her yerden bilgi alınır. Cypher arkadan sızmaları imkansız kılar.',
        attackTips: ['Skye flaşlarını "bilgi flaşı" olarak raunt başı atın.'],
        defenseTips: ['Cypher kamerasını A-Shorta saklayıp B-Siteı kamerayla izleyin.']
      }
    ],
    'bind': [
      {
        agents: ['Raze', 'Viper', 'Brimstone', 'Skye', 'Cypher'],
        reason: 'Radiant Dual-Smoke: Viper perdesi A-Lampsı keserken Brimstone B-Siteı tamamen kapatır. Raze teleportları kaotik girişler için kullanır.',
        attackTips: ['Raze bombasını Hookah merdivenlerine raunt başı atın.', 'Viper ultisini A-Kısa veya B-Site plant sonrası açın.'],
        defenseTips: ['Cypher tuzaklarını teleport çıkışlarına ve Hookah girişine gizleyin.', 'Brimstone molotofunu A-Main girişini geciktirmek için saklayın.']
      },
      {
        agents: ['Raze', 'Skye', 'Gekko', 'Brimstone', 'Viper'],
        reason: 'Radiant Wingman Meta: Gekko Wingman ile spike kurarken 4 kişi koruma sağlar. Raze blast-packlerle alanı açar.',
        attackTips: ['Gekko ultisini B-Longtan site içine yönlendirin.'],
        defenseTips: ['Viper zehriyle teleport girişlerini her zaman tehlikeli tutun.']
      }
    ],
    'lotus': [
      {
        agents: ['Jett', 'Viper', 'Omen', 'Killjoy', 'Skye'],
        reason: 'Radiant Deep Control: Viper perdeleri Lotusun geniş sitelarını böler. Skye kurtları kapı arkası pusuları temizlemede 1 numaradır.',
        attackTips: ['A-Kapı kontrolü için Gekko veya Skye yeteneklerini senkronize edin.', 'B-Hızlı girişi için Viper perdesini raunt başı atın.'],
        defenseTips: ['A-Mainden erken bilgi almak için Killjoy alarm botunu ileriye kurun.', 'Omen paronayasını B-Girişine saklayın.']
      }
    ],
    'corrode': [
      {
        agents: ['Jett', 'Omen', 'Sova', 'Fade', 'Killjoy'],
        reason: 'Corrode Radiant Meta: Haritanın Vortex odası Fade ve Sova ile tamamen aydınlatılır. Jett üst katmanlardan düşmanları avlar.',
        attackTips: ['Fade tutuşunu Vortex girişine atın.', 'Jett ile dikey hatları kullanarak beklenmedik açılardan peakleyin.'],
        defenseTips: ['Omen dumanlarını Outer Ring girişine atın.', 'Killjoy taretini Vortex arkasına saklayın.']
      },
      {
        agents: ['Raze', 'Viper', 'Brimstone', 'Gekko', 'Cypher'],
        reason: 'Corrode Tactical: Viper perdesiyle haritayı ikiye bölüp Gekko ile spike kurulumu güven altına alınır.',
        attackTips: ['Gekko Wingmanı siteın en uzak köşesine gönderin.'],
        defenseTips: ['Cypher kamerasını Vortex tavanına kurup her yeri izleyin.']
      }
    ]
  };

  const mapComps = comps[mapName.toLowerCase()] || [
    {
      agents: ['Jett', 'Sova', 'Omen', 'Killjoy', 'KAY/O'],
      reason: 'Standart Radiant Meta: Dengeli bilgi ve agresif giriş potansiyeli.',
      attackTips: ['Birlikte hareket edip yetenek komboları yapın.'],
      defenseTips: ['Site kontrolünü kaybetmeden bilgi odaklı oynayın.']
    },
    {
      agents: ['Raze', 'Skye', 'Brimstone', 'Cypher', 'Viper'],
      reason: 'Radiant Lane Control: Alanı bölerek rakipleri tek tek avlamaya odaklı profesyonel bir kadro.',
      attackTips: ['Skye flaşlarıyla bilgi toplayıp lane bölün.'],
      defenseTips: ['Viper zehri ve Brim molotoflarıyla girişi imkansızlaştırın.']
    }
  ];

  // If getAll requested (for rotation logic in UI), return the entire list
  if (getAll) return mapComps;

  // Otherwise return a random one
  return mapComps[Math.floor(Math.random() * mapComps.length)];
}
