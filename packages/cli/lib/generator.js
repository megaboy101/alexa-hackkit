const inquirer = require("inquirer");
const chalk = require("chalk");
const ora = require("ora");
const jsonfile = require("jsonfile");
const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs");
const util = require("util");
const CWD = process.cwd();

module.exports.generateProjectConfig = async function() {
  const projectQuestions = [
    {
      type: "input",
      name: "name",
      message: "📦 Project name?",
      default: function() {
        return "myProject";
      }
    },
    {
      type: "input",
      name: "description",
      message: "📝 Project description?"
    },
    {
      type: "input",
      name: "skillName",
      message: "🗣️  Skill name?",
      default: function() {
        return "mySkill";
      }
    },
    {
      type: "input",
      name: "skillDescription",
      message: "🗣️️️️️  Skill description?",
      default: function() {
        return "A skillful description.";
      }
    },
    {
      type: "input",
      name: "author",
      message: "🦄 Project Author?"
    }
  ];

  try {
    const {
      name,
      description,
      skillName,
      skillDescription,
      author
    } = await inquirer.prompt(projectQuestions);

    return {
      name,
      description,
      skillName,
      skillDescription,
      author
    };
  } catch (err) {
    console.error(err);
  }
};

module.exports.generate = function(projectConfig, askConfig, skillId) {
  const templatePath = path.join(__dirname, "../../templates/alexa-serverless");
  const projectRoot = `${CWD}/${projectConfig.name}`;

  // Generate project root folder
  fs.mkdirSync(projectRoot);

  // Copy template into project
  createDirectoryContents(templatePath, projectRoot);

  // Overwrite the package file with those defined by the user
  const packageConfig = {
    name: projectConfig.name,
    description: projectConfig.description,
    author: projectConfig.author
  };
  overwriteJsonFile(`${projectRoot}/package.json`, packageConfig);

  // Add the generated alexa-skill-kit config into the project
  addAskConfig(askConfig, skillId, projectRoot);

  // Insert user skill options into the project
  insertSkill(
    projectRoot,
    projectConfig.skillName,
    projectConfig.skillDescription,
    skillId
  );
};

module.exports.installProject = async function(projectName) {
  try {
    const loader = ora(
      chalk.bold("Installing packages...")
    ).start();
    const exec = util.promisify(require("child_process").exec);
    const command = `cd ${projectName} && npm install && cd packages/api && npm install && cd ../../`;
    
    await exec(command, { stdio: "inherit" });
    loader.stop();
  }
  catch(err) {
    console.error("Error installing npm packages");
  }
};

function createDirectoryContents(templatePath, newProjectPath) {
  const files = fs.readdirSync(templatePath);

  files.forEach(file => {
    const originalFilePath = `${templatePath}/${file}`;

    const stats = fs.statSync(originalFilePath);

    if (stats.isFile()) {
      const contents = fs.readFileSync(originalFilePath, "utf8");

      const writePath = `${newProjectPath}/${file}`;
      fs.writeFileSync(writePath, contents, "utf8");
    } else if (stats.isDirectory()) {
      fs.mkdirSync(`${newProjectPath}/${file}`);

      // Recursively create contents inside every folder
      createDirectoryContents(
        `${templatePath}/${file}`,
        `${newProjectPath}/${file}`
      );
    }
  });
}

function addAskConfig(askConfig, skillId, projectRoot) {
  const configDir = `${projectRoot}/config`;
  const configFile = `${configDir}/ask.json`;

  fs.mkdirSync(configDir);

  askConfig.skill_id = skillId;
  jsonfile.writeFileSync(configFile, askConfig, { spaces: 2 });
}

function insertSkill(projectRoot, skillName, skillDescription, skillId) {
  // Update skill file with skill name/desc
  const skillFile = jsonfile.readFileSync(
    `${projectRoot}/packages/alexa-client/skill.json`
  );

  skillFile.manifest.publishingInformation.locales["en-US"].name = skillName;
  skillFile.manifest.publishingInformation.locales[
    "en-US"
  ].description = skillDescription;

  jsonfile.writeFileSync(
    `${projectRoot}/packages/alexa-client/skill.json`,
    skillFile,
    { spacing: 2 }
  );

  // Update the local .ask config file
  const localAskConfigFile = jsonfile.readFileSync(
    `${projectRoot}/packages/alexa-client/.ask/config`
  );

  localAskConfigFile.deploy_settings.default.merge.manifest.apis.custom.endpoint.uri = `ask-custom-${skillName}-default`;

  jsonfile.writeFileSync(
    `${projectRoot}/packages/alexa-client/.ask/config`,
    localAskConfigFile,
    { spacing: 2 }
  );

  // Update serverless configuration
  const slsConfig = yaml.safeLoad(
    fs.readFileSync(`${projectRoot}/packages/api/serverless.yml`, "utf-8")
  );

  slsConfig.functions = {};
  slsConfig.functions[skillName] = {
    handler: `handler.${skillName}`,
    events: [
      {
        alexaSkill: skillId
      }
    ]
  };

  fs.writeFileSync(
    `${projectRoot}/packages/api/serverless.yml`,
    yaml.safeDump(slsConfig)
  );

  // Customize boilerplate lambda handler to skill name
  const handlerFile = fs.readFileSync(
    `${projectRoot}/packages/api/handler.js`,
    "utf-8"
  );
  const updatedHandlerFile = handlerFile.split("mySkill").join(skillName); // Quick trick to replace string without worrying about regex

  fs.writeFileSync(
    `${projectRoot}/packages/api/handler.js`,
    updatedHandlerFile
  );
}

function overwriteJsonFile(filepath, options) {
  const jsonFile = jsonfile.readFileSync(filepath);

  if (!jsonFile) console.error("Json file not found: " + filepath);

  const updatedJson = Object.assign({}, jsonFile, options);

  jsonfile.writeFileSync(filepath, updatedJson, { spacing: 2 });
}
