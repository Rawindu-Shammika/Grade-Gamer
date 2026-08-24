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
          dota2_rank: competitiveRank || 'UNRATED',
          dota2_steam_id: String(cleanAccountId).trim(),
          steam_id: String(cleanAccountId).trim(),
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
          steam_id: String(cleanAccountId).trim(),
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

// Helper to fetch real LoL Rank by PUUID from Riot League-v4 API
async function fetchLolRank(puuid, regionRouting, riotApiKey) {
  try {
    const platformMap = {
      sea: 'sg2',
      americas: 'na1',
      europe: 'euw1',
      asia: 'kr'
    };
    const platform = platformMap[regionRouting?.toLowerCase()] || regionRouting || 'sg2';

    // 1. Query League entries by PUUID
    const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    const leagueRes = await fetch(leagueUrl, {
      headers: {
        'X-Riot-Token': riotApiKey,
        'Accept': 'application/json'
      }
    });

    if (!leagueRes.ok) {
      // Fallback with super-region if platform rejected
      const directUrl = `https://${regionRouting}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
      const directRes = await fetch(directUrl, {
        headers: {
          'X-Riot-Token': riotApiKey,
          'Accept': 'application/json'
        }
      });
      if (!directRes.ok) return 'UNRATED';
      const directEntries = await directRes.json();
      if (!Array.isArray(directEntries) || directEntries.length === 0) return 'UNRATED';
      const target = directEntries.find(e => e.queueType === 'RANKED_SOLO_5x5') || directEntries[0];
      return target?.tier ? `${target.tier} ${target.rank} (${target.leaguePoints} LP)` : 'UNRATED';
    }

    const entries = await leagueRes.json();
    if (!Array.isArray(entries) || entries.length === 0) return 'UNRATED';

    // 2. Prioritize Solo/Duo over Flex
    const soloEntry = entries.find(e => e.queueType === 'RANKED_SOLO_5x5');
    const flexEntry = entries.find(e => e.queueType === 'RANKED_FLEX_SR');
    const target = soloEntry || flexEntry || entries[0];

    if (!target || !target.tier) return 'UNRATED';

    return `${target.tier} ${target.rank} (${target.leaguePoints} LP)`;
  } catch (err) {
    console.warn('[LoL Rank Fetch Warning]:', err.message);
    return 'UNRATED';
  }
}

// ----------------------------------------------------
// LEAGUE OF LEGENDS RIOT API SYNC ROUTE
// ----------------------------------------------------
app.post('/api/sync-lol', async (req, res) => {
  try {
    const { userId, riotId, gameName: rawGameName, tagLine: rawTagLine, region = 'asia' } = req.body;
    const riotApiKey = process.env.RIOT_API_KEY;

    let gameName = rawGameName;
    let tagLine = rawTagLine;

    if (riotId && riotId.includes('#')) {
      const parts = riotId.split('#');
      gameName = parts[0];
      tagLine = parts[1];
    }

    if (!userId || !gameName || !tagLine) {
      return res.status(400).json({ error: 'Valid Riot ID (GameName#TagLine) and userId are required.' });
    }

    if (!riotApiKey) {
      return res.status(500).json({ error: 'Riot API key is missing in server environment.' });
    }

    // Determine correct Riot Regional & Platform Routing
    const cleanRegion = (region || 'asia').toLowerCase().trim();
    const accountRouting = (cleanRegion === 'kr' || cleanRegion === 'jp' || cleanRegion === 'asia') 
      ? 'asia' 
      : (cleanRegion === 'na' || cleanRegion === 'br' || cleanRegion === 'lan' || cleanRegion === 'las' || cleanRegion === 'americas' 
        ? 'americas' 
        : (cleanRegion === 'euw' || cleanRegion === 'eune' || cleanRegion === 'europe' 
          ? 'europe' 
          : 'sea'));
    const platformRouting = cleanRegion === 'asia' ? 'kr' : cleanRegion;

    // 1. Resolve PUUID via ACCOUNT-V1
    const accountUrl = `https://${accountRouting}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const accountRes = await fetch(accountUrl, { headers: { 'X-Riot-Token': riotApiKey } });

    if (!accountRes.ok) {
      const errText = await accountRes.text();
      return res.status(accountRes.status).json({ error: `Riot Account lookup failed on region [${accountRouting.toUpperCase()}]: ${errText}` });
    }

    const accountData = await accountRes.json();
    const puuid = accountData.puuid;

    // 2. Fetch Real Rank via LEAGUE-V4 API
    const realLolRank = await fetchLolRank(puuid, platformRouting, riotApiKey);

    // 3. Fetch Latest Match ID via MATCH-V5
    const matchesUrl = `https://${accountRouting}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`;
    const matchesRes = await fetch(matchesUrl, { headers: { 'X-Riot-Token': riotApiKey } });
    const matchIds = await matchesRes.json();

    if (!matchIds || matchIds.length === 0) {
      return res.status(404).json({ error: 'No recent League of Legends matches found for this account.' });
    }

    const latestMatchId = matchIds[0];

    // 4. Duplicate Check in lol_match_telemetry
    const { data: existingRecords } = await supabase
      .from('lol_match_telemetry')
      .select('id')
      .eq('user_id', userId)
      .eq('metrics_payload->>match_id', latestMatchId);

    if (existingRecords && existingRecords.length > 0) {
      return res.status(409).json({ error: `Match #${latestMatchId} has already been ingested.` });
    }

    // 5. Fetch Match Details via MATCH-V5
    const matchDetailUrl = `https://${accountRouting}.api.riotgames.com/lol/match/v5/matches/${latestMatchId}`;
    const matchDetailRes = await fetch(matchDetailUrl, { headers: { 'X-Riot-Token': riotApiKey } });
    const matchData = await matchDetailRes.json();

    const participant = matchData?.info?.participants?.find(p => p.puuid === puuid);
    if (!participant) {
      return res.status(404).json({ error: 'Participant telemetry not found in match payload.' });
    }

    // 6. Calculate Standard Performance Score (0 - 100)
    const kills = participant.kills || 0;
    const deaths = Math.max(1, participant.deaths || 1);
    const assists = participant.assists || 0;
    const kda = (kills + assists) / deaths;
    const cs = (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
    const durationMin = Math.max(1, (matchData.info?.gameDuration || 1800) / 60);
    const csPerMin = cs / durationMin;

    const kdaScore = Math.min(40, (kda / 4.0) * 40);
    const csScore = Math.min(30, (csPerMin / 8.0) * 30);
    const kpScore = Math.min(20, ((participant.challenges?.killParticipation || 0.4) / 0.7) * 20);
    const winBonus = participant.win ? 10 : 0;
    const performanceScore = parseFloat(Math.min(100, Math.max(10, kdaScore + csScore + kpScore + winBonus)).toFixed(1));

    // 7. Structure Payload & Save to Supabase
    const payload = {
      match_id: latestMatchId,
      champion_id: participant.championId,
      champion_name: participant.championName,
      outcome: participant.win ? 'VICTORY' : 'DEFEAT',
      role: participant.teamPosition || participant.individualPosition || 'UNKNOWN',
      rank: realLolRank,
      competitive_rank: realLolRank,
      kills,
      deaths: participant.deaths || 0,
      assists,
      kda: parseFloat(kda.toFixed(2)),
      cs,
      cs_per_min: parseFloat(csPerMin.toFixed(1)),
      gold_earned: participant.goldEarned || 0,
      vision_score: participant.visionScore || 0,
      duration_minutes: parseFloat(durationMin.toFixed(1)),
      riot_id: `${accountData.gameName || gameName}#${accountData.tagLine || tagLine}`,
      puuid,
      region: cleanRegion.toUpperCase(),
      performance_score: performanceScore
    };

    const { data: inserted, error: insertError } = await supabase
      .from('lol_match_telemetry')
      .insert({
        user_id: userId,
        game_title: 'League of Legends',
        ingestion_type: 'AUTOMATED_API',
        performance_score: performanceScore,
        metrics_payload: payload
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update Profile with bound Riot ID, PUUID, real rank, and region
    const fullRiotId = `${accountData.gameName || gameName}#${accountData.tagLine || tagLine}`.trim();
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        lol_riot_id: fullRiotId,
        lol_puuid: puuid || null,
        lol_rank: realLolRank,
        lol_region: cleanRegion.toUpperCase()
      })
      .eq('id', userId);

    if (profileErr) {
      console.error('[LoL Profile Update Failed]:', profileErr.message);
      await supabase
        .from('profiles')
        .update({ lol_puuid: puuid, lol_region: cleanRegion.toUpperCase() })
        .eq('id', userId);
    }

    console.log(`✅ Stored LoL Match #${latestMatchId} in lol_match_telemetry for Region ${cleanRegion.toUpperCase()}: ${inserted.id}`);
    return res.status(200).json({ 
      success: true, 
      telemetry: inserted, 
      riotId: fullRiotId,
      gameName: accountData.gameName || gameName,
      tagLine: accountData.tagLine || tagLine,
      region: cleanRegion.toUpperCase(),
      rank: realLolRank,
      record: inserted, 
      payload, 
      performanceScore 
    });
  } catch (err) {
    console.error('[LoL Sync Route Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// ----------------------------------------------------
// COUNTER-STRIKE 2 (CS2) MANUAL TELEMETRY INGESTION ROUTE
// ----------------------------------------------------
app.post('/api/manual-entry-cs2', async (req, res) => {
  try {
    const { userId, map, outcome, rank, kills, deaths, assists, adr, hsPercent } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    const numKills = parseInt(kills, 10) || 0;
    const numDeaths = Math.max(1, parseInt(deaths, 10) || 1);
    const numAssists = parseInt(assists, 10) || 0;
    const numAdr = parseFloat(adr) || 0.0;
    const numHs = Math.min(100, Math.max(0, parseInt(hsPercent, 10) || 0));
    const selectedMap = map ? map.toUpperCase() : 'DE_MIRAGE';
    const matchOutcome = (outcome || 'VICTORY').toUpperCase();
    const competitiveRank = rank || 'PREMIER (15,000 - 19,999)';

    const kd = parseFloat((numKills / numDeaths).toFixed(2));

    // Calculate GradeGamer Standardized Performance Score (0 - 100)
    const kdScore = Math.min(45, (kd / 2.0) * 45);
    const adrScore = Math.min(35, (numAdr / 110.0) * 35);
    const hsScore = Math.min(20, (numHs / 60.0) * 20);
    const performanceScore = parseFloat(Math.min(100, Math.max(15, kdScore + adrScore + hsScore)).toFixed(1));

    const matchId = `cs2_manual_${Date.now()}`;

    const payload = {
      match_id: matchId,
      map: selectedMap.startsWith('DE_') ? selectedMap : `DE_${selectedMap}`,
      outcome: matchOutcome,
      rank: competitiveRank,
      competitive_rank: competitiveRank,
      kills: numKills,
      deaths: numDeaths,
      assists: numAssists,
      kd,
      adr: numAdr,
      hs_percent: numHs,
      performance_score: performanceScore,
      ingestion_mode: 'MANUAL_VERIFIED_ENTRY'
    };

    // Insert into Supabase
    const { data: inserted, error: insertErr } = await supabase
      .from('cs2_match_telemetry')
      .insert({
        user_id: userId,
        game_title: 'Counter-Strike 2',
        ingestion_type: 'MANUAL_ENTRY',
        performance_score: performanceScore,
        metrics_payload: payload
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Update Profile standing with chosen CS2 rank
    try {
      await supabase
        .from('profiles')
        .update({ cs2_rank: competitiveRank })
        .eq('id', userId);
    } catch (e) {
      console.warn('[CS2 Profile Rank Update Warning]:', e.message);
    }

    console.log(`✅ Stored Manual CS2 Match #${matchId} in cs2_match_telemetry: ${inserted.id}`);
    return res.status(200).json({ success: true, telemetry: inserted, record: inserted, payload, performanceScore, rank: competitiveRank });
  } catch (err) {
    console.error('[CS2 Manual Entry Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to record CS2 match.' });
  }
});

// ----------------------------------------------------
// APEX LEGENDS MANUAL TELEMETRY INGESTION ROUTE
// ----------------------------------------------------
app.post('/api/manual-entry-apex', async (req, res) => {
  try {
    const { userId, playerName, legend, outcome, rankTier, kills, deaths, assists, damage, placement } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    const cleanPlayer = (playerName || 'ApexPlayer').trim();
    const cleanLegend = (legend || 'Wraith').trim();
    const cleanOutcome = (outcome || 'CHAMPION').toUpperCase();
    const cleanRank = (rankTier || 'DIAMOND IV').toUpperCase();
    
    const k = parseInt(kills, 10) || 0;
    const d = Math.max(1, parseInt(deaths, 10) || 1);
    const a = parseInt(assists, 10) || 0;
    const dmg = parseInt(damage, 10) || 0;
    const place = Math.max(1, Math.min(20, parseInt(placement, 10) || 1));

    const kdRatio = parseFloat((k / d).toFixed(2));
    
    // Performance Rating (0 - 100 Scale)
    const combatPts = Math.min(45, (k * 4.0) + (a * 1.5));
    const damagePts = Math.min(35, (dmg / 3500) * 35);
    const placePts = Math.max(5, (21 - place) * 1.0);
    const performanceScore = parseFloat(Math.min(99.0, Math.max(20.0, combatPts + damagePts + placePts)).toFixed(1));

    const payload = {
      player_name: cleanPlayer,
      legend: cleanLegend,
      outcome: cleanOutcome,
      rank: cleanRank,
      kills: k,
      deaths: d,
      assists: a,
      kd_ratio: kdRatio,
      damage: dmg,
      placement: `#${place}`,
      ingestion_mode: 'MANUAL_PROTOCOL'
    };

    // 1. Insert into apex_match_telemetry
    const { data: inserted, error: insertErr } = await supabase
      .from('apex_match_telemetry')
      .insert({
        user_id: userId,
        game_title: 'Apex Legends',
        ingestion_type: 'MANUAL_ENTRY',
        performance_score: performanceScore,
        metrics_payload: payload
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 2. Persist Player Handle & Rank to Profiles
    try {
      await supabase
        .from('profiles')
        .update({
          apex_player_id: cleanPlayer,
          apex_rank: cleanRank
        })
        .eq('id', userId);
    } catch (e) {
      console.warn('[Apex Profile Update Warning]:', e.message);
    }

    console.log(`✅ Stored Apex Match for ${cleanPlayer} in apex_match_telemetry: ${inserted.id}`);
    return res.status(200).json({
      success: true,
      telemetry: inserted,
      rating: performanceScore,
      player: cleanPlayer,
      rank: cleanRank
    });
  } catch (err) {
    console.error('[Manual Apex Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to ingest Apex telemetry.' });
  }
});

// UNLINK APEX PROFILE
app.post('/api/unlink-apex', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    await supabase
      .from('profiles')
      .update({
        apex_player_id: null,
        apex_rank: 'UNRATED'
      })
      .eq('id', userId);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/unlink-game
app.post('/api/unlink-game', async (req, res) => {
  try {
    const { userId, gameKey } = req.body;

    if (!userId || !gameKey) {
      return res.status(400).json({ error: 'User ID and gameKey are required.' });
    }

    const key = gameKey.toLowerCase();
    let profileUpdate = {};
    let telemetryTable = '';

    if (key.includes('val')) {
      profileUpdate = { valorant_id: null, valorant_ign: null, valorant_tag: null, valorant_rank: 'UNRATED' };
      telemetryTable = 'valorant_match_telemetry';
    } else if (key.includes('dota')) {
      profileUpdate = { dota2_steam_id: null, steam_id: null, dota2_rank: 'UNRATED' };
      telemetryTable = 'dota2_match_telemetry';
    } else if (key.includes('lol') || key.includes('league')) {
      profileUpdate = { lol_puuid: null, lol_riot_id: null, lol_rank: 'UNRATED' };
      telemetryTable = 'lol_match_telemetry';
    } else if (key.includes('cs') || key.includes('counter')) {
      profileUpdate = { cs2_steam_id: null, steam_id: null, cs2_rank: 'UNRATED' };
      telemetryTable = 'cs2_match_telemetry';
    } else if (key.includes('apex')) {
      profileUpdate = { apex_player_id: null, apex_rank: 'UNRATED' };
      telemetryTable = 'apex_match_telemetry';
    }

    // 1. Update Profile in Supabase safely
    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileErr) {
        console.warn('[Unlink Profile Warning]:', profileErr.message);
        // Fallback with minimal safe columns
        if (key.includes('val')) {
          await supabase.from('profiles').update({ valorant_ign: null, valorant_tag: null }).eq('id', userId);
        } else if (key.includes('dota')) {
          await supabase.from('profiles').update({ steam_id: null }).eq('id', userId);
        } else if (key.includes('lol') || key.includes('league')) {
          await supabase.from('profiles').update({ lol_puuid: null }).eq('id', userId);
        } else if (key.includes('cs') || key.includes('counter')) {
          await supabase.from('profiles').update({ steam_id: null }).eq('id', userId);
        }
      }
    }

    // 2. Delete Telemetry Rows for this Game
    if (telemetryTable) {
      const { error: telemErr } = await supabase
        .from(telemetryTable)
        .delete()
        .eq('user_id', userId);

      if (telemErr) {
        console.warn(`[Telemetry Purge Warning on ${telemetryTable}]:`, telemErr.message);
      }
    }

    console.log(`✅ Successfully unlinked ${gameKey} for user: ${userId}`);
    return res.status(200).json({
      success: true,
      message: `${gameKey} unlinked successfully.`
    });
  } catch (err) {
    console.error('[Unlink Catch Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to unlink account.' });
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

