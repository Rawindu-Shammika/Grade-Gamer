import React from 'react';
import HomeDashboard from '../components/dashboard/HomeDashboard';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const SUPABASE_ASSETS_BASE = `${cleanUrl}/storage/v1/object/public/assets`;
const DASHBOARD_BANNER = `${SUPABASE_ASSETS_BASE}/DASHBOARD.png`;

export const Dashboard = (props) => {
  return <HomeDashboard {...props} dashboardBanner={DASHBOARD_BANNER} />;
};

export default Dashboard;
