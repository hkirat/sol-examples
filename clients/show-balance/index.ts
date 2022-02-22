import {Connection, PublicKey, LAMPORTS_PER_SOL} from "@solana/web3.js";
import {RPC_URL} from "../distribute-tokens/config";

export const showBalance = async(publicKey: PublicKey) => {
    const connection = new Connection(RPC_URL, "confirmed");
    const response = await connection.getAccountInfo(publicKey);
    return response.lamports/LAMPORTS_PER_SOL;
}
