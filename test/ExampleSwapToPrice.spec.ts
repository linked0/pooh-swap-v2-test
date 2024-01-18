import * as dotenv from "dotenv";
import chai, { expect } from 'chai'
import { ethers } from "hardhat";
import { Contract } from 'ethers';
import { UniswapV2Router02, UniswapV2Pair, UniswapV2Factory, ERC20, IUniswapV2Pair__factory, UniswapV2Pair__factory, ExampleSwapToPrice } from '../typechain-types';
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

dotenv.config({ path: ".env" });

const { MaxUint256 } = ethers;
const AddressZero = "0x0000000000000000000000000000000000000000";

const MINIMUM_LIQUIDITY = 1000n * 10n ** 18n;
const TOTAL_SUPPLY = 10000n * 10n ** 18n;

describe('ExampleSwapToPrice', () => {
  let token0: ERC20
  let token1: ERC20
  let pair: UniswapV2Pair
  let factory: UniswapV2Factory
  let wethPair: UniswapV2Pair
  let swapToPriceExample: ExampleSwapToPrice
  let router: UniswapV2Router02
  let signers: HardhatEthersSigner[]
  let admin: HardhatEthersSigner
  let accounts: string[]
  let pairAddress: string
  
  beforeEach(async () => {
    // get signers
    signers = await ethers.getSigners();
    admin = signers[0];
    accounts = signers.map((s) => s.address);

    // deploy ERC20 tokens
    const tokenA = await ethers.deployContract("ERC20", [TOTAL_SUPPLY]);
    await tokenA.waitForDeployment();
    console.log("tokenA address:", tokenA.target);

    // deploy ERC20 tokens
    const tokenB = await ethers.deployContract("ERC20", [TOTAL_SUPPLY]);
    await tokenB.waitForDeployment();
    console.log("tokenB address:", tokenB.target);

    // deploy WETH
    const weth = await ethers.deployContract("WETH9", []);

    // deploy WETHPartner
    const wethPartner = await ethers.deployContract("ERC20", [TOTAL_SUPPLY]);

    // deploy UniswapV2Factory
    factory = await  ethers.deployContract("UniswapV2Factory", [accounts[0]]);
    await factory.waitForDeployment();
    console.log("factory address:", factory.target);

    // deploty UniswapV2Router02
    router = await ethers.deployContract("UniswapV2Router02", [factory.target, weth.target]);

    // event emitter for testing
    const routerEventEmitter = ethers.deployContract("RouterEventEmitter", []); 

    // deploy migrator
    const migrator = await ethers.deployContract("UniswapV2Migrator", [factory.target, router.target]);

    // initialize V2
    await factory.createPair(tokenA.target, tokenB.target);
    pairAddress = await factory.getPair(tokenA.target, tokenB.target);
    const pairContract = new Contract(pairAddress, JSON.stringify(IUniswapV2Pair__factory.abi), ethers.provider);
    pair = UniswapV2Pair__factory.connect(pairAddress, admin);

    const token0Address = await pair.token0()
    token0 = tokenA.target === token0Address ? tokenA : tokenB
    token1 = tokenA.target === token0Address ? tokenB : tokenA

    await factory.createPair(weth.target, wethPartner.target);
    const wethPairAddress = await factory.getPair(weth.target, wethPartner.target);
    const wethPairContract = new Contract(wethPairAddress, JSON.stringify(IUniswapV2Pair__factory.abi), ethers.provider);
    wethPair = UniswapV2Pair__factory.connect(wethPairAddress, admin);
  });
  
  beforeEach(async function() {
    swapToPriceExample = await ethers.deployContract(
      "ExampleSwapToPrice",
      [factory.target, router.target]
    )
  })

  beforeEach('set up price differential of 1:100', async () => {
    await token0.transfer(pairAddress, 10n * 10n ** 18n)
    await token1.transfer(pairAddress, 1000n * 10n ** 18n)
    await pair.sync()
  })

  beforeEach('approve the swap contract to spend any amount of both tokens', async () => {
    await token0.approve(swapToPriceExample.target, MaxUint256)
    await token1.approve(swapToPriceExample.target, MaxUint256)
  })

  it('correct router address', async () => {
    console.log("router address:", router.target);
    expect(await swapToPriceExample.router()).to.eq(router.target)
  });

  // it('moves the price to 1:90', async () => {
  //   await expect(
  //     swapToPriceExample.swapToPrice(
  //       token0.target,
  //       token1.target,
  //       1,
  //       90,
  //       MaxUint256,
  //       MaxUint256,
  //       accounts[0],
  //       MaxUint256,
  //       overrides
  //     )
  //   )
  //     // (1e19 + 526682316179835569) : (1e21 - 49890467170695440744) ~= 1:90
  //     .to.emit(token0, 'Transfer')
  //     .withArgs(accounts[0], swapToPriceExample.target, '526682316179835569')
  //     .to.emit(token0, 'Approval')
  //     .withArgs(swapToPriceExample.target, router.target, '526682316179835569')
  //     .to.emit(token0, 'Transfer')
  //     .withArgs(swapToPriceExample.target, pair.address, '526682316179835569')
  //     .to.emit(token1, 'Transfer')
  //     .withArgs(pair.address, accounts[0], '49890467170695440744')
  // })
})
