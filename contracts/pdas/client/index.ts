import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
  } from '@solana/web3.js';
import * as borsh from 'borsh';
import {getPayer, getRpcUrl} from './utils';

const MAX_SIZE = 1000;

const PARENT_CONTRACT_ID = "9xvFLBLM8bhnh86heynttThpUbW4FC5nkErSnQxBrScZ";
const ADDRESS_CONTRACT_ID = "3Ff2JNLJTjK7irW7U79HkvZLsakXuTJKG115cAE2hijz";
const PROFILE_CONTRACT_ID = "9xvFLBLM8bhnh86heynttThpUbW4FC5nkErSnQxBrScZ";

let connection;
let payer: Keypair;
let programId: PublicKey;
let addressContract: PublicKey;
let profileContract: PublicKey;
let addressProgramId: PublicKey;
let userProfileProgramId: PublicKey;

class AddressAccount {
    address : Uint8Array = new Uint8Array([]);
    constructor(fields: {address: Uint8Array} | undefined = undefined) {
        if (fields) {
            this.address = fields.address;
        }
    }
}

const AddressSchema = new Map([
    [AddressAccount, {kind: 'struct', fields: [['address', [512]]]}],
]);


const strToBuffer = (str, len) => {
    const buf = new Buffer(len);
    buf.write(str);
    return buf;
}


/**
 * Establish a connection to the cluster
 */
 export async function establishConnection(): Promise<void> {
    const rpcUrl = await getRpcUrl();
    connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
  }
  

/**
 * Establish an account to pay for everything
 */
export async function establishPayer(): Promise<void> {
    let fees = 0;
    if (!payer) {
      const {feeCalculator} = await connection.getRecentBlockhash();
  
      // Calculate the cost to fund the greeter account
      fees += await connection.getMinimumBalanceForRentExemption(MAX_SIZE);
  
      // Calculate the cost of sending transactions
      fees += feeCalculator.lamportsPerSignature * 100; // wag
  
      payer = await getPayer();
    }
  
    let lamports = await connection.getBalance(payer.publicKey);
    if (lamports < fees) {
      // If current balance is not enough to pay for fees, request an airdrop
      const sig = await connection.requestAirdrop(
        payer.publicKey,
        fees - lamports,
      );
      await connection.confirmTransaction(sig);
      lamports = await connection.getBalance(payer.publicKey);
    }
  
    console.log(
      'Using account',
      payer.publicKey.toBase58(),
      'containing',
      lamports / LAMPORTS_PER_SOL,
      'SOL to pay for fees',
    );
}



/**
 * Check if the hello world BPF program has been deployed
 */
 export async function checkProgram(): Promise<void> {
    programId = new PublicKey(PARENT_CONTRACT_ID);
    addressContract = new PublicKey(ADDRESS_CONTRACT_ID);
    profileContract = new PublicKey(PROFILE_CONTRACT_ID);

    const programInfo = await connection.getAccountInfo(programId);
    if (programInfo === null) {
        throw new Error(`Program not found`);
    } else if (!programInfo.executable) {
        throw new Error(`Program is not executable`);
    }
    console.log(`Using program ${programId.toBase58()}`);

    addressProgramId = (await PublicKey.findProgramAddress(
        [Buffer.from("address"), payer.publicKey.toBytes()],
        programId,
    ))[0];
    userProfileProgramId = (await PublicKey.findProgramAddress(
        [Buffer.from("profile"), payer.publicKey.toBytes()],
        programId
    ))[0];
    console.log`Address pda ${addressProgramId.toBase58()}`
    console.log`̈User profile pda ${userProfileProgramId.toBase58()}`
}

export async function initialize(): Promise<void> {
    const buffers = [Buffer.from(Int8Array.from([2]))];
    const data = Buffer.concat(buffers);
    const instruction = new TransactionInstruction({
        keys: [
            {pubkey: payer.publicKey, isSigner: true, isWritable: true},
            {pubkey: userProfileProgramId, isSigner: false, isWritable: true},
            {pubkey: addressProgramId, isSigner: false, isWritable: true},
            {pubkey: profileContract, isSigner: false, isWritable: false},
            {pubkey: addressContract, isSigner: false, isWritable: false},
            {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
        ],
        programId,
        data: data
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payer],
    );
}

export const updateAddress = async (address: string) => {
    const buffers = [Buffer.from(Int8Array.from([1])), strToBuffer(address, 512)];
    const data = Buffer.concat(buffers);
    const instruction = new TransactionInstruction({
        keys: [
            {pubkey: payer.publicKey, isSigner: true, isWritable: true},
            {pubkey: addressProgramId, isSigner: false, isWritable: true},
            {pubkey: addressContract, isSigner: false, isWritable: false},
        ],
        programId,
        data: data
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payer],
    );
}

export const getAddress = async () => {
    const accountInfo = await connection.getAccountInfo(addressProgramId);
    const address = borsh.deserialize(
        AddressSchema,
        AddressAccount,
        accountInfo.data,
    );

    console.log(new TextDecoder().decode(address.address))
}