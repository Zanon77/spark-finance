const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    // Deploy tokens
    const DepositTokenA = await hre.ethers.getContractFactory("DepositTokenA");
    const da = await DepositTokenA.deploy();
    await da.deployed();
    console.log("DepositTokenA deployed to:", da.address);

    const DepositTokenB = await hre.ethers.getContractFactory("DepositTokenB");
    const db = await DepositTokenB.deploy();
    await db.deployed();
    console.log("DepositTokenB deployed to:", db.address);

    const ConsortiumStablecoin = await hre.ethers.getContractFactory("ConsortiumStablecoin");
    const cs = await ConsortiumStablecoin.deploy();
    await cs.deployed();
    console.log("ConsortiumStablecoin deployed to:", cs.address);

    // Deploy banks
    const BankA = await hre.ethers.getContractFactory("BankA");
    const bankA = await BankA.deploy(da.address, cs.address);
    await bankA.deployed();
    console.log("BankA deployed to:", bankA.address);

    const BankB = await hre.ethers.getContractFactory("BankB");
    const bankB = await BankB.deploy(db.address, cs.address);
    await bankB.deployed();
    console.log("BankB deployed to:", bankB.address);

    // Deploy consortium
    const Consortium = await hre.ethers.getContractFactory("Consortium");
    const consortium = await Consortium.deploy(cs.address, bankA.address, bankB.address);
    await consortium.deployed();
    console.log("Consortium deployed to:", consortium.address);

    // Set roles
    await da.grantRole(await da.MINTER_ROLE(), bankA.address);
    await db.grantRole(await db.MINTER_ROLE(), bankB.address);
    await cs.grantRole(await cs.MINTER_ROLE(), consortium.address);

    // Set consortium in banks
    await bankA.setConsortium(consortium.address);
    await bankB.setConsortium(consortium.address);

    console.log("All contracts deployed and configured");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });