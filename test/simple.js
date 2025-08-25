const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuraDemo", function () {
  it("Should work", async function () {
    const [owner] = await ethers.getSigners();
    const AuraDemo = await ethers.getContractFactory("AuraDemo");
    const auraDemo = await AuraDemo.deploy();
    
    expect(await auraDemo.getProposalCount()).to.equal(0);
    console.log("✅ Test passed!");
  });
});
