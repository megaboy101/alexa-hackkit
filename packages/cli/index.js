const figlet = require("figlet");
const gradient = require("gradient-string");
const signale = require("signale");
const chalk = require("chalk");
const program = require("commander");
const jsonfile = require("jsonfile");
const path = require("path");
const generator = require("./lib/generator");
const publisher = require("./lib/publisher");
const ask = require("./lib/configureAsk");

// Define program
program.version("0.0.0").parse(process.argv);

// Display the banner
figlet.text(
  "Alexa Hackkit",
  {
    font: "ANSI Shadow",
    horizontalLayout: "default",
    verticalLayout: "default"
  },
  (err, data) => {
    if (err) {
      signale.fatal("Something went wrong with the banner");
      signale.fatal(err);
      return;
    }

    const banner = gradient("skyblue", "blue")(data);

    console.log("");
    console.log(banner);

    init().then(() => {
      console.log(
        chalk
          .hex("#ffdf33")
          .bold(
            "\n\n🎉🎉🎉 Initialization complete (don't forget to git), happy coding! 🎉🎉🎉\n\n"
          )
      );
    });
  }
);

async function init() {
  try {
    // Retreive user info to generate a project config
    const projectConfig = await generator.generateProjectConfig();

    // Generate an alexa-skills-kit config, using the users Amazon developer account
    const askConfig = await ask.directInitProcess(null, "default", null);

    // Create the skill in the Amazon developer database
    const skillFile = jsonfile.readFileSync(
      path.join(
        __dirname,
        "../templates/alexa-serverless/packages/alexa-client/skill.json"
      )
    );

    skillFile.manifest.publishingInformation.locales["en-US"].name =
      projectConfig.skillName;
    skillFile.manifest.publishingInformation.locales["en-US"].description =
      projectConfig.skillDescription;

    const skillId = await publisher.createSkill(
      projectConfig,
      askConfig,
      skillFile
    );

    // Build the Interaction model
    const modelFile = jsonfile.readFileSync(
      path.join(
        __dirname,
        "../templates/alexa-serverless/packages/alexa-client/models/en-US.json"
      )
    );

    await publisher.buildModel(askConfig, modelFile, skillId);

    // Generate the project from the template
    generator.generate(projectConfig, askConfig, skillId);

    // Install packages for the generated bundle
    await generator.installProject(projectConfig.name);
  } catch (err) {
    console.error("Error in init function");
    console.error(err);
  }
}
