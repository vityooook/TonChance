import { TonClient, Address, Dictionary, DictionaryValue } from "@ton/ton";

const client = new TonClient({
    endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    apiKey: "" // you can get an api key from @tonapibot bot in Telegram
});

type MyDictionaryValue = {
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

async function getStorageData(address: Address) {
    const stack = (await client.runMethod(address, "get_storage_data", [])).stack;

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
        lastWinnerAddress: stack.readAddressOpt(),
        listParticipates: stack.readCellOpt(),
        lastListParticipates: stack.readCellOpt()
    }

    if (res.listParticipates) {
        res.listParticipates = res.listParticipates.beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), myDictParser())
    }

    if (res.lastListParticipates) {
        res.lastListParticipates = res.lastListParticipates.beginParse().loadDictDirect(Dictionary.Keys.BigUint(256), myDictParser())
    }
    return res;
}

// (async () => {
//     var t = await getStorageData(Address.parse("kQAlpZM1k-a5PCI9UNYgOD5pPGreUnQfxd7fuTuD5lbTdUfo"));
//     console.log(t);
// })();
