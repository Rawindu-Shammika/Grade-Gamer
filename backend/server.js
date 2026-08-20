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

// Helper to parse OpenDota rank_tier integer into human-readable Dota rank string
const parseDotaRank = (rankTier, leaderboardRank) => {
  if (!rankTier && !leaderboardRank) return 'UNRATED';

  // Any tier 80 or above is IMMORTAL
  const tierNum = Number(rankTier) || 0;
  if (tierNum >= 80 || leaderboardRank) {
    return leaderboardRank ? `IMMORTAL #${leaderboardRank}` : 'IMMORTAL';
  }

  const medalTier = Math.floor(tierNum / 10);
  const stars = tierNum % 10;

  const MEDALS = {
    1: 'HERALD',
    2: 'GUARDIAN',
    3: 'CRUSADER',
    4: 'ARCHON',
    5: 'LEGEND',
    6: 'ANCIENT',
    7: 'DIVINE',
    8: 'IMMORTAL'
  };

  const medalName = MEDALS[medalTier] || 'UNRATED';
  if (medalName === 'UNRATED') return 'UNRATED';
  if (stars === 0) return medalName;

  return `${medalName} ${stars}`;
};

// Calculate normalized Dota 2 Performance Score (0 - 100)
const calculateDotaPerformanceScore = (match, hasWon) => {
  const kills = match.kills || 0;
  const deaths = Math.max(1, match.deaths || 1);
  const assists = match.assists || 0;
  const kda = (kills + assists) / deaths;

  const gpm = match.gold_per_min || 0;
  const xpm = match.xp_per_min || 0;

  // Normalized scoring components
  const gpmScore = Math.min(35, (gpm / 700) * 35);
  const kdaScore = Math.min(35, (kda / 4.0) * 35);
  const xpmScore = Math.min(20, (xpm / 750) * 20);
  const winBonus = hasWon ? 10 : 0;

  const totalScore = parseFloat((gpmScore + kdaScore + xpmScore + winBonus).toFixed(1));
  return Math.min(100, Math.max(10, totalScore));
};

// ----------------------------------------------------
// DOTA 2 OPENDOTA API SYNC ROUTE
// ----------------------------------------------------
app.post('/api/sync-dota2', async (req, res) => {
  const { userId, gameTitle = 'Dota 2', accountId } = req.body;

  if (!userId || !accountId) {
    return res.status(400).json({ error: 'User ID and 32-bit Steam Account ID (Friend ID) are required.' });
  }

  const cleanAccountId = accountId.toString().trim();

  try {
    // 1. Permanent Account Binding Check (Profile Guardrail) using steam_id
    const { data: userProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('steam_id, username')
      .eq('id', userId)
      .single();

    if (userProfile?.steam_id) {
      if (userProfile.steam_id.toString() !== cleanAccountId) {
        return res.status(403).json({
          error: `Access Denied: Your GradeGamer profile is permanently bound to Steam Account ID ${userProfile.steam_id}. Multi-account switching is prohibited.`
        });
      }
    }

    // 1.5 Fetch player details from OpenDota players profile API
    let competitiveRank = 'UNRATED';
    let avatarUrl = null;
    let personaname = null;
    try {
      const playerProfileRes = await fetch(`https://api.opendota.com/api/players/${cleanAccountId}`);
      if (playerProfileRes.ok) {
        const playerProfileData = await playerProfileRes.json();
        const rankTier = playerProfileData?.rank_tier;
        const leaderboardRank = playerProfileData?.leaderboard_rank;
        competitiveRank = parseDotaRank(rankTier, leaderboardRank);
        console.log(`[Dota 2 Rank Debug] Account: ${cleanAccountId}, rank_tier: ${rankTier}, leaderboard: ${leaderboardRank} -> Parsed: ${competitiveRank}`);
        avatarUrl = playerProfileData?.profile?.avatarfull || null;
        personaname = playerProfileData?.profile?.personaname || null;
      }
    } catch (profErr) {
      console.warn('[OpenDota Profile Fetch Warning]:', profErr.message);
    }

    // 2. Query OpenDota API for recent matches
    const url = `https://api.opendota.com/api/players/${cleanAccountId}/recentMatches`;
    console.log(`[OpenDota API Request]: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GradeGamer-Telemetry/1.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `OpenDota API request failed with status ${response.status}` });
    }

    const matches = await response.json();

    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(404).json({ error: 'No recent Dota 2 matches found or player profile is set to private in Steam/Dota settings.' });
    }

    const latestMatch = matches[0];
    const matchId = latestMatch.match_id?.toString();

    if (!matchId) {
      return res.status(400).json({ error: 'Could not extract valid match ID from OpenDota response.' });
    }

    // 3. Duplicate Ingestion Check
    const { data: existingRecords, error: checkError } = await supabase
      .from('dota2_match_telemetry')
      .select('id, metrics_payload')
      .eq('user_id', userId)
      .eq('metrics_payload->>match_id', matchId);

    if (checkError) {
      console.warn('[Dota 2 Duplicate Check Warning]:', checkError.message);
    }

    if (existingRecords && existingRecords.length > 0) {
      return res.status(409).json({
        error: `Dota 2 Match #${matchId} has already been ingested. Play a new match to pull fresh telemetry.`
      });
    }

    // 4. Metric Extraction & Calculation
    const kills = latestMatch.kills || 0;
    const deaths = Math.max(1, latestMatch.deaths || 1);
    const assists = latestMatch.assists || 0;
    const kda = Number(((kills + assists) / deaths).toFixed(2));
    
    const gpm = latestMatch.gold_per_min || 0;
    const xpm = latestMatch.xp_per_min || 0;
    const durationSeconds = latestMatch.duration || 1800;
    const durationMinutes = parseFloat((durationSeconds / 60).toFixed(1));
    const heroDamage = latestMatch.hero_damage || 0;
    const towerDamage = latestMatch.tower_damage || 0;
    const lastHits = latestMatch.last_hits || 0;

    // Slot 0-127 = Radiant (Team 2), Slot 128-255 = Dire (Team 3)
    const isRadiant = latestMatch.player_slot < 128;
    const radiantWin = latestMatch.radiant_win;
    const hasWon = (isRadiant && radiantWin) || (!isRadiant && !radiantWin);

    // GradeGamer Performance Score P
    const performanceScore = calculateDotaPerformanceScore(latestMatch, hasWon);

    const payload = {
      match_id: matchId,
      outcome: hasWon ? 'VICTORY' : 'DEFEAT',
      team: isRadiant ? 'Radiant' : 'Dire',
      duration_minutes: durationMinutes,
      game_length_in_seconds: durationSeconds,
      hero_id: latestMatch.hero_id,
      game_mode: latestMatch.game_mode,
      kills,
      deaths,
      assists,
      kda,
      gpm,
      xpm,
      last_hits: lastHits,
      hero_damage: heroDamage,
      tower_damage: towerDamage,
      account_id: cleanAccountId,
      source: 'OPENDOTA_API',
      competitive_rank: competitiveRank,
      avatar: avatarUrl,
      personaname: personaname,
      performance_score: performanceScore
    };

    // 5. Insert Unique Record into Supabase (using dota2_match_telemetry table)
    const { data: inserted, error: dbError } = await supabase
      .from('dota2_match_telemetry')
      .insert({
        user_id: userId,
        game_title: gameTitle,
        ingestion_type: 'AUTOMATED_API',
        performance_score: performanceScore,
        metrics_payload: payload
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Dota 2 Supabase Insert Error]:', dbError);
      throw dbError;
    }

    console.log(`✅ Stored in dota2_match_telemetry: ${inserted.id}`);

    // 6. Bind Account ID and avatar to profile on successful sync
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          dota2_rank: competitiveRank,
          dota2_account_id: cleanAccountId,
          steam_id: cleanAccountId,
          steam_avatar_url: avatarUrl || userProfile?.steam_avatar_url
        })
        .eq('id', userId);

      if (updateErr) throw updateErr;
      console.log(`🔒 Bound user ${userId} to Steam ID ${cleanAccountId} with Dota 2 custom fields`);
    } catch (err) {
      console.warn('[Dota 2 Profiles Custom Columns Failed, falling back to standard columns]:', err.message);
      await supabase
        .from('profiles')
        .update({ 
          steam_id: cleanAccountId,
          steam_avatar_url: avatarUrl || userProfile?.steam_avatar_url
        })
        .eq('id', userId);
      console.log(`🔒 Bound user ${userId} to Steam ID ${cleanAccountId} and Avatar (fallback path)`);
    }

    console.log(`✅ Ingested Dota 2 Match (${matchId}) for Account ${cleanAccountId} - Score: ${performanceScore}`);
    return res.json({ success: true, record: inserted, payload, performanceScore });

  } catch (err) {
    console.error('[Dota 2 Sync Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during Dota 2 sync' });
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
