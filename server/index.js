const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'v-insight-neural-ultra-secret-key-2026';
let db;

const app = express();
const PORT = process.env.PORT || 3001;
const IS_VERCEL = process.env.VERCEL || process.env.NOW_REGION;

app.use(cors());
app.use(express.json());

// Database Initialization
(async () => {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    db = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
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
        console.log('[DB] Neon PostgreSQL Ready.');
    } catch (error) {
        console.error('[DB ERROR]', error);
    }
})();

const HENRIK_BASE_URL = 'https://api.henrikdev.xyz/valorant';
const getHeaders = () => ({ 'Authorization': process.env.HENRIK_API_KEY || 'HDEV-1c7034a2-f257-4c38-8814-d5f4b8c6149a' });

app.get('/', (req, res) => res.send('V-INSIGHT API OPERATIONAL'));

// AUTH ENDPOINTS
app.post('/api/auth/register', async (req, res) => {
    const { username, password, riotId } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password, riotId) VALUES ($1, $2, $3)', [username, hashedPassword, riotId]);
        res.json({ success: true });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Auth failed' });
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, riotId: user.riotid, isPremium: user.ispremium } });
    } catch (e) { res.status(500).json({ error: 'Login failed' }); }
});

app.get('/api/auth/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await db.query('SELECT id, username, riotid, ispremium FROM users WHERE id = $1', [decoded.id]);
        res.json(result.rows[0]);
    } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
});

app.post('/api/auth/upgrade', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await db.query('UPDATE users SET isPremium = 1 WHERE id = $1', [decoded.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Upgrade failed' }); }
});

// MATCH DETAIL
app.get('/api/match-detail/:region/:matchId', async (req, res) => {
    const { region, matchId } = req.params;
    try {
        const r = await axios.get(`${HENRIK_BASE_URL}/v2/match/${matchId}`, { headers: getHeaders() });
        const match = r.data?.data;
        if (!match) return res.status(404).json({ error: 'Not found' });

        // v2/match uses all_players with .team property (not team_id)
        const meta = match.metadata;
        const roundsPlayed = meta?.rounds_played || 20;

        const parseTeam = (teamKey) => {
            const players = match.players?.all_players || [];
            return players
                .filter(p => p.team?.toLowerCase() === teamKey || p.team_id?.toLowerCase() === teamKey)
                .map(p => {
                    const stats = p.stats || {};
                    const assets = p.assets || {};
                    const shots = (stats.headshots || 0) + (stats.bodyshots || 0) + (stats.legshots || 0) || 1;
                    return {
                        puuid: p.puuid,
                        name: p.name,
                        tag: p.tag,
                        agent: p.character,
                        agentIcon: assets.agent?.small || `https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png`,
                        rank: p.currenttier_patched || 'Unranked',
                        rankIcon: `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${p.currenttier || 0}/largeicon.png`,
                        acs: Math.round((stats.score || 0) / roundsPlayed),
                        kills: stats.kills || 0,
                        deaths: stats.deaths || 0,
                        assists: stats.assists || 0,
                        kd: ((stats.kills || 0) / (stats.deaths || 1)).toFixed(2),
                        hsPercent: Math.round(((stats.headshots || 0) / shots) * 100)
                    };
                })
                .sort((a, b) => b.acs - a.acs);
        };

        const teams = match.teams || {};
        res.json({
            matchId: meta?.match_id || matchId,
            map: meta?.map || 'Unknown',
            mode: meta?.mode || 'Competitive',
            duration: meta?.game_length_ms || 0,
            redScore: teams.red?.rounds_won ?? 0,
            blueScore: teams.blue?.rounds_won ?? 0,
            redWon: teams.red?.has_won ?? false,
            blueWon: teams.blue?.has_won ?? false,
            redPlayers: parseTeam('red'),
            bluePlayers: parseTeam('blue')
        });
    } catch (e) {
        console.error('[MATCH DETAIL ERROR]', e.message, e.response?.data);
        res.status(500).json({ error: e.message });
    }
});

// FULL STATS & AI ANALYSIS
app.get('/api/stats-full/:name/:tag', async (req, res) => {
    const { name, tag } = req.params;
    try {
        const accRes = await axios.get(`${HENRIK_BASE_URL}/v1/account/${name}/${tag}`, { headers: getHeaders() });
        const accountData = accRes.data.data;
        const puuid = accountData.puuid;
        const region = accountData.region || 'eu';

        let rank = "Unranked", rankIcon = "", rr = 0, lastChange = 0;
        try {
            const mmrRes = await axios.get(`${HENRIK_BASE_URL}/v2/by-puuid/mmr/${region}/${puuid}`, { headers: getHeaders() });
            const currentData = mmrRes.data?.data?.current_data;
            if (currentData) {
                rank = currentData.currenttierpatched || "Unranked";
                rankIcon = currentData.images?.large || "";
                rr = currentData.ranking_in_tier || 0;
                lastChange = currentData.mmr_change_to_last_game || 0;
            }
        } catch (e) { }

        const matchRes = await axios.get(`${HENRIK_BASE_URL}/v3/matches/${region}/${name}/${tag}`, { headers: getHeaders() });
        const matches = matchRes.data.data;
        const stats = calculateSafeStats(matches, puuid, region);

        const aiAnalysis = await generateAIAnalysis({ ...stats, playerName: name, rank });

        res.json({
            playerName: `${name}#${tag}`,
            puuid,
            level: accountData.account_level,
            card: accountData.card.small,
            rank, rr, lastChange, rankIcon,
            ...stats,
            aiAnalysis
        });
    } catch (error) {
        res.status(500).json({ error: "API Fail" });
    }
});

function calculateSafeStats(matches, puuid, region) {
    let totalWins = 0, totalHeadshots = 0, totalBodyshots = 0, totalLegshots = 0;
    const matchHistory = [];
    const agentStatsMap = new Map();
    const mapStatsMap = new Map();

    matches.slice(0, 15).forEach(match => {
        const p = match.players.all_players.find(x => x.puuid === puuid);
        if (!p) return;
        const teamSide = p.team.toLowerCase();
        const won = match.teams[teamSide].has_won;
        if (won) totalWins++;

        totalHeadshots += p.stats.headshots;
        totalBodyshots += p.stats.bodyshots;
        totalLegshots += p.stats.legshots;

        const shots = p.stats.headshots + p.stats.bodyshots + p.stats.legshots || 1;

        matchHistory.push({
            matchId: match.metadata.match_id,
            region: region,
            mapName: match.metadata.map,
            won,
            kills: p.stats.kills,
            deaths: p.stats.deaths,
            assists: p.stats.assists,
            acs: Math.round(p.stats.score / match.metadata.rounds_played),
            kd: (p.stats.kills / (p.stats.deaths || 1)).toFixed(2),
            hsPercent: Math.round((p.stats.headshots / shots) * 100),
            agentId: p.character,
            agentImage: p.assets?.agent?.small || "",
            timestamp: new Date(match.metadata.game_start_patched).getTime() || Date.now(),
            teamRedScore: match.teams.red.rounds_won,
            teamBlueScore: match.teams.blue.rounds_won,
            playerTeam: teamSide
        });

        if (!agentStatsMap.has(p.character)) agentStatsMap.set(p.character, { id: p.character, name: p.character, wins: 0, total: 0, kills: 0, deaths: 0 });
        const as = agentStatsMap.get(p.character);
        as.total++; if (won) as.wins++; as.kills += p.stats.kills; as.deaths += p.stats.deaths;

        if (!mapStatsMap.has(match.metadata.map)) mapStatsMap.set(match.metadata.map, { name: match.metadata.map, wins: 0, matches: 0, attackWins: 0, attackTotal: 0, defenseWins: 0, defenseTotal: 0 });
        const ms = mapStatsMap.get(match.metadata.map);
        ms.matches++; if (won) ms.wins++;

        // Simple round calc for radar
        (match.rounds || []).forEach((r, idx) => {
            const isAttack = (teamSide === 'red' && idx < 12) || (teamSide === 'blue' && idx >= 12);
            const roundWon = r.winning_team?.toLowerCase() === teamSide;
            if (isAttack) { ms.attackTotal++; if (roundWon) ms.attackWins++; }
            else { ms.defenseTotal++; if (roundWon) ms.defenseWins++; }
        });
    });

    const totalShots = totalHeadshots + totalBodyshots + totalLegshots || 1;
    return {
        totalWinRate: Math.round((totalWins / (matches.length || 1)) * 100),
        headshots: Math.round((totalHeadshots / totalShots) * 100),
        headshotPct: Math.round((totalHeadshots / totalShots) * 100),
        bodyshotPct: Math.round((totalBodyshots / totalShots) * 100),
        legshotPct: Math.round((totalLegshots / totalShots) * 100),
        matchHistory,
        agentStats: Array.from(agentStatsMap.values()).map(a => ({
            id: a.id, name: a.name, totalCount: a.total, winRate: Math.round((a.wins / a.total) * 100), avgKDA: (a.kills / (a.deaths || 1)).toFixed(2)
        })).sort((a, b) => b.totalCount - a.totalCount),
        mapStats: Array.from(mapStatsMap.values()).map(m => ({
            name: m.name, wins: m.wins, matches: m.matches, winRate: Math.round((m.wins / m.matches) * 100),
            attackWinRate: m.attackTotal > 0 ? Math.round((m.attackWins / m.attackTotal) * 100) : 50,
            defenseWinRate: m.defenseTotal > 0 ? Math.round((m.defenseWins / m.defenseTotal) * 100) : 50
        }))
    };
}

async function generateAIAnalysis(stats) {
    const { totalWinRate, matchHistory, headshots, playerName, rank } = stats;
    const avgACS = matchHistory.reduce((acc, m) => acc + m.acs, 0) / (matchHistory.length || 1);
    const avgHS = headshots || 15;
    const stability = Math.min(100, (totalWinRate * 0.6) + (avgHS * 1.2)).toFixed(1);
    const neuralLoad = Math.min(100, (avgACS / 4) + 20).toFixed(1);

    const prompt = `Analiz et: ${playerName}, Rank: ${rank}, HS: %${avgHS}, WinRate: %${totalWinRate}. Profesyonel mentor gibi JSON dön (insights, badges, nextMission, latestMatchReport).`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            { contents: [{ parts: [{ text: prompt + " Sadece JSON döndür." }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );

        let text = response.data.candidates[0].content.parts[0].text;
        text = text.trim().replace(/```json/g, '').replace(/```/g, '').trim();
        const aiData = JSON.parse(text);

        return {
            ...aiData,
            metrics: { stability, neuralLoad },
            pulseData: matchHistory.slice(0, 10).reverse().map((m, i) => ({ x: i, y: parseFloat(m.kd) * 10, won: m.won }))
        };
    } catch (e) {
        return {
            insights: [{ type: 'STRENGTH', title: 'Veri Akışı Sağlandı', content: 'Mentörün senin için en güncel verileri topluyor...', severity: 'low' }],
            badges: [{ label: 'NEURAL FOCUS', color: 'primary' }],
            nextMission: { title: 'DİSİPLİN', goal: 'Öğrenmeye devam et', reward: 'XP' },
            latestMatchReport: {
                map: matchHistory[0]?.mapName || 'Bind',
                stats: `${matchHistory[0]?.kills}/${matchHistory[0]?.deaths}`,
                positives: ['Pozitif yaklaşım'], negatives: ['Odak kaybı'], solution: 'Sakin kal.'
            },
            metrics: { stability, neuralLoad },
            pulseData: matchHistory.slice(0, 10).reverse().map((m, i) => ({ x: i, y: 10, won: true }))
        };
    }
}

if (!IS_VERCEL) app.listen(PORT, () => console.log(`Server on ${PORT}`));
module.exports = app;
