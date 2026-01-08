const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Simple file-based session storage (use Redis/DB in production)
const SESSIONS_FILE = path.join(__dirname, '../data/sessions.json');

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  const dataDir = path.join(__dirname, '../data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

/**
 * Load sessions from file
 */
async function loadSessions() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is empty, return empty object
    return {};
  }
}

/**
 * Save sessions to file
 */
async function saveSessions(sessions) {
  await ensureDataDir();
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

/**
 * POST /api/auth/save-session
 * Save user session/cookies for a service
 */
router.post('/save-session', async (req, res) => {
  try {
    const { userId, service, cookies, token } = req.body;
    
    // Validation
    if (!userId || !service) {
      return res.status(400).json({
        error: true,
        message: 'userId and service are required'
      });
    }
    
    if (!cookies && !token) {
      return res.status(400).json({
        error: true,
        message: 'Either cookies or token is required'
      });
    }
    
    // Load existing sessions
    const sessions = await loadSessions();
    
    // Initialize user sessions if not exists
    if (!sessions[userId]) {
      sessions[userId] = {};
    }
    
    // Save session data
    sessions[userId][service] = {
      cookies: cookies || null,
      token: token || null,
      updatedAt: new Date().toISOString()
    };
    
    // Save to file
    await saveSessions(sessions);
    
    console.log(`✅ Session saved for user ${userId}, service: ${service}`);
    
    res.json({
      success: true,
      message: `Session saved for ${service}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to save session',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/get-sessions/:userId
 * Get all saved sessions for a user
 */
router.get('/get-sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        error: true,
        message: 'userId is required'
      });
    }
    
    const sessions = await loadSessions();
    const userSessions = sessions[userId] || {};
    
    // Return which services are connected
    const connectedServices = Object.keys(userSessions).filter(
      service => userSessions[service].cookies || userSessions[service].token
    );
    
    res.json({
      success: true,
      userId,
      connectedServices,
      sessions: userSessions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get sessions',
      details: error.message
    });
  }
});

/**
 * DELETE /api/auth/delete-session
 * Delete a specific service session
 */
router.delete('/delete-session', async (req, res) => {
  try {
    const { userId, service } = req.body;
    
    if (!userId || !service) {
      return res.status(400).json({
        error: true,
        message: 'userId and service are required'
      });
    }
    
    const sessions = await loadSessions();
    
    if (sessions[userId] && sessions[userId][service]) {
      delete sessions[userId][service];
      await saveSessions(sessions);
      
      console.log(`✅ Session deleted for user ${userId}, service: ${service}`);
      
      res.json({
        success: true,
        message: `Session deleted for ${service}`
      });
    } else {
      res.status(404).json({
        error: true,
        message: 'Session not found'
      });
    }
    
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete session'
    });
  }
});

/**
 * GET /api/auth/health
 * Health check for auth service
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'authentication',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
