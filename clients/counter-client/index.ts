import {
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    Keypair,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction, TransactionInstruction
} from "@solana/web3.js";
import {RPC_URL} from "../distribute-tokens/config";
import {airdrop} from "../airdrop";
import * as borsh from 'borsh';

const CONTRACT_PROGRAM_ID = "H7yPiw1m7mcnBFbQdLXnLDdN37vAP9csKXe9ckSTxUo8";

class GreetingAccount {
    counter = 0;
    constructor(fields: {counter: number} | undefined = undefined) {
        if (fields) {
            this.counter = fields.counter;
        }
    }
}

const GreetingSchema = new Map([
    [GreetingAccount, {kind: 'struct', fields: [['counter', 'u32']]}],
]);

const createDataAccount = async (connection, parentAccount): Promise<Keypair> => {
    const dataAccount = Keypair.generate();
    const createAccountInstruction = await SystemProgram.createAccount({
        fromPubkey: parentAccount.publicKey,
        newAccountPubkey: dataAccount.publicKey,
        lamports: 1000000000,
        space: 4,
        programId: new PublicKey(CONTRACT_PROGRAM_ID)
    });
    const transaction = new Transaction();
    transaction.add(createAccountInstruction);
    await sendAndConfirmTransaction(connection, transaction, [parentAccount, dataAccount]);
    return dataAccount;
}

export const callCounter = async(parentAccount: Keypair) => {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    await airdrop(parentAccount.publicKey, 2);
    const dataAccount = new PublicKey("7X8R5iZeQe85uSBUvXK7aCASV7dXkPBbpFtYAcGapGZu");

    const instruction = new TransactionInstruction({
        keys: [{pubkey: dataAccount, isSigner: false, isWritable: true}],
        programId: new PublicKey(CONTRACT_PROGRAM_ID),
        data: Buffer.alloc(0), // All instructions are hellos
    });

    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [parentAccount],
    );


    // Read data
    const accountInfo = await connection.getAccountInfo(dataAccount);

    const greeting = borsh.deserialize(
        GreetingSchema,
        GreetingAccount,
        accountInfo.data,
    );

    console.log(
        dataAccount.toBase58(),
        'has been greeted',
        greeting.counter,
        'time(s)',
    );

}

callCounter(Keypair.generate());