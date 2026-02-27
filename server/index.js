const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'v-insight-neural-ultra-secret-key-2026';
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
let db;

const app = express();
const PORT = process.env.PORT || 3001;
const IS_VERCEL = process.env.VERCEL || process.env.NOW_REGION;


app.use(cors());
app.use(express.json());

// Log Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') console.log('Body:', req.body);
    next();
});

// Database Initialization
(async () => {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    db = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                riotId TEXT,
                isPremium INTEGER DEFAULT 0,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[DB] Neon PostgreSQL (Neural Database) is ready.');
    } catch (error) {
        console.error('[DB ERROR] Initialization failed:', error);
    }
})();

const HENRIK_BASE_URL = 'https://api.henrikdev.xyz/valorant';

const getHeaders = () => {
    const key = process.env.HENRIK_API_KEY || 'HDEV-1c7034a2-f257-4c38-8814-d5f4b8c6149a';
    return {
        'Authorization': key
    };
};

app.get('/', (req, res) => {
    res.send('<h1>V-INSIGHT API // STATUS: OPERATIONAL</h1><p>Neural Core is active. Use /api/health for heartbeat.</p>');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'V-Insight Neural Core', version: '4.2.0' });
});

// AUTH ENDPOINTS
app.post('/api/auth/register', async (req, res) => {
    const { username, password, riotId } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, password, riotId) VALUES ($1, $2, $3)',
            [username, hashedPassword, riotId]
        );
        res.json({ success: true, message: 'Neural link established.' });
    } catch (error) {
        console.error('[AUTH ERROR] Register fail:', error);
        res.status(400).json({ error: 'Username already exists or data corruption: ' + error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                riotId: user.riotid,
                isPremium: user.ispremium
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Neural link failed.' });
    }
});

app.get('/api/auth/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No link found.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await db.query('SELECT id, username, riotid, ispremium, createdat FROM users WHERE id = $1', [decoded.id]);
        const u = result.rows[0];
        res.json({
            id: u.id,
            username: u.username,
            riotId: u.riotid,
            isPremium: u.ispremium,
            createdAt: u.createdat
        });
    } catch (e) {
        res.status(401).json({ error: 'Link expired.' });
    }
});

// PREMIUM UPGRADE
app.post('/api/auth/upgrade', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await db.query('UPDATE users SET isPremium = 1 WHERE id = $1', [decoded.id]);
        res.json({ success: true, message: 'Neural link upgraded to PREMIUM.' });
    } catch (e) {
        res.status(500).json({ error: 'Upgrade failed.' });
    }
});

// ADMIN GRANT PREMIUM
app.post('/api/admin/grant-premium', async (req, res) => {
    const { username, secretKey } = req.body;

    // Basit bir güvenlik kontrolü
    if (secretKey !== 'v-insight-admin-2026') {
        return res.status(403).json({ error: 'Neural access denied. Invalid admin key.' });
    }

    try {
        const result = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'Target user not found in neural database.' });
        }

        await db.query('UPDATE users SET isPremium = 1 WHERE id = $1', [user.id]);
        res.json({ success: true, message: `ACCESS GRANTED: ${username} is now PREMIUM.` });
    } catch (e) {
        res.status(500).json({ error: 'Admin override failed.' });
    }
});

// MATCH DETAIL ENDPOINT
app.get('/api/match-detail/:region/:matchId', async (req, res) => {
    const { region, matchId } = req.params;
    try {
        const r = await axios.get(`${HENRIK_BASE_URL}/v4/match/${region}/${matchId}`, { headers: getHeaders() });
        const match = r.data?.data;
        if (!match) return res.status(404).json({ error: 'Match not found.' });

        const meta = match.metadata;
        const allPlayers = match.players || [];

        const parseTeam = (teamColor) => {
            return allPlayers
                .filter(p => p.team_id?.toLowerCase() === teamColor)
                .map(p => {
                    const stats = p.stats || {};
                    const totalShots = (stats.headshots || 0) + (stats.bodyshots || 0) + (stats.legshots || 0) || 1;
                    const totalRounds = meta.rounds_played || 20;
                    // Rank/Tier Exhaustive fallbacks
                    const tierObj = p.tier || p.current_tier || p.competitive_tier || {};
                    const tierValue = (typeof tierObj === 'object') ? (tierObj.id || tierObj.tier || 0) : (tierObj || p.currenttier || 0);
                    const tierName = (typeof tierObj === 'object') ? (tierObj.name || tierObj.tier_name || 'Unranked') : (p.currenttier_patched || 'Rank ' + tierValue);
                    let tierIcon = (typeof tierObj === 'object' && tierObj.assets) ? (tierObj.assets.large || tierObj.assets.small) :
                        (p.assets?.tier?.large || "");

                    if (!tierIcon) {
                        // Episode 5+ Competitive Tiers GUID (Includes Ascendant) - Official: 03621f52-342b-cf4e-4f86-9350a49c6d04
                        tierIcon = `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tierValue}/largeicon.png`;
                    }

                    // Damage/ADR Exhaustive fallbacks
                    const damageDealt = p.damage?.dealt || stats.damage?.dealt || p.stats?.damage || p.damage_made || p.stats?.damage_made || 0;

                    return {
                        puuid: p.puuid,
                        name: p.name,
                        tag: p.tag,
                        agent: p.agent?.name || p.character?.name || p.character || 'Unknown',
                        agentIcon: p.agent?.assets?.display_icon || p.agent?.assets?.small_icon || p.assets?.agent?.small || '',
                        rank: tierName,
                        rankIcon: tierIcon,
                        acs: Math.round((stats.score || 0) / (totalRounds || 20)),
                        kills: stats.kills || 0,
                        deaths: stats.deaths || 0,
                        assists: stats.assists || 0,
                        plusMinus: (stats.kills || 0) - (stats.deaths || 0),
                        kd: ((stats.kills || 0) / (stats.deaths || 1)).toFixed(2),
                        hsPercent: Math.round(((stats.headshots || 0) / totalShots) * 100),
                        adr: Math.round(damageDealt / (totalRounds || 20)),
                        firstKills: p.ability_casts?.c_cast || 0,
                        team: teamColor
                    };
                })
                .sort((a, b) => b.acs - a.acs);
        };

        const redTeam = parseTeam('red');
        const blueTeam = parseTeam('blue');

        // Henrik V4 teams is usually an object with 'red' and 'blue' keys
        const teams = match.teams || {};
        const redTeamData = teams.red || (Array.isArray(teams) ? teams.find(t => t.team_id?.toLowerCase() === 'red') : {}) || {};
        const blueTeamData = teams.blue || (Array.isArray(teams) ? teams.find(t => t.team_id?.toLowerCase() === 'blue') : {}) || {};

        // Detect totals through rounds if teams data is missing/incomplete
        let calcRedScore = redTeamData.rounds_won !== undefined ? redTeamData.rounds_won : (redTeamData.score !== undefined ? redTeamData.score : 0);
        let calcBlueScore = blueTeamData.rounds_won !== undefined ? blueTeamData.rounds_won : (blueTeamData.score !== undefined ? blueTeamData.score : 0);

        if ((calcRedScore === 0 && calcBlueScore === 0) && match.rounds) {
            match.rounds.forEach(r => {
                if (r.winning_team?.toLowerCase() === 'red') calcRedScore++;
                else if (r.winning_team?.toLowerCase() === 'blue') calcBlueScore++;
            });
        }

        // Detect duration through various possible fields
        const duration = meta.game_length_ms || meta.game_length_millis ||
            (meta.game_length ? meta.game_length * (meta.game_length < 10000 ? 60000 : 1000) : 0) ||
            (meta.game_start && meta.game_end ? (meta.game_end - meta.game_start) : 0) || 1500000;

        res.json({
            matchId: meta.match_id,
            map: meta.map?.name || 'Unknown',
            mode: meta.queue?.name || 'Competitive',
            date: meta.started_at,
            duration: duration,
            redScore: calcRedScore,
            blueScore: calcBlueScore,
            redWon: redTeamData.won || (calcRedScore > calcBlueScore),
            blueWon: blueTeamData.won || (calcBlueScore > calcRedScore),
            redPlayers: redTeam,
            bluePlayers: blueTeam
        });
    } catch (error) {
        console.error('[MATCH DETAIL ERROR]', error.message);
        res.status(500).json({ error: 'Could not fetch match details.' });
    }
});

app.get('/api/stats-full/:name/:tag', async (req, res) => {

    const { name, tag } = req.params;

    try {
        console.log(`[REQ] Fetching Account for ${name}#${tag}...`);

        const accRes = await axios.get(`${HENRIK_BASE_URL}/v1/account/${name}/${tag}`, { headers: getHeaders() });
        if (!accRes.data || !accRes.data.data) {
            throw new Error(`Account not found or API error: ${accRes.status}`);
        }
        const accountData = accRes.data.data;
        const puuid = accountData.puuid;
        const region = accountData.region || 'eu';

        console.log(`[OK] PUUID: ${puuid}, Region: ${region}`);

        let rank = "Unranked";
        let tier = 0;
        let rankIcon = "";
        let rr = 0;
        let lastChange = 0;
        try {
            // Try fetching MMR with PUUID for better reliability if name/tag fails
            const mmrRes = await axios.get(`${HENRIK_BASE_URL}/v2/by-puuid/mmr/${region}/${puuid}`, { headers: getHeaders() });
            const currentData = mmrRes.data?.data?.current_data;
            if (currentData) {
                rank = currentData.currenttierpatched || "Unranked";
                tier = currentData.currenttier || 0;
                rankIcon = currentData.images?.large || currentData.images?.small || "";
                rr = currentData.ranking_in_tier || 0;
                lastChange = currentData.mmr_change_to_last_game || 0;
            }
        } catch (e) {
            console.warn(`[WARN] MMR Fetch failed: ${e.message}`);
            rank = accountData.current_tier_patched || "Unknown";
        }

        console.log(`[REQ] Fetching Match History...`);
        const matchRes = await axios.get(`${HENRIK_BASE_URL}/v3/matches/${region}/${name}/${tag}`, { headers: getHeaders() });
        const matches = matchRes.data.data;

        if (!matches || matches.length === 0) {
            throw new Error("Match history is empty.");
        }

        const stats = calculateSafeStats(matches, puuid);

        res.json({
            playerName: `${name}#${tag}`,
            puuid,
            level: accountData.account_level,
            card: accountData.card.small,
            rank: rank,
            tier: tier,
            rr: rr,
            lastChange: lastChange,
            rankIcon: rankIcon,
            isMockData: false,
            ...stats,
            aiAnalysis: await generateAIAnalysis({ ...stats, playerName: name, rr, lastChange, rank })
        });

    } catch (error) {
        console.error(`[FATAL ERROR] ${error.message}`);
        const status = error.response?.status || 500;
        const msg = status === 404 ? "Neural bağlantı kurulamadı: Bu Riot ID bulunamadı." : "Sektör-7 sunucuları şu an meşgul, lütfen birazdan tekrar deneyin.";
        return res.status(status).json({ error: msg });
    }
});

function calculateSafeStats(matches, puuid) {
    const mapStatsMap = new Map();
    const agentStatsMap = new Map();
    let totalWins = 0;
    let totalHeadshots = 0;
    let totalBodyshots = 0;
    let totalLegshots = 0;
    const matchHistory = [];

    matches.forEach(match => {
        try {
            const metadata = match.metadata;
            const mapName = metadata.map;
            const player = (match.players.all_players || []).find(p => p.puuid === puuid);
            if (!player) return;

            const teamName = player.team.toLowerCase();
            const team = match.teams?.[teamName];
            const won = team?.has_won || false;
            if (won) totalWins++;

            // Shots aggregation
            totalHeadshots += player.stats?.headshots || 0;
            totalBodyshots += player.stats?.bodyshots || 0;
            totalLegshots += player.stats?.legshots || 0;

            // Map Stats
            if (!mapStatsMap.has(mapName)) {
                mapStatsMap.set(mapName, {
                    name: mapName, wins: 0, matches: 0, attackWins: 0, attackTotal: 0, defenseWins: 0, defenseTotal: 0
                });
            }
            const m = mapStatsMap.get(mapName);
            m.matches++;
            if (won) m.wins++;

            // Safe round analysis
            if (match.rounds) {
                match.rounds.forEach((round, roundIndex) => {
                    const playerWonRound = round.winning_team?.toLowerCase() === teamName;
                    const isAttack = (teamName === 'red' && roundIndex < 12) || (teamName === 'blue' && roundIndex >= 12);

                    if (isAttack) {
                        m.attackTotal++;
                        if (playerWonRound) m.attackWins++;
                    } else {
                        m.defenseTotal++;
                        if (playerWonRound) m.defenseWins++;
                    }
                });
            }

            const totalRounds = metadata.rounds_played || (match.teams?.red?.rounds_won + match.teams?.blue?.rounds_won) || 20;
            const stats_raw = player.stats || {};
            const totalShots = (stats_raw.headshots || 0) + (stats_raw.bodyshots || 0) + (stats_raw.legshots || 0) || 1;

            matchHistory.push({
                matchId: metadata.matchid,
                mapName,
                agentId: player.character,
                agentIcon: (player.assets?.agent?.small || player.assets?.agent?.display_icon) || "",
                won,
                kills: stats_raw.kills || 0,
                deaths: stats_raw.deaths || 0,
                assists: stats_raw.assists || 0,
                score: stats_raw.score || 0,
                acs: Math.round((stats_raw.score || 0) / totalRounds),
                kd: (stats_raw.kills / (stats_raw.deaths || 1)).toFixed(2),
                hsPercent: Math.round(((stats_raw.headshots || 0) / totalShots) * 100),
                timestamp: (metadata.game_start || Date.now() / 1000) * 1000,
                region: metadata.region || 'eu',
                mode: metadata.mode || 'Competitive',
                teamRedScore: match.teams?.red?.rounds_won || 0,
                teamBlueScore: match.teams?.blue?.rounds_won || 0,
                playerTeam: teamName,
                rank: player.currenttier_patched || "Unknown",
                rankIcon: (player.assets?.tier?.large || player.assets?.tier?.small) || ""
            });

            const agentName = player.character;
            if (agentName) {
                if (!agentStatsMap.has(agentName)) {
                    agentStatsMap.set(agentName, { id: agentName, wins: 0, total: 0, kills: 0, deaths: 0 });
                }
                const a = agentStatsMap.get(agentName);
                a.total++;
                if (won) a.wins++;
                a.kills += player.stats?.kills || 0;
                a.deaths += player.stats?.deaths || 0;
            }
        } catch (innerError) {
            console.error("[INNER ERROR] Skipping match record:", innerError.message);
        }
    });

    const totalShots = totalHeadshots + totalBodyshots + totalLegshots || 1;

    return {
        totalWinRate: Math.round((totalWins / (matches.length || 1)) * 100),
        headshots: Math.round((totalHeadshots / totalShots) * 100),
        headshotPct: Math.round((totalHeadshots / totalShots) * 100),
        bodyshotPct: Math.round((totalBodyshots / totalShots) * 100),
        legshotPct: Math.round((totalLegshots / totalShots) * 100),
        mapStats: Array.from(mapStatsMap.values()).map(m => {
            const attWR = m.attackTotal > 0 ? Math.round((m.attackWins / m.attackTotal) * 100) : 50;
            const defWR = m.defenseTotal > 0 ? Math.round((m.defenseWins / m.defenseTotal) * 100) : 50;
            return {
                name: m.name,
                wins: m.wins,
                matches: m.matches,
                attackWinRate: attWR,
                defenseWinRate: defWR,
                advantage: defWR > attWR + 3 ? "Defense Advantage" : (attWR > defWR + 3 ? "Attack Advantage" : "Balanced"),
                recommendation: defWR > attWR ? "START DEFENSE" : "START ATTACK"
            };
        }),
        matchHistory,
        agentStats: Array.from(agentStatsMap.values())
            .map(a => ({
                id: a.id,
                name: a.id,
                totalCount: a.total,
                winRate: Math.round((a.wins / (a.total || 1)) * 100),
                avgKDA: (a.kills / (a.deaths || 1)).toFixed(2)
            }))
            .sort((a, b) => b.totalCount - a.totalCount)
            .slice(0, 4)
    };
}

async function generateAIAnalysis(stats) {
    const { totalWinRate, mapStats, matchHistory, agentStats, headshots, playerName, rr, lastChange } = stats;

    const avgACS = matchHistory.reduce((acc, m) => acc + (m.acs || 0), 0) / (matchHistory.length || 1);
    const avgKDR = matchHistory.reduce((acc, m) => acc + parseFloat(m.kd || 0), 0) / (matchHistory.length || 1);
    const avgHS = headshots || 15;
    const lastMatch = matchHistory[0];

    const prompt = `
    Sen bilgelik dolu, teşvik edici ve profesyonel bir Valorant mentörüsün. Oyuncunun adı ${playerName}. 
    Aşağıdaki istatistiklere bakarak oyuncuya gelişim odaklı, ilham verici ve yapıcı bir analiz yap. 
    Lütfen sadece JSON formatında cevap ver.
    
    Karakterin: Sert bir komutan değil, oyuncunun potansiyelini açığa çıkarmaya çalışan usta bir yol göstericisin. Hataları "başarısızlık" olarak değil, "gelişim fırsatı" olarak sun.

    İstatistikler:
    - Genel Headshot: %${avgHS}
    - Genel Galibiyet Oranı: %${totalWinRate}
    - Ortalama ACS: ${avgACS}
    - Ortalama KDA: ${avgKDR}
    - Mevcut Rank: ${stats.rank} (${rr} RR)
    - Son Maç: ${lastMatch ? `${lastMatch.mapName} haritasında ${lastMatch.kills}/${lastMatch.deaths}/${lastMatch.assists} oynadı ve ${lastMatch.won ? 'Kazandı' : 'Kaybetti'}` : 'Veri yok'}
    - En çok oynanan ajanlar: ${agentStats.map(a => `${a.name} (%${a.winRate} WR)`).join(', ')}

    JSON Formatı şu şekilde olmalı:
    {
        "insights": [
            {"type": "CRITICAL_ERROR/STRENGTH/MAP_TRAINING", "title": "Başlık", "content": "Destekleyici gelişim yorumu", "severity": "high/medium/low"}
        ],
        "badges": [{"id": "unique_id", "label": "Kısa Etiket", "color": "primary/blue-400/amber-500"}],
        "pulseData": [{"x": 0, "y": 10, "won": true}],
        "nextMission": {"title": "Gelişim Hedefi", "goal": "Harekete Geçirici Adım", "reward": "Kazanım/Odül"},
        "latestMatchReport": {
            "map": "Harita",
            "stats": "K/D/A",
            "positives": ["Başarıyla uygulanan hamle 1", "2"],
            "negatives": ["Geliştirilmesi gereken nokta 1", "2"],
            "solution": "Bir sonraki maç için ustalık tavsiyesi"
        },
        "strategicErrors": [
            {"title": "Gelişim Fırsatı", "desc": "Bu noktayı geliştirerek daha iyi bir sürpriz yapabilirsin.", "impact": "Yüksek/Orta", "color": "primary"}
        ],
        "strategicAdjustments": [
            {"label": "Kategori", "value": "Öneri", "status": "DURUM", "desc": "Nasıl uygulanır?"}
        ],
        "metrics": {
            "stability": "0-100 arası sayı",
            "neuralLoad": "0-100 arası sayı"
        }
    }
    Yorumlarında oyuncuya güven ver ve ona bir şampiyon gibi hissettir. Sadece JSON döndür.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Temizleme: Gemini bazen markdown blokları içinde döndürebiliyor
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const aiData = JSON.parse(text);

        // pulseData'yı biz garantiye alalım (isteğe bağlı Gemini'ye bırakabilirsin ama veri bizde daha taze)
        aiData.pulseData = matchHistory.slice(0, 10).reverse().map((m, i) => ({
            x: i,
            y: (m.kills / (m.deaths || 1)) * 10,
            won: m.won
        }));

        return aiData;
    } catch (error) {
        console.error("[GEMINI ERROR]", error);
        // Fallback to basic analysis if Gemini fails
        return {
            insights: [{ type: 'STRENGTH', title: 'Veri Senkronizasyonu Aktif', content: 'Mentörün senin verilerini inceliyor, harika bir rapor hazırlıyor...', severity: 'low' }],
            badges: [{ id: 'active', label: 'NEURAL FOCUS', color: 'zinc-400' }],
            pulseData: matchHistory.slice(0, 10).reverse().map((m, i) => ({ x: i, y: 10, won: true })),
            nextMission: { title: 'YOLCULUĞUNA BAŞLA', goal: 'İlk verilerini analiz ettir', reward: 'Ustalık Puanı' }
        };
    }
}


if (!IS_VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;

