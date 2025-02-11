import { Address, toNano } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import { compile, NetworkProvider } from '@ton/blueprint';
import { keyPairFromSeed, getSecureRandomBytes } from "@ton/crypto"

export async function run(provider: NetworkProvider) {
    const keyPair  = keyPairFromSeed(await getSecureRandomBytes(32));

    const lottery = provider.open(Lottery.createFromConfig({
            admin: Address.parse("0QAFyfwn13L8oi30vdWBV41zFaHzCa6mJpVEjCeaDUAqmGcO"),
            publicKey: keyPair.publicKey,
            commissionGameAdmin: 400, // 4%
            commissionGameRunners: 100, // 1%
            minBet: toNano("0.25"),
            maxBet: toNano("20"),
            maxParticipates: 100,
            gameTime: 120, // 2 min
            gameStartTime: Math.floor(Date.now() / 1000)
    }, await compile('Lottery')));

    await lottery.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(lottery.address);

    console.log(keyPair.secretKey.toString('hex'));
    // EQAlpZM1k-a5PCI9UNYgOD5pPGreUnQfxd7fuTuD5lbTdfxi
    // 805a194cef81629a086f5326c82d9dc1b42281e240d9883617f5b7eb856a176413e6c27974df08b075025cbc8a7e8148b5c4c238ee65f72942da9de30351bbf0
    // run methods on `lottery`
}
