const signale = require("signale");
const requestLib = require("request");
const { tokenRefreshAndRead } = require("./oauthWrapper");
const { isISPApi } = require("./ispUtils");

module.exports.request = function(
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
};

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

module.exports.convertDataToJsonObject = convertDataToJsonObject;
