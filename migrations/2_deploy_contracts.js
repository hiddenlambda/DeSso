const BaseAuthority = artifacts.require("BaseAuthority");
const Service = artifacts.require("Service");

module.exports = async function (deployer) {
    deployer.deploy(BaseAuthority).then(() =>
        deployer.deploy(Service, [BaseAuthority.address])
    );
};
