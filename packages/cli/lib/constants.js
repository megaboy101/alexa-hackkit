const SCOPES_SKILLS_READWRITE = "alexa::ask:skills:readwrite";
const SCOPES_MODELS_READWRITE = "alexa::ask:models:readwrite";
const SCOPES_SKILLS_TEST = "alexa::ask:skills:test";

module.exports.LWA = {
  S3_RESPONSE_PARSER_URL:
    "https://s3.amazonaws.com/ask-cli/response_parser.html",
  DEFAULT_STATE: "Ask-SkillModel-ReadWrite",
  DEFAULT_SCOPES:
    SCOPES_SKILLS_READWRITE +
    " " +
    SCOPES_MODELS_READWRITE +
    " " +
    SCOPES_SKILLS_TEST,
  CLI_DEFAULT_CREDENTIALS: {
    clientId: "amzn1.application-oa2-client.aad322b5faab44b980c8f87f94fbac56",
    clientSecret:
      "1642d8869b829dda3311d6c6539f3ead55192e3fc767b9071c888e60ef151cf9"
  }
};

module.exports.PLACEHOLDER = {
  ENVIRONMENT_VAR: {
    AWS_CREDENTIALS: "__AWS_CREDENTIALS_IN_ENVIRONMENT_VARIABLE__",
    PROFILE_NAME: "__ENVIRONMENT_ASK_PROFILE__"
  }
};

module.exports.SKILL = {
  RESOURCES: {
    MANIFEST: "manifest",
    INTERACTION_MODEL: "interactionModel"
  },
  STAGE: {
    DEVELOPMENT: "development",
    LIVE: "live",
    CERTIFICATION: "certification"
  },
  BUILD_STATUS: {
    SUCCESS: "SUCCEEDED",
    FAILURE: "FAILURE",
    IN_PROGRESS: "IN_PROGRESS"
  },
  SIMULATION_STATUS: {
    SUCCESS: "SUCCESSFUL",
    FAILURE: "FAILED",
    IN_PROGRESS: "IN_PROGRESS"
  },
  VALIDATION_STATUS: {
    SUCCESS: "SUCCESSFUL",
    FAILURE: "FAILED",
    IN_PROGRESS: "IN_PROGRESS"
  }
};
