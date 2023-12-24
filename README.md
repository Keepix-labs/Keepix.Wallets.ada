# Keepix.Wallets.ADA

Library that respects the WalletLibraryInterface.  
This library is used to create wallets, hold coin and token balances and carry out transactions.

----------------------------------------------------------<br/>
<b>[Warning] No public API found for the moment</b> <br/>
----------------------------------------------------------<br/>

```js
class Wallet {
    constructor({}: {
        password?: string
        mnemonic?: string
        privateKey?: string
        type: string
        keepixTokens?: { coins: any; tokens: any } // whitelisted coins & tokens
        apiKey: string // blockfrost provider api key
        privateKeyTemplate?: string
    }) {}

    getPrivateKey: () => string;
    getMnemonic: () => string | undefined;
    getAddress: () => string;
    getProdiver: () => BlockfrostProvider;

    // returns like 1.01 (Always in readable value)
    getCoinBalance: (walletAddress?: string) => Promise<string>;
    // returns like 1.01 (Always in readable value)
    getTokenBalance: (tokenAddress: string, walletAddress?: string) => Promise<string>;

    getTokenInformation(tokenAddress: string) => Promise<any>;

    sendCoinTo: (receiverAddress: string, amount: string) => Promise<{ success: boolean, description: string }>;
    sendTokenTo: (tokenAddress: string, receiverAddress: string, amount: string) => Promise<{ success: boolean, description: string }>;
}

export interface WalletLibraryInterface {
    Wallet: typeof Wallet;
};
```
