const { expect } = require("chai");

describe("Kickstarter contract", function () {

    let Kickstarter;
    let kickstarterContract;
    let owner;
    let project;
    let addr1;

    beforeEach(async function () {
        Kickstarter = await ethers.getContractFactory("Kickstarter");
        [owner, addr1] = await ethers.getSigners();

        kickstarterContract = await Kickstarter.connect(owner).deploy("Kickstarter App", 30, 2000000000000000);

        project = await kickstarterContract.project();
    });

    describe("Deployment", function () {

        it("should set the right owner", async function () {
            const owner = await kickstarterContract.owner();
            expect(owner).to.equal(project.owner);
        });

        it("should set the right name", function () {
            expect(project.name).to.equal("Kickstarter App");
        });

        it("should set raised to 0", function () {
            expect(project.raised).to.equal(0);
        });

        it("should set goal to the current amount", function () {
            expect(project.goal).to.equal(2000000000000000);
        });

        it("should set state to running", function () {
            expect(project.state).to.equal(0);
        })

    });

    describe("Donate", function () {

        it("should revert when amount is 0", async function () {
            await expect(kickstarterContract.donate(0)).to.be.reverted;
        });

        it("should revert when after deadline", async function () {
            const deadlineTx = await kickstarterContract.moveDeadline();
            await deadlineTx.wait();

            await expect(kickstarterContract.donate(100000)).to.be.reverted;
        });

        it("should donate to project", async function () {
            const tx = await kickstarterContract.connect(addr1).donate(100000);
            await tx.wait();

            const donationOf = await kickstarterContract.donationOf(addr1.address);
            const raised = await kickstarterContract.raised();

            expect(raised).to.equal(100000);
            expect(donationOf).to.be.equal(100000);
        });

        it("should add to donation when donating multiple times", async function () {
            const donateTx = await kickstarterContract.connect(addr1).donate(10000000);
            await donateTx.wait();

            const donateTx2 = await kickstarterContract.connect(addr1).donate(10000000);
            await donateTx2.wait();

            const donation = await kickstarterContract.donationOf(addr1.address);

            expect(donation).to.be.equal(20000000);
        });
    });

    describe("Refund", function () {

        it("should revert when trying to refund before deadline", async function () {
            await expect(kickstarterContract.connect(addr1).getRefund()).to.be.reverted;
        });

        it("should revert when funder didn't donate yet", async function () {
            const deadlineTx = await kickstarterContract.moveDeadline();
            await deadlineTx.wait();

            await expect(kickstarterContract.connect(addr1).getRefund()).to.have.reverted;
        });

        it("should be able to refund", async function () {
            const donateTx = await kickstarterContract.connect(addr1).donate(100000);
            await donateTx.wait();

            const deadlineTx = await kickstarterContract.moveDeadline();
            await deadlineTx.wait();

            const refundTx = await kickstarterContract.connect(addr1).getRefund();
            await refundTx.wait();

            const donationOf = await kickstarterContract.donationOf(addr1.address);

            expect(donationOf).to.be.equal(0);
        });
    });

    describe("Claim", function () {

        it("should revert when trying to claim before deadline", async function () {
            await expect(kickstarterContract.connect(owner).claim()).to.have.reverted;
        });

        it("should revert when trying to claim before meeting target", async function () {
            const donateTx = await kickstarterContract.connect(addr1).donate(200000000000000);
            await donateTx.wait();

            const deadlineTx = await kickstarterContract.moveDeadline();
            await deadlineTx.wait();

            await expect(kickstarterContract.connect(owner).claim()).to.have.reverted;
        });

        it("should not be able to claim when you are not the owner", async function () {
            const donateTx = await kickstarterContract.connect(addr1).donate(2000000000000000);
            await donateTx.wait();

            const deadlineTx = await kickstarterContract.moveDeadline();
            await deadlineTx.wait();

            await expect(kickstarterContract.connect(addr1).claim()).to.be.reverted;
        });

        it("should be able to claim", async function () {
            const donateTx = await kickstarterContract.connect(addr1).donate(2000000000000000);
            await donateTx.wait();

            const deadlineTx = await kickstarterContract.moveDeadline();
            await deadlineTx.wait();

            const claimTx = await kickstarterContract.connect(owner).claim();
            await claimTx.wait();
        });
    });
});