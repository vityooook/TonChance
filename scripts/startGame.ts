import { Address, toNano } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import { compile, NetworkProvider } from '@ton/blueprint';
import { keyPairFromSeed, keyPairFromSecretKey } from "@ton/crypto"

export async function run(provider: NetworkProvider) {
    const secretKeyHex = "805a194cef81629a086f5326c82d9dc1b42281e240d9883617f5b7eb856a176413e6c27974df08b075025cbc8a7e8148b5c4c238ee65f72942da9de30351bbf0"
    const lotteryAddress = Address.parse("EQAlpZM1k-a5PCI9UNYgOD5pPGreUnQfxd7fuTuD5lbTdfxi")
    const keyPair = keyPairFromSecretKey(Buffer.from(secretKeyHex, 'hex'));

    const lottery = provider.open(Lottery.createFromAddress(lotteryAddress))

    const storageData = await lottery.getStorageData();

    await lottery.sendStartLottery(keyPair.secretKey, {
        gameRound: Number(storageData.gameRound)
    })
}
