async function main() {
    const Kickstarter = await ethers.getContractFactory("Kickstarter");
 
    const kickstarterContract = await Kickstarter.deploy("Kickstarter App", 20, 2000000000000000);

    console.log("Contract deployed to address:", kickstarterContract.address);
 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });