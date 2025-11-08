const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      data: null
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // ✅ Only store the user ID, nothing else
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      data: null
    });
  }
};

module.exports = { protect };
