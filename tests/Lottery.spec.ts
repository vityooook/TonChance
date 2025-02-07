import { Blockchain, SandboxContract, TreasuryContract, internal, printTransactionFees } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Lottery } from '../wrappers/Lottery';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { getSecureRandomBytes, keyPairFromSeed, KeyPair } from "@ton/crypto";
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
            minBet: toNano("0.25"),
            maxBet: toNano("100"),
            maxParticipates: 100,
            gameTime: 180, // 3 min
            gameStartTime: blockchain.now + 10 
        }, code));


        const deployResult = await lottery.sendDeploy(admin.getSender(), toNano('0.05'));

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

        blockchain.now = Number(storageBefore.gameStartTime);

        await lottery.sendBet(participate1.getSender(), toNano("1"));
        await lottery.sendBet(participate2.getSender(), toNano("4"));
        await lottery.sendBet(participate3.getSender(), toNano("0.5"));

        expect(storageBefore.participatesNumber).toBeLessThan((await lottery.getStorageData()).participatesNumber);

        blockchain.now = 20 + Number(storageBefore.gameTime);

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


    it("double bet check", async () => {
        const storageBefore = await lottery.getStorageData();

        blockchain.now = Number(storageBefore.gameStartTime);

        await lottery.sendBet(participate1.getSender(), toNano("1"));
        await lottery.sendBet(participate1.getSender(), toNano("2"));

        const storageAfter = await lottery.getStorageData();

        expect(storageAfter.participatesNumber).toEqual(1n);
    });


    it("check time", async () => {
        const storageBefore = await lottery.getStorageData();

        await lottery.sendBet(participate1.getSender(), toNano("1"));
        // ton should come back because the time is wrong
        expect(storageBefore.jackpot).toEqual((await lottery.getStorageData()).jackpot);

        blockchain.now = Number(storageBefore.gameStartTime);

        await lottery.sendBet(participate1.getSender(), toNano("1"));

        const storageAfter = await lottery.getStorageData();

        expect(storageBefore.jackpot).not.toEqual(storageAfter.jackpot);
    });


    it("check bet amount restriction", async () => {
        const storageBefore = await lottery.getStorageData();

        blockchain.now = Number(storageBefore.gameStartTime);
        // too little
        await lottery.sendBet(participate1.getSender(), toNano("0.24"));
        // too much
        await lottery.sendBet(participate1.getSender(), toNano("101"));

        const storageAfter = await lottery.getStorageData();

        expect(storageBefore.jackpot).toEqual(storageAfter.jackpot);
    });


    it("check number of participants", async () => {
        const participants = [];
    
        for (let i = 0; i < 99; i++) {
            const participant = await blockchain.treasury(`${i}`); 
            participants.push(participant);
        }
    
        const storageBefore = await lottery.getStorageData();
        blockchain.now = Number(storageBefore.gameStartTime);
    
        for (const participant of participants) {
            const msg = await blockchain.sendMessage(internal({
                from: participant.address,
                to: lottery.address,
                value: toNano("1")
            }));
        }

        const lastBet = await lottery.sendBet(participate1.getSender(), toNano("1"));

        expect(lastBet.transactions).toHaveTransaction({ // should back ton 
            from: lottery.address,
            to: participate1.address,
            success: true
        })
    
        const storageAfter = await lottery.getStorageData();

        expect(storageAfter.participatesNumber).toEqual(100n);
        expect(storageAfter.jackpot).toEqual(toNano("100"));

        blockchain.now = 20 + Number(storageBefore.gameTime);

        const startGame = await lottery.sendStartLottery(keyPair.secretKey, {
            gameNumber: Number(storageBefore.gameRound)
        });

        printTransactionFees(startGame.transactions)
    });
    


    it("check pause game", async () => {
        const storageBefore = await lottery.getStorageData();

        blockchain.now = Number(storageBefore.gameStartTime);


        const storageAfter = await lottery.getStorageData();

    });
});
