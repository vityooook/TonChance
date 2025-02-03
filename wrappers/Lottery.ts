import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Dictionary, toNano, DictionaryValue } from '@ton/core';
import { sign } from "@ton/crypto";

export type LotteryConfig = {
    admin: Address;
    publicKey: number;
    commissionGameAdmin: number;
    commissionGameRunners: number;
    minBet: bigint;
    maxBet: bigint;
    maxParticipates: number;
    gameTime: number;
    gameStartTime: number;
};

export function lotteryConfigToCell(config: LotteryConfig): Cell {
    return beginCell()
        .storeAddress(config.admin)
        .storeUint(config.publicKey, 256)
        .storeRef(
            beginCell()
                .storeUint(config.commissionGameAdmin, 16)
                .storeUint(config.commissionGameRunners, 16)
                .storeCoins(config.maxBet)
                .storeCoins(config.maxBet)
                .storeUint(config.maxParticipates, 8)
                .storeUint(0, 32)
                .storeUint(config.gameTime, 32)
                .storeUint(config.gameStartTime, 32)
                .storeUint(1, 32)
                .storeUint(0, 32)
                .storeCoins(0)
                .storeAddress(null)
                .storeDict(Dictionary.empty(), Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
                .storeDict(Dictionary.empty(), Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
            .endCell()
        )
    .endCell();
}

export type MyDictionaryValue = {
    bet: bigint;
    address: Address;
}

function myDictParser(): DictionaryValue<MyDictionaryValue> {
    return {
        serialize: (src, buidler) => {
            buidler
                .storeCoins(src.bet) 
                .storeAddress(src.address)    
                .endCell();
        },
        parse: (src) => {
            return {
                bet: src.loadCoins(),   
                address: src.loadAddress(),  
            };
        }
    }
}


export class Lottery implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Lottery(address);
    }

    static createFromConfig(config: LotteryConfig, code: Cell, workchain = 0) {
        const data = lotteryConfigToCell(config);
        const init = { code, data };
        return new Lottery(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendBet(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
 

    async sendStopGame(provider: ContractProvider, via: Sender, round: number) {
        await provider.internal(via, {
            value: toNano("0.02"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32)
                .storeUint(round, 32)
            .endCell(),
        });
    }

    async sendChangeSittings(provider: ContractProvider, via: Sender, opts: {
        gameTime: number;
        minBet: bigint;
        maxBet: bigint;
        maxParticipates: number;
        commissionAdmin: number;
        commissionRunner: number;
        gameStartTime: number;
    }) {
        await provider.internal(via, {
            value: toNano("0.05"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(2, 32)
                .storeUint(opts.gameTime, 16)
                .storeCoins(opts.minBet)
                .storeCoins(opts.maxBet)
                .storeUint(opts.maxParticipates, 8)
                .storeUint(opts.commissionAdmin, 16)
                .storeUint(opts.commissionRunner, 16)
                .storeUint(opts.gameStartTime, 32)
            .endCell(),
        });
    }

    async sendChangeAdmin(provider: ContractProvider, via: Sender, AdminAddress: Address) {
        await provider.internal(via, {
            value: toNano("0.02"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(3, 32)
                .storeAddress(AdminAddress)
            .endCell(),
        });
    }

    async sendUpdateCodeAndData(provider: ContractProvider, via: Sender, Code: Cell, Data: Cell) {
        await provider.internal(via, {
            value: toNano("0.05"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(4, 32)
                .storeRef(Data)
                .storeRef(Code)
            .endCell(),
        });
    }

    // нужно добавить гет метод и external транзакцию

    async sendStartLottery(
        provider: ContractProvider,
        secretKey: Buffer,
        opts: {
            gameNumber: number;
            // runnerAddress: Address;
        }
    ) {
        const messageInner = beginCell()
            .storeUint(opts.gameNumber, 32)
            .endCell();
       
            await provider.external(
                beginCell()
                    .storeRef(messageInner)
                    .storeBuffer(sign(messageInner.hash(), secretKey))
                    .endCell()
            );
    }

    async getStorageData(provider: ContractProvider): Promise<any> {
        let { stack } = await provider.get('get_storage_data', []);
        let res: any = {
            adminAddress: stack.readAddress(),
            publicKey: stack.readBigNumber(),
            commissionAdmin: stack.readBigNumber(),
            commissionRunner: stack.readBigNumber(),
            minBet: stack.readBigNumber(),
            maxBet: stack.readBigNumber(),
            maxParticipates: stack.readBigNumber(),
            participatesNumber: stack.readBigNumber(),
            gameTime: stack.readBigNumber(),
            gameStartTime: stack.readBigNumber(),
            gameRound: stack.readBigNumber(),
            stopGameOnRound: stack.readBigNumber(),
            jackpot: stack.readBigNumber(),
            lastWinnerAddress: stack.readAddress(),
            listParticipates: stack.readCellOpt(),
            lastListParticipates: stack.readCellOpt()
        }

        if (res.lastListParticipates) {
            res.lastListParticipates =res.lastListParticipates.beginParse().loadDictDirect(Dictionary.Keys.Uint(256), myDictParser())
        }
    }

    async getStorageDвata(provider: ContractProvider) {
        let { stack } = await provider.get('get_storage_data', []);
        let res: any = {
            inited: stack.readBoolean(),
            poolId: stack.readBigNumber(),
            adminAddress: stack.readAddress(),
            creatorAddress: stack.readAddress(),
            stakeWalletCode: stack.readCell(),
            lockWalletAddress: stack.readAddress(),
            tvl: stack.readBigNumber(),
            tvlWithMultipliers: stack.readBigNumber(),
            minDeposit: stack.readBigNumber(),
            maxDeposit: stack.readBigNumber(),
            rewardJettons: stack.readCellOpt(),
            rewardJettonsCount: stack.readBigNumber(),
            rewardsDepositsCount: stack.readBigNumber(),
            lockPeriods: stack.readCellOpt(),
            whitelist: stack.readCellOpt(),
            unstakeFee: stack.readBigNumber(),
            collectedCommissions: stack.readBigNumber(),
            rewardsCommission: stack.readBigNumber(),
            version: stack.readBigNumber(),
        }
        
        if (res.rewardJettons) {
            res.rewardJettons = res.rewardJettons.beginParse().loadDictDirect(Dictionary.Keys.Address(), {});
        }
        if (res.lockPeriods) {
            res.lockPeriods = res.lockPeriods.beginParse().loadDictDirect(Dictionary.Keys.Uint(32), lockPeriodsValueParser());
        }
        if (res.whitelist) {
            res.whitelist = res.whitelist.beginParse().loadDictDirect(Dictionary.Keys.Address(), Dictionary.Values.Bool());
        }
        let k: StakingPoolConfig = res;
        
}
