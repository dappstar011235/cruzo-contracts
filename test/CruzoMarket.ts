import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Cruzo1155 } from "../typechain/Cruzo1155";
import { CruzoMarket } from "../typechain/CruzoMarket";

const tokenDetails = {
  name: "Cruzo",
  symbol: "CRZ",
  baseOnlyURI: "https://cruzo.io/tokens/{id}.json",
  baseAndIdURI: "https://cruzo.io/tokens",
  altBaseOnlyURI: "https://opensea.io/tokens/{id}.json",
  altBaseAndIdURI: "https:opensea.io/tokens/",
};

const real = (inp: string) => inp + "0".repeat(9);

describe("Testing CruzoMarket Contract", () => {
  let admin: SignerWithAddress;

  let signers: SignerWithAddress[];

  let token: Cruzo1155;

  let market: CruzoMarket;

  before(async () => {
    signers = await ethers.getSigners();
    admin = signers[0];
  });

  beforeEach(async () => {
    let Market = await ethers.getContractFactory("CruzoMarket");
    let Token = await ethers.getContractFactory("Cruzo1155");
    market = (await Market.deploy()) as CruzoMarket;
    token = (await Token.deploy(tokenDetails.baseOnlyURI, market.address)) as Cruzo1155;
  });

  it("Should Open Trade", async () => {
    await token.create(1, admin.address,"", []);
    expect(await market.openTrade(token.address, 1, 1, "10000000000", []));
    expect(await token.balanceOf(admin.address, 1)).eq(0);
    expect(await token.balanceOf(market.address, 1)).eq(1);
    expect(await market.cancelTrade(0, []));
  });

  it("Should execute trade", async () => {
    await token.create(1, admin.address,"", []);
    expect(await market.openTrade(token.address, 1, 1, ethers.utils.parseEther("1.0"), []));
    expect(await market.connect(signers[1]).executeTrade(0, [], { value: ethers.utils.parseEther("1.0") }));
    expect(await token.balanceOf(market.address, 1)).eq(0);
    expect(await token.balanceOf(signers[1].address, 1)).eq(1);
  });

  it("Should cancel trade", async () => {
    await token.create(1, admin.address,"", []);
    expect(await market.openTrade(token.address, 1, 1, ethers.utils.parseEther("1.0"), []));
    expect(market.cancelTrade(0, []));
  });

  it("Should get all on trade", async () => {
    await token.create(1, admin.address,"", []);
    expect(await market.openTrade(token.address, 1, 1, ethers.utils.parseEther("1.0"), []));
    const allTrades = await market.getAllOnSale();
    expect(allTrades.length).eq(1);
  });
});
