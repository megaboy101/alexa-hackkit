const oauth2 = require("simple-oauth2");
const signale = require("signale");
const { LWA, PLACEHOLDER } = require("./constants");

module.exports.createOAuth = function(clientId, clientSecret) {
  // if no inputs, it default back to CLI credentials.
  if (!clientId && !clientSecret) {
    clientSecret = LWA.CLI_DEFAULT_CREDENTIALS.clientSecret;
    clientId = LWA.CLI_DEFAULT_CREDENTIALS.clientId;
  }
  const AUTH_URL = {
    host: "https://www.amazon.com",
    path: "/ap/oa"
  };
  const TOKEN_URL = {
    host: "https://api.amazon.com",
    path: "/auth/o2/token"
  };
  return oauth2.create({
    client: {
      id: clientId,
      secret: clientSecret
    },
    auth: {
      authorizeHost: AUTH_URL.host,
      authorizePath: AUTH_URL.path,
      tokenHost: TOKEN_URL.host,
      tokenPath: TOKEN_URL.path
    }
  });
};

module.exports.tokenRefreshAndRead = function(
  params,
  profile,
  config,
  callback
) {
  console.log("Reading and refreshing tokens if necessary");
  if (profile === PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
    // if there's refreshToken, use that first since this profile is using env var,
    // cannot find whether accessToken expired or not.
    let askRefreshToken = process.env.ASK_REFRESH_TOKEN;
    if (askRefreshToken && askRefreshToken.length > 0) {
      refreshToken(profile, config, (refreshedAccessToken, updatedConfig) => {
        params.headers.Authorization = refreshedAccessToken;
        callback(params, updatedConfig);
      });
      return;
    }

    // if no refreshToken, fallback to accessToken
    console.log("No refresh token found, using access token instead");
    let askAccessToken = process.env.ASK_ACCESS_TOKEN;
    if (askAccessToken && askAccessToken.length > 0) {
      params.headers.Authorization = askAccessToken;
      callback(params, config);
    }
    return;
  }
  if (!isTokenExpired(profile, config)) {
    console.log("Token has not yet expired");
    params.headers.Authorization = config.profiles[profile].token.access_token;
    callback(params, config);
  } else {
    console.log("Token has expired, refreshing");
    refreshToken(profile, (refreshedAccessToken, updatedConfig) => {
      params.headers.Authorization = refreshedAccessToken;
      callback(params, updatedConfig);
    });
  }
};

function refreshToken(profile, config, callback) {
  console.log("Refreshing token");
  let OAuth = module.exports.createOAuth();
  let oldToken = readToken(profile, config);
  if (!oldToken) {
    return;
  }
  let token = OAuth.accessToken.create(oldToken);
  token.refresh((err, result) => {
    if (err) {
      signale.fatal(err + "Failed to refresh access token.");
      return;
    } else {
      const updatedConfig = writeToken(result.token, profile, config);
      callback(result.token.access_token, updatedConfig);
    }
  });
}

function readToken(profile, config) {
  console.log("Reading token");
  if (profile === PLACEHOLDER.ENVIRONMENT_VAR.PROFILE_NAME) {
    return {
      access_token: "ACCESS_TOKEN_PLACE_HOLDER",
      refresh_token: process.env.ASK_REFRESH_TOKEN,
      token_type: "bearer",
      expires_in: 0,
      expires_at: 0
    };
  }

  const token = config.profiles[profile].token;

  if (!token) {
    console.log("Token not found while reading config");
    return;
  }
  return {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expires_in: token.expires_in,
    expires_at: token.expires_at
  };
}

function writeToken(token, profile, config) {
  let configToken = {
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expires_in: token.expires_in,
    expires_at: token.expires_at
  };

  config.profiles[profile].token = configToken;

  return config;
}

function isTokenExpired(profile, config) {
  console.log("Checking if token has expired");
  let OAuth = module.exports.createOAuth();
  let token = OAuth.accessToken.create(readToken(profile, config));
  return token.expired();
}
