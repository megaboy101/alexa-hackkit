const signale = require("signale");
const { request, convertDataToJsonObject } = require("./requestWrapper");

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
  });
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
