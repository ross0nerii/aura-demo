const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuraDemo Complete Tests", function () {
  let auraDemo;
  let owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const AuraDemo = await ethers.getContractFactory("AuraDemo");
    auraDemo = await AuraDemo.deploy();
  });

  it("Should deploy and initialize correctly", async function () {
    expect(await auraDemo.getProposalCount()).to.equal(0);
    expect(await auraDemo.totalSupply()).to.equal(0);
    console.log("✅ Deployment test passed!");
  });

  it("Should mint tokens", async function () {
    await auraDemo.connect(alice).mint(1000);
    expect(await auraDemo.getBalance(alice.address)).to.equal(1000);
    expect(await auraDemo.getVotingPower(alice.address)).to.equal(1000);
    console.log("✅ Minting test passed!");
  });

  it("Should transfer tokens", async function () {
    await auraDemo.connect(alice).mint(1000);
    await auraDemo.connect(alice).transfer(bob.address, 300);
    
    expect(await auraDemo.getBalance(alice.address)).to.equal(700);
    expect(await auraDemo.getBalance(bob.address)).to.equal(300);
    console.log("✅ Transfer test passed!");
  });

  it("Should create and vote on proposals", async function () {
    await auraDemo.connect(alice).mint(1000);
    await auraDemo.connect(alice).createProposal("Test Proposal");
    
    expect(await auraDemo.getProposalCount()).to.equal(1);
    expect(await auraDemo.proposalTitles(0)).to.equal("Test Proposal");
    
    await auraDemo.connect(alice).vote(0, 100);
    expect(await auraDemo.getProposalVotes(0)).to.equal(100);
    expect(await auraDemo.hasUserVoted(alice.address, 0)).to.be.true;
    
    console.log("✅ Proposal and voting test passed!");
  });
});
