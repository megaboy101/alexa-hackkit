const signale = require("signale");
const jsonfile = require("jsonfile");
const path = require("path");
const fs = require("fs");
const util = require("util");
const { awsResolver } = require("./configureAws");
const { LWA } = require("./constants");
const { accessTokenGenerator } = require("./lwa");
const { setVendorId } = require("./vendor");

module.exports.directInitProcess = function(browser, askProfile) {
  awsResolver(askProfile, error => {
    if (error) {
      signale.fatal(error);
      process.exit(1);
    }

    console.log("Generating access token");
    accessTokenGenerator(
      LWA.CLI_DEFAULT_CREDENTIALS,
      LWA.DEFAULT_SCOPES,
      LWA.DEFAULT_STATE,
      browser,
      (error, tokens) => {
        if (error) {
          // if there's an error, delete the
          // half finished askProfile created from last step
          signale.fatal("Error: " + error);
          process.exit(1);
        } else {
          console.log("Creating ASK config file");
          createAskConfig(tokens, askProfile, () => {
            signale.complete("ASK config successfully created!");
          });
        }
      }
    );
  });
};

function createAskConfig(token, askProfile, callback) {
  const configFolder = path.join(process.cwd(), ".ask");
  const configFile = path.join(configFolder, "ask_config");

  console.log("Created empty ASK config folder");
  fs.mkdirSync(configFolder);

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

  console.log("Wrote initial config tokens");
  newConfig.profiles[askProfile] = {
    token: configToken
  };

  setVendorId(askProfile, newConfig)
    .then(configWithVendor => {
      console.log("Writing config file");
      console.log(util.inspect(configWithVendor, false, null));
      jsonfile.writeFileSync(configFile, configWithVendor, { spaces: 2 });
      callback();
    })
    .catch(err => {
      signale.fatal(err);
      process.exit(1);
    });
}
