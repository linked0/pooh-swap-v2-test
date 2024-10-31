import { ethers } from "hardhat";

async function main() {
    const provider = ethers.provider;
    const admin = new ethers.Wallet(process.env.ADMIN_KEY || "", provider);

    console.log(`WETH_ADDRESS=${process.env.WETH_ADDRESS}`);
    if (process.env.MULTICALL_ADDRESS === undefined || process.env.WETH_ADDRESS === undefined) {
        console.error("Please set MULICALL_ADDRESS and WETH_ADDRESS in .env file");
        process.exit(1);
    }

    // Deploying UniswapV2Factory
    const uniFactory = await ethers.deployContract("UniswapV2Factory", [admin.address]);
    await uniFactory.waitForDeployment();
    console.log(`FACTORY_ADDRESS=${uniFactory.target}`);

    // Deploy Router passing Factory address and WETH address
    const uniRouter = await ethers.deployContract("UniswapV2Router02", [uniFactory.target, process.env.WETH_ADDRESS]);
    uniRouter.waitForDeployment();
    console.log(`ROUTER_ADDRESS=${uniRouter.target}`);

    console.log(`MULTICALL_ADDRESS=${process.env.MULTICALL_ADDRESS}`);

    // Deploy CalHash
    const calHash = await ethers.deployContract("CalHash");
    await calHash.waitForDeployment();
    const hash = await calHash.getInitHash();
    console.log(`CALHASH_ADDRESS=${hash.toString()}`);

    // Deploy Tokens
    const gtk = await ethers.deployContract("Token", ["GTK", "GTK"]);
    await gtk.waitForDeployment();
    console.log(`GTOKEN_ADDRESS=${gtk.target}`);

    const etk = await ethers.deployContract("Token", ["ETK", "ETK"]);
    await etk.waitForDeployment();
    console.log(`ETOKEN_ADDRESS=${etk.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});