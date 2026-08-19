import React from 'react';
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

export const ResumePDFDocument = ({ userData, selectedGame, skillData }) => {
  return (
    <Document title="GradeGamer_Verified_Resume">
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{userData?.fullName || 'THANUGA NIDUWARA'}</Text>
              <Text style={styles.subTitle}>
                ESPORTS COMPETITOR ({selectedGame || 'VALORANT'}) | IGN: {userData?.ign || 'Hydra'} | ID: {userData?.ggId || 'GG-977315'}
              </Text>
              <View style={styles.contactRow}>
                <Text>{userData?.email || 'thanuga2002@gmail.com'}</Text>
                <Text>•</Text>
                <Text>{userData?.phone || '011222112'}</Text>
                <Text>•</Text>
                <Text>{userData?.location || 'Negombo'}</Text>
                <Text>•</Text>
                <Text style={{ color: '#0369a1' }}>{userData?.portfolio || 'gradegamer.edu/GG-977315'}</Text>
              </View>
            </View>
            <View style={styles.hashBox}>
              <Text style={styles.hashLabel}>VERIFICATION HASH</Text>
              <Text style={styles.hashValue}>0x77FA...3184</Text>
              <Text style={{ color: '#16a34a', fontSize: 6.5, marginTop: 1 }}>Calibrated: Delta +0%</Text>
            </View>
          </View>
        </View>

        {/* SUMMARY */}
        <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY & CALIBRATION</Text>
        <Text style={styles.summaryText}>
          Applying raw competitive telemetry from eSports practice and leadership to verify corporate soft skills. Proven capabilities in data analysis, cross-functional leadership under stress, and workload management validated through platform mathematics.
        </Text>

        {/* TELEMETRY METRICS */}
        <Text style={styles.sectionTitle}>ESPORTS COMPETITIVE TELEMETRY & PERFORMANCE METRICS</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{selectedGame || 'VALORANT'}</Text>
            <Text style={styles.metricValue}>160+ Hours</Text>
            <Text style={styles.metricSub}>Top 5% Telemetry Analytics</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>COUNTER-STRIKE 2</Text>
            <Text style={styles.metricValue}>160+ Hours</Text>
            <Text style={styles.metricSub}>Top 5% Telemetry Analytics</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>LCC SLOPE COEFFICIENT</Text>
            <Text style={[styles.metricValue, { color: '#16a34a' }]}>+0% Growth</Text>
            <Text style={styles.metricSub}>Calibrated via matches</Text>
          </View>
        </View>

        {/* PEER RATINGS */}
        <Text style={styles.sectionTitle}>LATEST PEER EVALUATION & SOFT-SKILL CALIBRATION</Text>
        <View style={styles.peerContainer}>
          <View style={styles.compositeScore}>
            <Text style={styles.compositeVal}>4.3 / 5.0</Text>
            <Text style={{ color: '#d97706', fontSize: 7, marginTop: 1 }}>★★★★★</Text>
            <Text style={{ color: '#64748b', fontSize: 6, marginTop: 2 }}>COMPOSITE INDEX</Text>
          </View>
          <View style={styles.peerSkillsGrid}>
            <View style={styles.peerSkillItem}>
              <View style={styles.skillHeader}>
                <Text>COMMUNICATION</Text>
                <Text style={{ color: '#d97706' }}>4.0 / 5.0</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={{ backgroundColor: '#d97706', height: '100%', width: '80%' }} />
              </View>
            </View>
            <View style={styles.peerSkillItem}>
              <View style={styles.skillHeader}>
                <Text>TEAMPLAY</Text>
                <Text style={{ color: '#059669' }}>4.0 / 5.0</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={{ backgroundColor: '#059669', height: '100%', width: '80%' }} />
              </View>
            </View>
            <View style={styles.peerSkillItem}>
              <View style={styles.skillHeader}>
                <Text>MECHANICAL</Text>
                <Text style={{ color: '#0284c7' }}>4.5 / 5.0</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={{ backgroundColor: '#0284c7', height: '100%', width: '90%' }} />
              </View>
            </View>
          </View>
        </View>

        {/* TOURNAMENTS & EDUCATION */}
        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>TOURNAMENT RECORDS & PLACEMENTS</Text>
            <Text style={styles.listItem}>• 1st Place - SLIIT Inter-University Esports Championship (2025)</Text>
            <Text style={styles.listItem}>• Top 5 - F1 Sim-League Asia Regionals Division I (2024)</Text>
            <Text style={styles.listItem}>• Finalist - Valorant Red Bull Campus Clutch Qualifier (2024)</Text>
            <Text style={styles.listItem}>• Semi-Finalist - CS2 Cyber League South Asia Spring Cup (2024)</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>EDUCATION & CREDENTIALS</Text>
            <Text style={[styles.listItem, { fontFamily: 'Helvetica-Bold' }]}>BSc (Hons) in Computer Science</Text>
            <Text style={[styles.listItem, { color: '#64748b' }]}>SLIIT City University (2023 - Present)</Text>
            <Text style={[styles.listItem, { fontFamily: 'Helvetica-Bold', marginTop: 3 }]}>Esports Analytics & Telemetry Certification</Text>
            <Text style={[styles.listItem, { color: '#64748b' }]}>GradeGamer Verified Platform Accreditation (2025)</Text>
          </View>
        </View>

        {/* TECHNICAL STACK & SOFT SKILLS */}
        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>TECHNICAL & GAMING STACK</Text>
            <View style={styles.badgeWrapper}>
              {['MoTeC i2 Pro', 'F1 Telemetry Tool', 'Fanatec DD2', 'Gamer Dashboard SDK', 'TailwindCSS', 'Supabase API'].map((t, idx) => (
                <Text key={idx} style={styles.badge}>{t}</Text>
              ))}
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>VERIFIABLE SOFT SKILLS MAPPED</Text>
            <View style={styles.badgeWrapper}>
              {['Cross-Functional Leadership (IGL)', 'Data-Driven Decision Making', 'Crisis Management under Stress', 'Strategic Resource Allocation'].map((s, idx) => (
                <Text key={idx} style={styles.softBadge}>{s}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>SHA-256 ID: 31f9d50105120593efbb5ea7e31c890...</Text>
          <Text>Verified at GradeGamer Telemetry Network</Text>
        </View>

      </Page>
    </Document>
  );
};
