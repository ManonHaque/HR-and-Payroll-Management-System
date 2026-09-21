/**
 * Global Authentication Middleware
 * 
 * Developers: Import and apply this middleware to your module's routes 
 * to protect them from unauthorized access.
 */

const authenticate = (req, res, next) => {
  // TODO: Implement JWT verification logic here
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    // For now, bypassing actual check until auth module is built
    req.user = { id: 1, role: 'Admin' }; 
    next();
  } catch (error) {
    return res.status(403).json({ status: 'error', message: 'Invalid token' });
  }
};

module.exports = { authenticate };