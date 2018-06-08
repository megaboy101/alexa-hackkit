const inquirer = require("inquirer");
const signale = require("signale");
const requestLib = require("request");
const { tokenRefreshAndRead } = require("./oauthWrapper");
const { isISPApi } = require("./ispUtils");
const VENDOR_PAGE_SIZE = 50;

module.exports.setVendorId = function(profile, config) {
  return new Promise((res, rej) => {
    // console.log("Setting vendor ID");
    callListVendor(profile, config, false).then(({ updatedConfig, data }) => {
      // console.log("Updated config retrieved");
      if (!updatedConfig || !config) {
        return;
      }
      let vendorInfo = convertDataToJsonObject(data.body).vendors;
      if (!vendorInfo) {
        process.exit(1);
      }
      if (vendorInfo.length === 0) {
        signale.fatal("There is no vendor ID for your account.");
        process.exit(1);
      }
      if (vendorInfo.length === 1) {
        updatedConfig.profiles[profile].vendor_id = vendorInfo[0].id;
        // signale.success("Vendor ID set as " + vendorInfo[0].id + "\n");
        // signale.success("Profile [" + profile + "] initialized successfully.");
        res(updatedConfig);
      }
      // let vendorList = vendorInfo.map(vendor => {
      //   return vendor.name + ": " + vendor.id;
      // });
      // inquirer
      //   .prompt([
      //     {
      //       type: "rawlist",
      //       message: "Choose the vendor ID for the skills you want to manage",
      //       name: "selectedVendor",
      //       pageSize: VENDOR_PAGE_SIZE,
      //       choices: vendorList
      //     }
      //   ])
      //   .then(answers => {
      //     let vendorId = answers.selectedVendor.substr(
      //       answers.selectedVendor.lastIndexOf(":") + 2
      //     );
      //     updatedConfig.profiles[profile].vendor_id = vendorId;
      //     // signale.success("Vendor ID updated for the profile.\n");
      //     // signale.success("Profile [" + profile + "] initialized successfully.");
      //     res(updatedConfig);
      //   });
    }).catch(err => {
      console.error(err);
      rej();
    });
  })
};

function callListVendor(profile, config, doDebug) {
  return new Promise((res) => {
    let url = "/vendors";
    let general = {
      url: url,
      method: "GET"
    };
    let headers = {};
    request(
      "list-vendors",
      general,
      headers,
      null,
      profile,
      config,
      doDebug,
      res
    );
  });
}

function request(
  apiName,
  general,
  headers,
  payload,
  profile,
  config,
  doDebug,
  callback
) {
  const ENDPOINT = "https://api.amazonalexa.com/v1";
  let url = ENDPOINT + general.url;

  requestWithUrl(
    apiName,
    url,
    general.method,
    headers,
    payload,
    profile,
    config,
    doDebug,
    callback
  );
}

function requestWithUrl(
  apiName,
  url,
  method,
  headers,
  payload,
  profile,
  config,
  doDebug,
  callback
) {
  headers["User-Agent"] =
    "ask-cli/" +
    require("../package.json").version +
    " Node/" +
    process.version;
  let params = {
    url: url,
    method: method,
    headers: headers,
    body: payload,
    json: payload ? true : false
  };

  tokenRefreshAndRead(
    params,
    profile,
    config,
    (updatedParams, updatedConfig) => {
      // console.log("Token gathered and refreshed");
      requestLib(updatedParams, (error, response) => {
        // console.log("RequestLib completed");
        if (error || response === null || response.statusCode === null) {
          signale.fatal(
            "Request to the Alexa Skill Management API service failed."
          );
          process.exit(1);
        } else if (isISPApi(apiName)) {
          console.log("API is an ISP api");
          callback(updatedConfig, response);
        } else if (response.statusCode >= 300) {
          if (
            (apiName === "head-model" && response.statusCode === 404) ||
            (apiName === "get-skill-status" && response.statusCode === 404) ||
            (apiName === "get-skill" && response.statusCode === 303)
          ) {
            callback(updatedConfig, response);
          } else {
            // no callback
            signale.fatal("Call " + apiName + " error.");
            signale.fatal("Error code: " + response.statusCode);
            if (response.body && convertDataToJsonObject(response.body)) {
              signale.fatal(
                JSON.stringify(convertDataToJsonObject(response.body), null, 2)
              );
            }
            process.exit(1);
          }
        } else {
          callback({
            updatedConfig,
            data: response
          });
        }
      });
    }
  );
}

function convertDataToJsonObject(data) {
  let response = data;
  try {
    if (typeof data === "string") {
      response = JSON.parse(data);
    }
  } catch (e) {
    signale.fatal(
      "Failed to parse the response from Alexa Skill Management API Service."
    );
    return null;
  }
  return response;
}
