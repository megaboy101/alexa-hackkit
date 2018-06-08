const inquirer = require("inquirer");
const signale = require("signale");
const chalk = require("chalk");
const oauthWrapper = require("./oauthWrapper");
const { LWA } = require("./constants");

module.exports.accessTokenGenerator = function(
  credentials,
  scopes,
  state,
  needBrowser
) {
  return new Promise((res, rej) => {
    // console.log("Fetching access code");
    let OAuth = oauthWrapper.createOAuth(
      credentials.clientId,
      credentials.clientSecret
    );

    let authorizeUrl = OAuth.authorizationCode.authorizeURL({
      redirect_uri: LWA.S3_RESPONSE_PARSER_URL,
      scope: scopes,
      state: state
    });
    console.log(
      "\n" +
      chalk.green("? ") +
      chalk.bold.underline.blue(
        "Go to the following link to connect to your Amazon developer account:\n"
      ) +
      `${authorizeUrl}\n`
    );

    _getAuthCode(authCode => {
      _requestTokens(authCode, LWA.S3_RESPONSE_PARSER_URL, OAuth, res);
    });
  });
};

function _getAuthCode(callback) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "authCode",
        message: "Please enter the Authorization Code:",
        validate: value => {
          let pass = value.trim();
          if (!pass) {
            return "Please enter a valid Authorization Code.";
          } else {
            return true;
          }
        }
      }
    ])
    .then(answer => {
      // console.log("Retrieved access code");
      callback(answer.authCode);
    });
}

function _requestTokens(authCode, redirect_uri, OAuth, callback) {
  let tokenConfig = {
    code: authCode,
    redirect_uri: redirect_uri
  };

  // console.log("Obtaining tokens from access code");
  OAuth.authorizationCode.getToken(tokenConfig, (error, result) => {
    if (error) {
      callback("Cannot obtain access token. " + error);
    } else {
      let token = OAuth.accessToken.create(result).token;
      callback({ error: null, token });
    }
  });
}
