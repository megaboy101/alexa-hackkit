const inquirer = require("inquirer");
const signale = require("signale");
const profileHandler = require("aws-profile-handler");
const path = require("path");
const fs = require("fs");
const os = require("os");
const mkdirp = require("mkdirp");
const AWS_DISPLAY_PAGE_SIZE = 25;

module.exports.awsResolver = function(askProfile, callback) {
  console.log('Resolving AWS credentials');
  const awsPath = path.join(os.homedir(), ".aws", "credentials");
  try {
    let awsProfileList = fs.existsSync(awsPath)
      ? profileHandler.listProfiles(awsPath)
      : [];
    _awsProfileResolver(awsProfileList, askProfile, callback);
  } catch (error) {
    callback(error);
  }
};

function setup(callback) {
  // create credentials file if it doesn't exist
  let awsCredentialsDir = path.join(os.homedir(), ".aws");
  let awsCredentialsFile = path.join(awsCredentialsDir, "credentials");
  if (!fs.existsSync(awsCredentialsFile)) {
    mkdirp.sync(awsCredentialsDir);
    fs.closeSync(fs.openSync(awsCredentialsFile, "a"));
  }
  _setupCredentials(callback);
}

function _setupCredentials(callback) {
  let profileName = null;
  // listProfile will check the weather the INI file is valid or not. If it's not valid,
  // no need to proceed, just callback the error.
  try {
    // if the credential file is empty, CLI will name the first profile as 'default'
    if (profileHandler.listProfiles().length === 0) {
      profileName = "default";
    }
  } catch (error) {
    callback(error.message);
    return;
  }

  _askCredentialName(profileName, name => {
    if (profileHandler.getProfileCredentials(name) === null) {
      _addNewCredentials(name, () => {
        callback(null, name);
      });
    } else {
      _confirmOverwritingProfile(name, confirm => {
        if (confirm) {
          _addNewCredentials(name, () => {
            callback(null, name);
          });
        } else {
          // if the user chose not to overwrite the profile
          // CLI will first list all the existing profile
          // then call the set up function again to ask the user for a new profile name
          console.log("List of the existing AWS profiles:");
          profileHandler.listProfiles().forEach(name => {
            console.log('"' + name + '"');
          });
          _setupCredentials(callback);
        }
      });
    }
  });
}

function _askCredentialName(profileName, callback) {
  if (profileName) {
    callback(profileName);
  } else {
    inquirer
      .prompt([
        {
          type: "input",
          name: "awsProfileName",
          message: "Please input the profile name for the AWS credential:\n",
          default: function() {
            return "default";
          }
        }
      ])
      .then(answer => {
        callback(answer.awsProfileName.trim());
      });
  }
}

function _addNewCredentials(profileName, callback) {
  console.log(
    "\nPlease follow the instruction from https://developer.amazon.com/docs/smapi/set-up-credentials-for-an-amazon-web-services-account.html" +
      "\nFill in the AWS Access Key ID and AWS Secret Access Key below. CLI will generate/modify the AWS credential file for you."
  );
  inquirer
    .prompt([
      {
        type: "input",
        name: "accessKeyId",
        message: "AWS Access Key ID:\n",
        validate: function(input) {
          if (!input.trim()) {
            return '"AWS Access Key ID" cannot be empty.';
          }
          return true;
        }
      },
      {
        type: "input",
        name: "secretAccessKey",
        message: "AWS Secret Access Key:\n",
        validate: function(input) {
          if (!input.trim()) {
            return '"AWS Secret Access Key" cannot be empty.';
          }
          return true;
        }
      }
    ])
    .then(answer => {
      let valid_credential_object = {
        aws_access_key_id: answer.accessKeyId.trim(),
        aws_secret_access_key: answer.secretAccessKey.trim()
      };
      profileHandler.addProfile(profileName, valid_credential_object);
      callback(profileName);
    });
}

function _confirmOverwritingProfile(profileName, callback) {
  inquirer
    .prompt([
      {
        type: "confirm",
        name: "overwrite",
        default: true,
        message:
          "Input name [" +
          profileName +
          "] exists, do you want to overwrite the existing credential?"
      }
    ])
    .then(answer => {
      callback(answer.overwrite);
    });
}

function _awsProfileResolver(awsProfileList, askProfile, callback) {
  if (awsProfileList.length === 0) {
    const YES = "Yes. Set up the AWS credentials.";
    const ABORT = "Abort the initialization process.";
    const awsSetupOptions = [YES, ABORT];

    inquirer
      .prompt([
        {
          type: "list",
          name: "awsSetupDecision",
          message:
            "No AWS credentials file found, would you like to set this up now? (necessary for deployment)",
          choices: awsSetupOptions
        }
      ])
      .then(answer => {
        if (answer.awsSetupDecision === YES) {
          setup((error, awsProfile) => {
            if (error) {
              callback(error);
            }
          });
        } else {
          signale.info(
            "You can turn to README.md for AWS credentials setup instruction."
          );
          return;
        }
      });
  }
  else {
    signale.info("Setting up ask profile: [" + askProfile + "]");
    inquirer
      .prompt([
        {
          type: "list",
          name: "chosenProfile",
          message:
            "Please choose one from the following AWS profiles for skill's Lambda function deployment.\n",
          pageSize: AWS_DISPLAY_PAGE_SIZE,
          choices: awsProfileList
        }
      ])
      .then(() => {
        console.log('Resolved AWS config');
        callback();
      });
  }
}
