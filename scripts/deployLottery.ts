import { toNano } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const lottery = provider.open(Lottery.createFromConfig({}, await compile('Lottery')));

    await lottery.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(lottery.address);

    // run methods on `lottery`
}
