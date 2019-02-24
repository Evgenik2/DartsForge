'use strict';

const ms = require('ms');
const jwks = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const jwtDecoder = jwksUri => {
  const jwksClient = jwks({
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: ms('24h'),
    jwksUri
  });

  const getKey = (header, callback) => {
    return jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) {
        return callback(err);
      }
      const signingKey = key.publicKey || key.rsaPublicKey;
      return callback(null, signingKey);
    });
  };

  const verify = async token =>
    new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {}, (err, decoded) => {
        if (err)
          return reject(err);
        return resolve({ authenticated: true, ...decoded });
      });
    });
  return async jwt => verify(jwt);
};

exports.verify = async token => {
  const decoder = jwtDecoder('https://cognito-idp.us-east-2.amazonaws.com/us-east-2_GFcVOejW2/.well-known/jwks.json');
  try {
    const user = await decoder(token);
    if (!user.authenticated) {
      return { "authenticated": user.authenticated, error: 'Unauthorized' };
    }
    return user;
  } catch (error) {
       return { authenticated: false, message: error };
  }
};