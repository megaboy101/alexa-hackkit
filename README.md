Config process:

Create AWS account

Setup AWS credentials environment variables

Create amazon developer account

Install ask-cli globally

Call 'ask-cli init' to setup cli

cd into 'alexa-client'

Call 'ask api create-skill -f SKILLFILE[skill.json] -p PROFILE[default]' to initialize the skill project

Copy the skill url for later

Call 'ask api update-model -s SKILL_URL[amzn1.ask.skill.7bb3be41-90d1-4d35-a11e-7ae6810a3649] -f MODEL_FILES[./models/en-US.json] -l en-US -p PROFILE[default]' to load the model file into the skill

Call 'ask api get-skill-status -s SKILL_URL[amzn1.ask.skill.7bb3be41-90d1-4d35-a11e-7ae6810a3649] -p PROFILE[default]' to check the build status (the project cannot be run until the model is built)

cd into 'api'

Update the 'serverless.yml' file to listen for the skill url for events

---------------------------------------------------------------------------------------

Call 'serverless deploy' to deploy the lambda project

Call 'aws lambda get-function-configuration --function-name SERVERLESS_SERVICE_NAME[my-alexa-hackkit-api-dev-mySkill]' to get the ARN of the lambda service

Copy the ARN for later

cd back into 'alexa-client'

Update 'skill.json' to include the lambda ARN like so:
{
  manifest: {
    apis: {
      custom: {
        endpoint: {
          uri: LAMBDA_ARN
        }
      }
    }
  }
}

Call 'ask api update-skill -s SKILL_ID[amzn1.ask.skill.7bb3be41-90d1-4d35-a11e-7ae6810a3649] -f SKILL_FILE[../alexa-client/skill.json] -p PROFILE[default]' to update the skill with the new lambda endpoint

Call 'ask api enable-skill -s SKILL_ID[amzn1.ask.skill.7bb3be41-90d1-4d35-a11e-7ae6810a3649] -p PROFILE[default]' to enable the skill for testing

Call 'ask api simulate-skill -l en-US -s SKILL_ID[amzn1.ask.skill.7bb3be41-90d1-4d35-a11e-7ae6810a3649] -t SIMULATION_TEXT['open greeter'] -p PROFILE[default]' to test/simulate with some text

Copy the response id for later

Call 'ask api get-simulation -s SKILL_ID[amzn1.ask.skill.7bb3be41-90d1-4d35-a11e-7ae6810a3649] -i RESPONSE_ID[7625de32-8d83-46ed-896c-a5ade1753c5c] -p PROFILE[default]' to get the raw response text from the simulation






README Template
==============

Prerequisites
--------------

- Setup an AWS Account
- Setup an Amazon Developer Account


CLI Overview
==============

Init
--------------

- Check if AWS credentials are stored in .aws credentials file or as environment variables
  - Throw security warning if credentials are stored in environment variables
- If credentials cannot be found, create prompt to create AWS credentials file for user, given access key and secret key as input
- Prompt user with amazon developer login
- Store login credentials in template config file for later use in boilerplate commands