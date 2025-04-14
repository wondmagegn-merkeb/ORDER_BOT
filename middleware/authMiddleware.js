const jwt = require('jsonwebtoken');

// Middleware to check for valid JWT token in session
const authMiddleware = (req, res, next) => {
    // Check if the token is stored in the session
    const token = req.session.token;

    if (!token) {
        // If no token is found in session, redirect to login page
        return res.redirect('/');
    }

    // Verify the token using the secret key stored in environment variables
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // If the token is invalid or expired, redirect to login page
            return res.redirect('/');
        }

        // If token is valid, store the decoded data (user info) in the request object
        req.admin = decoded;  // Store admin info in request for later use
        next();  // Proceed to the next middleware or route handler
    });
};

module.exports = authMiddleware;
