import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './src/config/supabase.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// VALORANT API SYNC ROUTE (100% UNTOUCHED & PROTECTED)
// ----------------------------------------------------
app.post('/api/sync-valorant', async (req, res) => {
  const { userId, gameTitle = 'Valorant', gamerTag, tagLine, region = 'ap' } = req.body;

  if (!userId || !gamerTag || !tagLine) {
    return res.status(400).json({ error: 'GamerTag and TagLine are required.' });
  }

  const apiKey = (process.env.HENRIK_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'HENRIK_API_KEY is not defined in backend/.env' });
  }

  const cleanName = gamerTag.trim();
  const cleanTag = tagLine.replace('#', '').trim();
  const encodedName = encodeURIComponent(cleanName);
  const encodedTag = encodeURIComponent(cleanTag);

  try {
    const { data: userProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('valorant_ign, valorant_tag')
      .eq('id', userId)
      .single();

    if (userProfile?.valorant_ign && userProfile?.valorant_tag) {
      const boundHandle = `${userProfile.valorant_ign}#${userProfile.valorant_tag}`.toLowerCase();
      const inputHandle = `${cleanName}#${cleanTag}`.toLowerCase();

      if (boundHandle !== inputHandle) {
        return res.status(403).json({
          error: `Access Denied: Your GradeGamer profile is permanently bound to ${userProfile.valorant_ign}#${userProfile.valorant_tag}. Multi-account switching is prohibited.`
        });
      }
    }

    const url = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodedName}/${encodedTag}?mode=competitive&size=1`;
    console.log(`[HenrikDev API Request]: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'GradeGamer-Telemetry/1.0'
      }
    });

    const data = await response.json();

    if (!response.ok || data.status !== 200 || !data.data || data.data.length === 0) {
      const errMsg = data.errors?.[0]?.message || data.message || `Match lookup failed with status ${response.status}`;
      return res.status(response.status === 200 ? 404 : response.status).json({ error: errMsg });
    }

    const latestMatch = data.data[0];
    const matchId = latestMatch.metadata?.matchid || latestMatch.metadata?.match_id;

    if (!matchId) {
      return res.status(400).json({ error: 'Could not extract valid match ID from response.' });
    }

    // Duplicate Check
    const { data: existingRecords, error: checkError } = await supabase
      .from('valorant_match_telemetry')
      .select('id, metrics_payload')
      .eq('user_id', userId)
      .eq('metrics_payload->>match_id', matchId);

    if (checkError) {
      console.warn('[Duplicate Check Warning]:', checkError.message);
    }

    if (existingRecords && existingRecords.length > 0) {
      return res.status(409).json({
        error: `Match on ${latestMatch.metadata?.map || 'this map'} has already been ingested. Play a new match to pull fresh telemetry.`
      });
    }

    const allPlayers = latestMatch.players?.all_players || [];
    const player = allPlayers.find(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    ) || allPlayers[0];

    if (!player) {
      return res.status(404).json({ error: `Player ${cleanName} not found in recent match packet.` });
    }

    const roundsPlayed = Math.max(1, latestMatch.metadata?.rounds_played || 20);
    const playerTeamKey = (player.team || 'red').toLowerCase();
    const teamData = latestMatch.teams?.[playerTeamKey] || {};
    const hasWon = teamData.has_won ?? false;
    const roundsWon = teamData.rounds_won ?? 13;
    const roundsLost = teamData.rounds_lost ?? 10;

    const kills = player.stats?.kills || 0;
    const deaths = Math.max(1, player.stats?.deaths || 1);
    const assists = player.stats?.assists || 0;
    const score = player.stats?.score || (kills * 150);

    const acs = Math.round(score / roundsPlayed);
    const kd = Number((kills / deaths).toFixed(2));
    const headshots = player.stats?.headshots || 0;
    const bodyshots = player.stats?.bodyshots || 0;
    const legshots = player.stats?.legshots || 0;
    const totalShots = Math.max(1, headshots + bodyshots + legshots);
    const hsPct = Number(((headshots / totalShots) * 100).toFixed(1));

    const performanceScore = Number(((acs / 350) * 60 + (kd / 2.0) * 40).toFixed(1));

    const payload = {
      match_id: matchId,
      outcome: hasWon ? 'VICTORY' : 'DEFEAT',
      score_rounds: `${roundsWon} : ${roundsLost}`,
      rounds_won: roundsWon,
      rounds_lost: roundsLost,
      map: latestMatch.metadata?.map || 'Competitive Arena',
      mode: latestMatch.metadata?.mode || 'Competitive',
      agent: player.character || 'Reyna',
      acs,
      kd,
      hs_percentage: hsPct,
      rank: player.currenttier_patched || 'Platinum 2',
      elo: player.ranking_in_tier || 50,
      kills,
      deaths,
      assists,
      gamer_handle: `${cleanName}#${cleanTag}`,
      source: 'HENRIK_VALORANT_API'
    };

    const { data: inserted, error: dbError } = await supabase
      .from('valorant_match_telemetry')
      .insert({
        user_id: userId,
        game_title: gameTitle,
        ingestion_type: 'AUTOMATED_API',
        performance_score: performanceScore,
        metrics_payload: payload
      })
      .select()
      .single();

    if (dbError) throw dbError;

    if (!userProfile?.valorant_ign) {
      await supabase
        .from('profiles')
        .update({ valorant_ign: cleanName, valorant_tag: cleanTag })
        .eq('id', userId);
      console.log(`🔒 Permanently bound user ${userId} to ${cleanName}#${cleanTag}`);
    }

    console.log(`✅ Ingested unique match (${matchId}) for ${cleanName}#${cleanTag} - Score: ${performanceScore}`);
    return res.json({ success: true, record: inserted, payload, performanceScore });
  } catch (err) {
    console.error('[Sync Route Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during sync' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime()
  });
});

app.listen(port, () => {
  console.log(`[Express API] Server running on http://localhost:${port}`);
});
