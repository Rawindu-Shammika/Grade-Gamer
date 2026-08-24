import React from 'react';
import HomeDashboard from '../components/dashboard/HomeDashboard';
import { getAssetImageUrl } from '../utils/supabaseAssets';

const DASHBOARD_BANNER = getAssetImageUrl('DASHBOARD.png');

export const Dashboard = (props) => {
  return <HomeDashboard {...props} dashboardBanner={DASHBOARD_BANNER} />;
};

export default Dashboard;
