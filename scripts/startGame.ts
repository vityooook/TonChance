import { Address, toNano } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import { compile, NetworkProvider } from '@ton/blueprint';
import { keyPairFromSeed, keyPairFromSecretKey } from "@ton/crypto"

export async function run(provider: NetworkProvider) {
    const secretKeyHex = "fa72ccfc22b007298495e39bac81bc4b2198124a6344d3402bc2a3452d54fe59a5ef0ba76a3a2df905882d20ed9c8f402de86a7fba3ae2d24bd358ef8932c589"
    const lotteryAddress = Address.parse("EQBungLe0bpnWcYdEDbgbZDjGed6Un593K56coYhJBzR_Ps1")
    const keyPair = keyPairFromSecretKey(Buffer.from(secretKeyHex, 'hex'));

    const lottery = provider.open(Lottery.createFromAddress(lotteryAddress))

    const storageData = await lottery.getStorageData();

    await lottery.sendStartLottery(keyPair.secretKey, {
        gameRound: Number(storageData.gameRound),
        runnerAddress: Address.parse("0QAFyfwn13L8oi30vdWBV41zFaHzCa6mJpVEjCeaDUAqmGcO")
    })
}
