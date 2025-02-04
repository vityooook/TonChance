import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { getSecureRandomBytes, keyPairFromSeed, KeyPair} from "@ton/crypto";
import { exitCode } from 'process';

describe('Lottery', () => {

    
    let code: Cell;

    let blockchain: Blockchain;
    let admin: SandboxContract<TreasuryContract>;
    let participate1: SandboxContract<TreasuryContract>;
    let participate2: SandboxContract<TreasuryContract>;
    let participate3: SandboxContract<TreasuryContract>;
    let lottery: SandboxContract<Lottery>;
    let keyPair: KeyPair;
    

    beforeAll(async () => {
        code = await compile('Lottery');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.now = 10;
        // blockchain.verbosity = {
        //     print: true,
        //     blockchainLogs: false,
        //     vmLogs: "vm_logs",
        //     // vmLogs: "none",
        //     debugLogs: true
        // }


        admin = await blockchain.treasury('deployer');
        participate1 = await blockchain.treasury('user1');
        participate2 = await blockchain.treasury('user2');
        participate3  = await blockchain.treasury('user3');

        const seed = await getSecureRandomBytes(32);
        keyPair = keyPairFromSeed(seed);

        lottery = blockchain.openContract(Lottery.createFromConfig({
            admin: admin.address,
            publicKey: keyPair.publicKey,
            commissionGameAdmin: 400, // 4%
            commissionGameRunners: 100, 
            minBet: toNano("0.1"),
            maxBet: toNano("1000"),
            maxParticipates: 100,
            gameTime: 180, // 3 min
            gameStartTime: blockchain.now + 10 
        }, code));


        const deployResult = await lottery.sendDeploy(admin.getSender(), toNano('1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: admin.address,
            to: lottery.address,
            deploy: true,
            success: true,
        });

        // await blockchain.setVerbosityForAddress(lottery.address, {
        //     blockchainLogs: false,
        //     vmLogs: 'vm_logs',
        //     debugLogs: true
        // })
    });

    it("place bets and start game", async () => {

        const storageBefore = await lottery.getStorageData();

        await lottery.sendBet(participate1.getSender(), toNano("1"))
        // ton should come back because the time is wrong
        expect(storageBefore.jackpot).toEqual((await lottery.getStorageData()).jackpot);

        blockchain.now = Number(storageBefore.gameStartTime)

        await lottery.sendBet(participate1.getSender(), toNano("1"))
        await lottery.sendBet(participate2.getSender(), toNano("4"))
        await lottery.sendBet(participate3.getSender(), toNano("0.5"))

        expect(storageBefore.participatesNumber).toBeLessThan((await lottery.getStorageData()).participatesNumber);

        blockchain.now = 20 + Number(storageBefore.gameTime)

        const startGame = await lottery.sendStartLottery(keyPair.secretKey, {
            gameNumber: Number(storageBefore.gameRound)
        });

        const storageAfter = await lottery.getStorageData();

        expect(startGame.transactions).toHaveTransaction({
            from: lottery.address,
            to: admin.address,
        });

        expect(startGame.transactions).toHaveTransaction({
            from: lottery.address,
            to: storageAfter.lastWinnerAddress
        });
        
        expect(storageAfter.jackpot).toEqual(0n);
        expect(storageAfter.gameRound).toEqual(storageBefore.gameRound + 1n);

    });
});
