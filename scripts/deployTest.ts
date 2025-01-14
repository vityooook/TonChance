import { toNano } from '@ton/core';
import { Test } from '../wrappers/Test';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const test = provider.open(Test.createFromConfig({}, await compile('Test')));

    await test.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(test.address);

    // run methods on `test`
}
