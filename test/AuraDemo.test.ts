import { expect } from "chai";
import { ethers } from "hardhat";

describe("AuraDemo Contract", function () {
  let auraDemo: any;
  let owner: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    
    const AuraDemoFactory = await ethers.getContractFactory("AuraDemo");
    auraDemo = await AuraDemoFactory.deploy();
    await auraDemo.waitForDeployment();
  });

  it("Should deploy successfully", async function () {
    expect(await auraDemo.getAddress()).to.be.properAddress;
  });

  it("Should mint tokens", async function () {
    const mintAmount = 1000;
    
    await auraDemo.connect(alice).mint(mintAmount);
    const balance = await auraDemo.getBalance(alice.address);
    
    expect(balance).to.equal(mintAmount);
  });

  it("Should create proposal", async function () {
    await auraDemo.connect(alice).createProposal("Test Proposal");
    const count = await auraDemo.getProposalCount();
    
    expect(count).to.equal(1);
  });
});
