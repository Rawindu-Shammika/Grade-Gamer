import React, { useMemo } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 10,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
    marginTop: 2,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    fontSize: 8,
    color: '#475569',
  },
  hashBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 4,
    alignItems: 'flex-end',
  },
  hashLabel: {
    fontSize: 6.5,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  hashValue: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0369a1',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 8,
  },
  summaryText: {
    fontSize: 8,
    lineHeight: 1.35,
    color: '#334155',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
  },
  metricLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginVertical: 1,
  },
  metricSub: {
    fontSize: 6.5,
    color: '#64748b',
  },
  peerContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compositeScore: {
    width: 65,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    alignItems: 'center',
    paddingRight: 6,
  },
  compositeVal: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  peerSkillsGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  peerSkillItem: {
    flex: 1,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  progressBarBg: {
    height: 3.5,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  col: {
    flex: 1,
  },
  listItem: {
    fontSize: 7.5,
    color: '#334155',
    marginBottom: 2.5,
  },
  badgeWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  badge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.5,
    color: '#334155',
  },
  softBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.5,
    color: '#166534',
  },
  footer: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#94a3b8',
  },
});

export const ResumePDFDocument = ({
  profile = {},
  gameStats = {},
  peerEvaluations = {},
  tournaments = [],
  education = [],
  techStack = [],
  softSkills = [],
  verificationHash = '0x77FA...3184',
  sha256Id = '31f9d50105120593efbb5ea7e31c890...',
}) => {
  // Master map of game identifiers to display metadata and internal keys
  const GAME_METADATA = {
    valorant: { label: 'VALORANT', statKey: 'valorant' },
    cs2: { label: 'COUNTER-STRIKE 2', statKey: 'cs2' },
    'counter-strike 2': { label: 'COUNTER-STRIKE 2', statKey: 'cs2' },
    counter_strike_2: { label: 'COUNTER-STRIKE 2', statKey: 'cs2' },
    assetto_corsa: { label: 'ASSETTO CORSA', statKey: 'assettoCorsa' },
    assettocorsa: { label: 'ASSETTO CORSA', statKey: 'assettoCorsa' },
    f1_25: { label: 'F1 25', statKey: 'f1_25' },
    f125: { label: 'F1 25', statKey: 'f1_25' },
  };

  // 1. Resolve registered games list from profile or synced nodes
  const registeredGameKeys = useMemo(() => {
    // Check esports_titles array, or registered_games array, or single primary game, or fallback to stats keys
    if (Array.isArray(profile?.esports_titles) && profile.esports_titles.length > 0) {
      return profile.esports_titles.map((g) => g.toLowerCase().trim().replace(/[\s-]/g, '_'));
    }
    if (Array.isArray(profile?.registered_games) && profile.registered_games.length > 0) {
      return profile.registered_games.map((g) => g.toLowerCase().trim().replace(/[\s-]/g, '_'));
    }
    if (profile?.primary_game) {
      return [profile.primary_game.toLowerCase().trim().replace(/[\s-]/g, '_')];
    }
    // Fallback: only include games that have active telemetry recorded in gameStats
    return Object.keys(gameStats).filter((key) => {
      const g = gameStats[key];
      return (Number(g?.hours || 0) > 0 || Number(g?.matches || 0) > 0);
    });
  }, [profile, gameStats]);

  // 2. Playtime Cards for registered games
  const registeredGameCards = useMemo(() => {
    return registeredGameKeys.map((key) => {
      const meta = GAME_METADATA[key] || { label: key.toUpperCase().replace(/_/g, ' '), statKey: key };
      const stat = gameStats[meta.statKey] || gameStats[key] || gameStats[meta.label] || {};
      const hours = Number(stat?.hours || 0);

      return {
        key,
        label: meta.label,
        hoursText: hours > 0 ? `${hours.toFixed(1)} Hours` : '0.0+ Hours',
      };
    });
  }, [registeredGameKeys, gameStats]);

  // 3. Slope Cards for registered games (non-zero only)
  const activeSlopeCards = useMemo(() => {
    const valid = [];
    registeredGameKeys.forEach((key) => {
      const meta = GAME_METADATA[key] || { label: key.toUpperCase().replace(/_/g, ' '), statKey: key };
      const stat = gameStats[meta.statKey] || gameStats[key] || gameStats[meta.label] || {};
      const slope = typeof stat?.slope === 'number' ? stat.slope : parseFloat(stat?.slope || 0);
      const matches = Number(stat?.matches || 0);

      if (!isNaN(slope) && slope !== 0) {
        const isPositive = slope > 0;
        const formattedNum = slope.toFixed(2);
        valid.push({
          key,
          label: meta.label,
          matches,
          formattedText: isPositive ? `+${formattedNum} Growth` : `${formattedNum} Growth`,
          color: isPositive ? '#16a34a' : '#dc2626',
        });
      }
    });
    return valid;
  }, [registeredGameKeys, gameStats]);

  // Peer Evaluation composite & categories
  const compositeScore = (peerEvaluations?.composite || 4.0).toFixed(1);
  const commScore = (peerEvaluations?.communication || 4.0).toFixed(1);
  const teamScore = (peerEvaluations?.teamplay || 3.0).toFixed(1);
  const mechScore = (peerEvaluations?.mechanical || 5.0).toFixed(1);
  const leadScore = peerEvaluations?.leadership ? Number(peerEvaluations.leadership).toFixed(1) : null;

  return (
    <Document title="GradeGamer_Verified_Resume">
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile.full_name || profile.username || 'BUDHDHIKA JAYATHILAKA'}</Text>
              <Text style={styles.subTitle}>
                ESPORTS COMPETITOR ({profile.primary_game || 'VALORANT'}) | IGN: {profile.valorant_ign || profile.ign || 'Stiffer'} | ID: {profile.gradegamer_id || 'GG-366948'}
              </Text>
              <View style={styles.contactRow}>
                <Text>{profile.email || 'budhdhikajayathilaka@gmail.com'}</Text>
                <Text>•</Text>
                <Text>{profile.phone || '0112223334'}</Text>
                <Text>•</Text>
                <Text>{profile.location || 'Negombo, Sri Lanka'}</Text>
                <Text>•</Text>
                <Text style={{ color: '#0369a1' }}>{`gradegamer.edu/${profile.gradegamer_id || 'GG-366948'}`}</Text>
              </View>
            </View>
            <View style={styles.hashBox}>
              <Text style={styles.hashLabel}>VERIFICATION HASH</Text>
              <Text style={styles.hashValue}>{profile.verification_hash || verificationHash}</Text>
              <Text style={{ color: activeSlopeCards[0]?.color || '#0f172a', fontSize: 6.5, marginTop: 1 }}>
                Calibrated: Live Delta {activeSlopeCards[0]?.formattedText.split(' ')[0] || '+0%'}
              </Text>
            </View>
          </View>
        </View>

        {/* SUMMARY */}
        <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY & CALIBRATION</Text>
        <Text style={styles.summaryText}>
          {profile.bio || profile.professional_summary || 'Applying raw competitive telemetry from eSports practice and leadership to verify corporate soft skills. Proven capabilities in data analysis, cross-functional leadership under stress, and workload management validated through platform mathematics.'}
        </Text>

        {/* TELEMETRY METRICS */}
        <Text style={styles.sectionTitle}>ESPORTS COMPETITIVE TELEMETRY & PERFORMANCE METRICS</Text>
        <View style={styles.metricsGrid}>
          {/* Dynamic Playtime for Registered Games */}
          {registeredGameCards.map((game) => (
            <View key={`pdf-hours-${game.key}`} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{game.label}</Text>
              <Text style={styles.metricValue}>{game.hoursText}</Text>
              <Text style={styles.metricSub}>Act Calibrated Telemetry</Text>
            </View>
          ))}

          {/* Dynamic Slopes for Active Registered Games */}
          {activeSlopeCards.length > 0 ? (
            activeSlopeCards.map((slopeCard) => (
              <View key={`pdf-slope-${slopeCard.key}`} style={styles.metricCard}>
                <Text style={styles.metricLabel}>LCC SLOPE ({slopeCard.label})</Text>
                <Text style={[styles.metricValue, { color: slopeCard.color }]}>
                  {slopeCard.formattedText.split(' ')[0]}
                </Text>
                <Text style={styles.metricSub}>
                  Calibrated via {slopeCard.matches} matches
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>LCC SLOPE COEFFICIENT</Text>
              <Text style={[styles.metricValue, { color: '#64748b' }]}>Pending</Text>
              <Text style={styles.metricSub}>Awaiting calibrated matches</Text>
            </View>
          )}
        </View>

        {/* PEER RATINGS */}
        <Text style={styles.sectionTitle}>LATEST PEER EVALUATION & SOFT-SKILL CALIBRATION</Text>
        <View style={styles.peerContainer}>
          <View style={styles.compositeScore}>
            <Text style={styles.compositeVal}>{compositeScore} / 5.0</Text>
            <Text style={{ color: '#d97706', fontSize: 7, marginTop: 1 }}>★★★★★</Text>
            <Text style={{ color: '#64748b', fontSize: 6, marginTop: 2 }}>COMPOSITE INDEX</Text>
          </View>
          <View style={styles.peerSkillsGrid}>
            <View style={styles.peerSkillItem}>
              <View style={styles.skillHeader}>
                <Text>COMMUNICATION</Text>
                <Text style={{ color: '#d97706' }}>{commScore} / 5.0</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={{ backgroundColor: '#d97706', height: '100%', width: `${(parseFloat(commScore) / 5) * 100}%` }} />
              </View>
            </View>
            <View style={styles.peerSkillItem}>
              <View style={styles.skillHeader}>
                <Text>TEAMPLAY</Text>
                <Text style={{ color: '#059669' }}>{teamScore} / 5.0</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={{ backgroundColor: '#059669', height: '100%', width: `${(parseFloat(teamScore) / 5) * 100}%` }} />
              </View>
            </View>
            <View style={styles.peerSkillItem}>
              <View style={styles.skillHeader}>
                <Text>MECHANICAL</Text>
                <Text style={{ color: '#0284c7' }}>{mechScore} / 5.0</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={{ backgroundColor: '#0284c7', height: '100%', width: `${(parseFloat(mechScore) / 5) * 100}%` }} />
              </View>
            </View>
            {leadScore !== null && (
              <View style={styles.peerSkillItem}>
                <View style={styles.skillHeader}>
                  <Text>LEADERSHIP</Text>
                  <Text style={{ color: '#7c3aed' }}>{leadScore} / 5.0</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={{ backgroundColor: '#7c3aed', height: '100%', width: `${(parseFloat(leadScore) / 5) * 100}%` }} />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* TOURNAMENTS & EDUCATION */}
        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>TOURNAMENT RECORDS & PLACEMENTS</Text>
            {tournaments && tournaments.length > 0 ? (
              tournaments.map((t, idx) => (
                <Text key={idx} style={styles.listItem}>• {typeof t === 'string' ? t : `${t.placement || 'Participant'} - ${t.tournament_name || t.name} (${t.year || '2025'})`}</Text>
              ))
            ) : (
              <Text style={[styles.listItem, { color: '#94a3b8' }]}>• No tournament records logged</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>EDUCATION & CREDENTIALS</Text>
            {education && education.length > 0 ? (
              education.map((edu, idx) => (
                <View key={idx} style={{ marginBottom: 3 }}>
                  <Text style={[styles.listItem, { fontFamily: 'Helvetica-Bold', marginBottom: 0 }]}>
                    {edu.degree || edu.title}
                  </Text>
                  <Text style={[styles.listItem, { color: '#64748b' }]}>
                    {edu.institution} ({edu.year || 'Present'})
                  </Text>
                </View>
              ))
            ) : (
              <>
                <Text style={[styles.listItem, { fontFamily: 'Helvetica-Bold' }]}>BSc (Hons) in Computer Science</Text>
                <Text style={[styles.listItem, { color: '#64748b' }]}>SLIIT City University (2023 - Present)</Text>
                <Text style={[styles.listItem, { fontFamily: 'Helvetica-Bold', marginTop: 3 }]}>Esports Analytics & Telemetry Certification</Text>
                <Text style={[styles.listItem, { color: '#64748b' }]}>GradeGamer Verified Platform Accreditation (2025)</Text>
              </>
            )}
          </View>
        </View>

        {/* TECHNICAL STACK & SOFT SKILLS */}
        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>TECHNICAL & GAMING STACK</Text>
            <View style={styles.badgeWrapper}>
              {(techStack && techStack.length > 0
                ? techStack
                : ['MoTeC i2 Pro', 'F1 Telemetry Tool', 'Fanatec DD2', 'Gamer Dashboard SDK', 'TailwindCSS', 'Supabase API']
              ).map((tool, idx) => (
                <Text key={idx} style={styles.badge}>
                  {typeof tool === 'string' ? tool : tool.name}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>VERIFIABLE SOFT SKILLS MAPPED</Text>
            <View style={styles.badgeWrapper}>
              {(softSkills && softSkills.length > 0
                ? softSkills
                : ['Cross-Functional Leadership (IGL)', 'Data-Driven Decision Making', 'Crisis Management under Stress', 'Strategic Resource Allocation']
              ).map((skill, idx) => (
                <Text key={idx} style={styles.softBadge}>
                  {typeof skill === 'string' ? skill : skill.name}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>SHA-256 ID: {profile.sha256_id || sha256Id}</Text>
          <Text>Verified at GradeGamer Telemetry Network</Text>
        </View>

      </Page>
    </Document>
  );
};

export default ResumePDFDocument;
