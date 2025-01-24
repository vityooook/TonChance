import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Lottery', () => {

    
    let code: Cell;

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let user3: SandboxContract<TreasuryContract>;
    let lottery: SandboxContract<Lottery>;
    

    beforeAll(async () => {
        code = await compile('Lottery');

        blockchain = await Blockchain.create();
        
        // blockchain.verbosity = {
        //     print: true,
        //     blockchainLogs: false,
        //     vmLogs: "vm_logs",
        //     // vmLogs: "none",
        //     debugLogs: true
        // }


        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        user3 = await blockchain.treasury('user3');

        lottery = blockchain.openContract(Lottery.createFromConfig({
            admin: deployer.address,
            gameTime: 60,
            minBet: toNano("0.25"),
            maxBet: toNano("100"),
            maxParticipates: 100
        }, code));

        await blockchain.setVerbosityForAddress(lottery.address, {
            blockchainLogs: false,
            vmLogs: 'vm_logs',
            debugLogs: true
        })

        const deployResult = await lottery.sendDeploy(deployer.getSender(), toNano('1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: lottery.address,
            deploy: true,
            success: true,
        });
    });
    // beforeEach(async () => {
        
    // });

    it('three more bet', async () => {

        const message = await lottery.sendBet(user1.getSender(), toNano("0.25"));
        await lottery.sendBet(user2.getSender(), toNano("2"));
        await lottery.sendBet(user3.getSender(), toNano("10"));

        expect(message.transactions).toHaveTransaction({
            from: user1.address,
            to: lottery.address,
            success: true
        })

    });

    it("start game", async () => {
        const message = await lottery.sendStartLottery({game_number: 0});

        expect(message.transactions).toHaveTransaction({
            from: lottery.address,
            to: lottery.address,
            success: true
        })

    });
});
