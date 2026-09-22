/**
 * Global Authentication Middleware
 * 
 * Developers: Import and apply this middleware to your module's routes 
 * to protect them from unauthorized access.
 */

const authenticate = (req, res, next) => {
  // TEMPORARY BYPASS FOR DEVELOPMENT:
  // We skip checking the authHeader so the frontend can hit APIs without a JWT token.
  
  try {
    // For now, bypassing actual check until auth module is built
    req.user = { id: 1, role: 'Admin' }; 
    next();
  } catch (error) {
    return res.status(403).json({ status: 'error', message: 'Invalid token' });
  }
};

module.exports = { authenticate };
