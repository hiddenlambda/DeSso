const DeSso = artifacts.require("DeSso");
const BaseAuthority = artifacts.require("BaseAuthority");

module.exports = async function (deployer) {
    deployer.deploy(DeSso);
    deployer.deploy(BaseAuthority);
};
