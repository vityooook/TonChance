import { TonClient, Address, beginCell } from "@ton/ton";
import { sign, keyPairFromSecretKey } from "@ton/crypto"

const client = new TonClient({
    endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    apiKey: "" // you can get an api key from @tonapibot bot in Telegram
});

async function sendStartLottery(
    secretKey: Buffer,
    contractAddress: Address,
    opts: {
        gameRound: number;
        runnerAddress?: Address;
    }
) {
    let messageInner;

    if (opts.runnerAddress) {
        messageInner = beginCell()
            .storeUint(opts.gameRound, 32)
            .storeAddress(opts.runnerAddress)
            .endCell();
    } else {
        messageInner = beginCell()
            .storeUint(opts.gameRound, 32)
            .endCell();
    }

    const body = beginCell()
            .storeRef(messageInner)
            .storeBuffer(sign(messageInner.hash(), secretKey))
        .endCell();

        const message = beginCell()
        .storeUint(0b10, 2) // indicate that it is an incoming external message
        .storeUint(0, 2) // src -> addr_none
        .storeAddress(contractAddress)
        .storeCoins(0) // Import fee
        .storeBit(0) // We have State Init
        .storeBit(1) // We store Message Body as a reference
        .storeRef(body) // Store Message Body as a reference
        .endCell();
    
    await client.sendFile(message.toBoc());
}


// (async () => {
//         const secretKeyHex = "fa72ccfc22b007298495e39bac81bc4b2198124a6344d3402bc2a3452d54fe59a5ef0ba76a3a2df905882d20ed9c8f402de86a7fba3ae2d24bd358ef8932c589"
//         const lotteryAddress = Address.parse("EQBungLe0bpnWcYdEDbgbZDjGed6Un593K56coYhJBzR_Ps1")
//         const keyPair = keyPairFromSecretKey(Buffer.from(secretKeyHex, 'hex'));

//         await sendStartLottery(
//             keyPair.secretKey,
//             lotteryAddress,
//             {
//                 gameRound: 2,
//                 runnerAddress: Address.parse("0QAFyfwn13L8oi30vdWBV41zFaHzCa6mJpVEjCeaDUAqmGcO")
//             }
//         );
//     })();