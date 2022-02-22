import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction
} from "@solana/web3.js";
import {airdrop} from "../airdrop";
import {showBalance} from "../show-balance";

export const transferSol = async(from: Keypair, to: PublicKey, amount: number) => {
    const connection = new Connection("http://localhost:8899", 'confirmed');
    const transaction = new Transaction();

    const instruction = SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: LAMPORTS_PER_SOL * amount
    });

    transaction.add(instruction);
    transaction.add(instruction);
    await sendAndConfirmTransaction(connection, transaction, [
        from
    ])
    console.log("Done");
}

const secret = Uint8Array.from([2,229,102,209,108,147,96,53,250,48,19,10,61,8,182,37,240,215,67,26,118,123,223,27,197,255,171,49,41,151,31,37,114,111,107,170,88,220,208,172,13,228,39,128,212,93,123,239,56,175,124,20,57,3,43,102,47,85,65,79,231,94,12,65])
const fromKeyPair = Keypair.fromSecretKey(secret);
const toPublicKey = new PublicKey("9zxsbhMVzGhidwqDUi4HjMP4zTSupirTJiuz4hcZ8op1");

(async() => {
    await airdrop(fromKeyPair.publicKey, 50);
    const initBalance = await showBalance(fromKeyPair.publicKey);
    console.log(`Initial balance of from wallet is ${initBalance}`);
    const initBalanceTo = await showBalance(toPublicKey);
    console.log(`Initial balance of to wallet is ${initBalanceTo}`);

    // await transferSol(fromKeyPair, toPublicKey, 50);
    //
    // const initBalance2 = await showBalance(fromKeyPair.publicKey);
    // console.log(`Post balance of from wallet is ${initBalance2}`);
    // const initBalanceTo2 = await showBalance(toPublicKey);
    // console.log(`Post balance of to wallet is ${initBalanceTo2}`);
})()


