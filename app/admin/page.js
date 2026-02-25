"use client";

import { useState } from 'react';
import { Shield, Zap, User, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPage() {
    const [username, setUsername] = useState('');
    const [adminKey, setAdminKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleGrant = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/grant-premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, secretKey: adminKey })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                setUsername('');
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Neural link connection failed.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
            <div className="scanline" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-card p-10 border-primary/20 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl tracking-tight select-none translate-x-4">ADMIN</div>

                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-primary/20 border-2 border-primary rounded-2xl flex items-center justify-center rotate-45 mb-6 shadow-[0_0_20px_rgba(255,70,85,0.4)]">
                        <Shield size={32} className="text-primary -rotate-45" />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter val-gradient-text text-center">Neural Override</h1>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-2">Premium Yetki Konsolu</p>
                </div>

                <form onSubmit={handleGrant} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Hedef Kullanıcı Adı</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="ÖRN: WESTXD123"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 pl-12 text-white focus:border-primary focus:outline-none transition-all"
                                required
                            />
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Admin Güvenlik Anahtarı</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={adminKey}
                                onChange={(e) => setAdminKey(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 pl-12 text-white focus:border-primary focus:outline-none transition-all"
                                required
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-white hover:text-black text-white py-4 rounded-xl font-black italic uppercase tracking-widest transition-all disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(255,70,85,0.3)]"
                    >
                        {loading ? 'YETKİ VERİLİYOR...' : 'PREMIUM AKTİF ET'}
                    </button>
                </form>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`mt-8 p-4 rounded-xl border text-center text-[11px] font-bold uppercase tracking-widest ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-primary/10 border-primary/20 text-primary'
                            }`}
                    >
                        {message.text}
                    </motion.div>
                )}

                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-2">
                    <a href="/" className="text-[10px] font-black text-zinc-600 hover:text-white transition-colors uppercase tracking-[0.2em]">← Ana Terminale Dön</a>
                </div>
            </motion.div>
        </main>
    );
}
