const signale = require("signale");
const { awsResolver } = require("./configureAws");
const { LWA } = require("./constants");
const { accessTokenGenerator } = require("./lwa");
const { setVendorId } = require("./vendor");

module.exports.directInitProcess = function(browser, askProfile) {
  return new Promise(res => {
    awsResolver(askProfile, error => {
      if (error) {
        signale.fatal(error);
        process.exit(1);
      }

      // console.log("Generating access token");

      accessTokenGenerator(
        LWA.CLI_DEFAULT_CREDENTIALS,
        LWA.DEFAULT_SCOPES,
        LWA.DEFAULT_STATE,
        browser
      ).then(({ error, token }) => {
        if (error) {
          // if there's an error, delete the
          // half finished askProfile created from last step
          signale.fatal("Error: " + error);
          process.exit(1);
        } else {
          // console.log("Creating ASK config file");
          createAskConfig(token, askProfile).then(config => {
            // signale.complete("ASK config successfully created!");
            res(config);
          });
        }
      });
    });
  });
};

function createAskConfig(token, askProfile) {
  return new Promise((res) => {
    const newConfig = {
      profiles: {}
    };

    const configToken = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type,
      expires_in: token.expires_in,
      expires_at: token.expires_at
    };

    // console.log("Wrote initial config tokens");
    newConfig.profiles[askProfile] = {
      token: configToken
    };

    setVendorId(askProfile, newConfig)
      .then(configWithVendor => {
        // console.log("Finished generating config");
        res(configWithVendor);
      })
      .catch(err => {
        signale.fatal(err);
        process.exit(1);
      });
  });
}
