const expressJwt = require('express-jwt');
const utils = require('./utils.js');
const config = require('./secret.json');
console.log(config);
module.exports = jwt;

function jwt() {
    const secret = config.secret;
    return expressJwt({ secret, algorithms: ['HS256'], isRevoked: tokenCorrect }).unless({
        path: [
            // Public routes that don't require authentication
            '/home',
            '/api/feed',
            '/api/auth/customers/signup/',
            '/api/auth/customers/signin/',
            '/api/auth/admin/signin/'
        ]
    });
}

async function tokenCorrect(req, payload, done) {
    const user = await utils.userById(payload.sub);
    if(user){
        // Roots that only admin can navigate
        if(req.originalUrl === '/api/auth/admin/signup/')
        {
            return done(null, true);
        }
    }

    const admin = await utils.adminById(payload.sub);

    // revoke token if user or admin no longer exists
    if (!admin && !user) {
        console.log("Invalid person");
        return done(null, true);
    }
    done();
};
