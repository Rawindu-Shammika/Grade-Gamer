import { supabase } from '../config/supabase.js';

export const getLatestTelemetry = (udpListener) => {
  return (req, res) => {
    try {
      const data = udpListener.getLatestTelemetry();
      return res.status(200).json({
        success: true,
        telemetry: data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve telemetry data',
        error: error.message
      });
    }
  };
};

export const syncTelemetryToDatabase = async (req, res) => {
  const { userId, gameTitle, performanceScore } = req.body;
  
  if (!userId || !gameTitle || performanceScore === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: userId, gameTitle, performanceScore'
    });
  }

  try {
    const { data, error } = await supabase
      .from('matches')
      .insert([
        {
          user_id: userId,
          game_title: gameTitle,
          performance_score: Number(performanceScore),
          match_timestamp: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Telemetry synced successfully',
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database sync failed',
      error: error.message
    });
  }
};
