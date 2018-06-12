const chalk = require("chalk");
const { request } = require("./requestWrapper");
const { SKILL } = require("./constants");

module.exports.createSkill = async function(
  projectConfig,
  askConfig,
  skillFile
) {
  try {
    const response = await callCreateSkill(
      skillFile,
      askConfig.profiles["default"].vendor_id,
      askConfig
    );

    const skillId = response.data.body.skillId;

    if (response) {
      console.log(
        "\n" +
        chalk.green("? ") +
        chalk.hex("#6bff24").bold("Skill successfully created! Skill id: ") +
        chalk.hex("#ff3333").bold(skillId) +
        "\n"
      );

      return skillId;
    }
  } catch (err) {
    console.error(err);
  }
};

module.exports.buildModel = async function(askConfig, modelFile, skillId) {
  const stage = SKILL.STAGE.DEVELOPMENT;
  const locale = "en-US";

  try {
    await callUpdateModel(skillId, stage, locale, modelFile, askConfig, false);

    console.log(
      "\n" +
      chalk.green("? ") +
      chalk.hex("#6bff24").bold("Skill model built!") +
      "\n"
    );
  } catch (err) {
    console.error(err);
  }
};

function callCreateSkill(manifest, vendorId, profile) {
  return new Promise((res, rej) => {
    const general = {
      url: "/skills/",
      method: "POST"
    };
    const headers = {};
    const payload = {
      vendorId: vendorId,
      manifest: manifest.manifest
    };

    setTimeout(() => {
      request(
        "create-skill",
        general,
        headers,
        payload,
        "default",
        profile,
        false,
        res
      );
    }, 3000);
  });
}

function callUpdateModel(
  skillId,
  stage,
  locale,
  modelSchema,
  profile,
  doDebug
) {
  return new Promise(res => {
    let url =
      "/skills/" +
      skillId +
      "/stages/" +
      stage +
      "/interactionModel/locales/" +
      locale;
    let general = {
      url: url,
      method: "PUT"
    };
    let headers = {};
    let payload = {
      interactionModel: modelSchema.interactionModel
    };
    request(
      "update-model",
      general,
      headers,
      payload,
      "default",
      profile,
      doDebug,
      res
    );
  });
}
