import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Lottery', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Lottery');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let lottery: SandboxContract<Lottery>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        lottery = blockchain.openContract(Lottery.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await lottery.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: lottery.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and lottery are ready to use
    });
});
