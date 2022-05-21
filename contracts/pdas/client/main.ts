import {checkProgram, establishConnection, establishPayer, getAddress, initialize, updateAddress} from "./index";

const main = async() => {
    await establishConnection();
    await establishPayer();
    await checkProgram();
    // await initialize();
    await updateAddress("1234 Mohali, India");
    await getAddress();
}

main()