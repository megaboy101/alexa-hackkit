const API = Object.freeze({
  CREATE_ISP: "create-isp",
  UPDATE_ISP: "update-isp",
  GET_ISP: "get-isp",
  ASSOCIATE_ISP: "associate-isp",
  DISASSOCIATE_ISP: "disassociate-isp",
  DELETE_ISP: "delete-isp",
  LIST_SKILLS_FOR_ISP: "list-skills-for-isp",
  LIST_ISP_FOR_SKILL: "list-isp-for-skill",
  LIST_ISP_FOR_VENDOR: "list-isp-for-vendor",
  RESET_ISP_ENTITLEMENT: "reset-isp-entitlement"
});

const ISP_API_LIST = Object.freeze(
  Object.keys(API).map(function(api) {
    return API[api];
  })
);

module.exports.isISPApi = function(apiName) {
  if (!apiName) {
    return false;
  }
  return ISP_API_LIST.indexOf(apiName.toLowerCase()) > -1;
};
