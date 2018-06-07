const figlet = require("figlet");
const gradient = require("gradient-string");
const signale = require("signale");
const program = require("commander");
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

    init();
  }
);

function init() {
  console.log('Began init process');
  ask.directInitProcess(null, "default", null);
}