import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Dictionary } from '@ton/core';

export type LotteryConfig = {
    admin: Address;
    gameTime: number;
    minBet: bigint;
    maxBet: bigint;
    maxParticipates: number;


};

export function lotteryConfigToCell(config: LotteryConfig): Cell {
    return beginCell()
        .storeDict(Dictionary.empty(), Dictionary.Keys.BigUint(64), Dictionary.Values.Cell())
        .storeCoins(0)
        .storeAddress(config.admin)
        .storeUint(config.gameTime, 16)
        .storeCoins(config.minBet)
        .storeCoins(config.maxBet)
        .storeUint(config.maxParticipates, 8)
        .storeUint(0, 8)
        .storeUint(0, 16)
        .storeInt(0, 2)
        .storeUint(0, 32)
        .storeUint(0, 32)
        .storeAddress(null)
    .endCell();
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


    async sendStartLottery(
        provider: ContractProvider,
        opts: {
            game_number: number;
        }
    ) {
       
        await provider.external(
            beginCell()
                .storeRef(
                    beginCell()
                        .storeUint(opts.game_number, 32)
                    .endCell()
                )
            .endCell()
        );
    }
}
