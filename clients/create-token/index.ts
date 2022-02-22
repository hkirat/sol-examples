import {Token,TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {Keypair, Transaction, sendAndConfirmTransaction, PublicKey, Connection, clusterApiUrl} from '@solana/web3.js';
import {airdrop} from "../airdrop";

const createMint = async(mintWallet) => {
    const connection = new Connection("http://localhost:8899", 'confirmed');
    const creatorToken = await Token.createMint(connection, mintWallet, mintWallet.publicKey, null, 8, TOKEN_PROGRAM_ID);
    return creatorToken.publicKey;
}

const transferTokens = async (tokenAddress: PublicKey, mintWallet: Keypair, receiver: PublicKey) => {
    const connection = new Connection("http://localhost:8899", 'confirmed');
    const creatorToken = new Token(connection, tokenAddress, TOKEN_PROGRAM_ID, mintWallet);

    const mintTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(mintWallet.publicKey);
    await creatorToken.mintTo(mintTokenAccount.address, mintWallet.publicKey, [], 100000000);
    const receiverTokenAccount = await creatorToken.getOrCreateAssociatedAccountInfo(receiver);
    console.log(`ReceiverTokenAccount address: ${receiverTokenAccount.address}`);
    const transaction = new Transaction().add(
        Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            mintTokenAccount.address,
            receiverTokenAccount.address,
            mintWallet.publicKey,
            [],
            100000000
        )
    );
    await sendAndConfirmTransaction(connection, transaction, [mintWallet], { commitment: "confirmed" });
}

(async () => {
    const mintWallet = await Keypair.generate();
    await airdrop(mintWallet.publicKey, 2);
    const creatorTokenAddress = await createMint(mintWallet);
    await transferTokens(creatorTokenAddress, mintWallet, new PublicKey("7WhniuDu9K2g7bog7JN2HuU1QkRcDv2ppDbrmRCf51sk"))

    console.log(`Creator token address: ${creatorTokenAddress}`);
    console.log(`mintWallet address: ${mintWallet.publicKey}`);
})();