const figlet = require("figlet");
const gradient = require("gradient-string");
const signale = require("signale");
const chalk = require("chalk");
const program = require("commander");
const generator = require("./lib/generator");
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
            "\n\n🎉🎉🎉 Initialization complete (don't forget to install dependancies and initialize git), happy coding! 🎉🎉🎉\n\n"
          )
      );
    });
  }
);

function init() {
  return new Promise(res => {
    generator.generateProjectConfig().then(projectConfig => {
      ask.directInitProcess(null, "default", null).then(askConfig => {
        generator.generate(projectConfig, askConfig);
        res();
      });
    });
  }).catch(err => {
    console.error("Error in init function");
    console.error(err);
  });
}
