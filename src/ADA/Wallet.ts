import {
  AppWallet,
  Asset,
  BlockfrostProvider,
  Quantity,
  Transaction,
  Unit,
  keepRelevant,
  largestFirst,
  resolvePrivateKey,
} from '@meshsdk/core'
import axios, { AxiosInstance } from 'axios'
import { entropyToMnemonic } from 'bip39-light'
import { BigNumber } from 'bignumber.js'

function createPrivateKey(templatePrivateKey: string, password: string) {
  const crypto = require('crypto')
  const hash = crypto
    .createHash('sha256')
    .update(templatePrivateKey + password, 'utf8')
    .digest('hex')
  return hash.substring(0, 64) // Truncate to 64 characters (32 bytes)
}

function format(from: number, to: number, amount: number | string | BigNumber) {
  const bigNum = new BigNumber(amount)
  if (bigNum.isNaN()) {
    return amount
  }

  return bigNum.multipliedBy(Math.pow(10, from)).dividedBy(Math.pow(10, to))
}

/**
 * Wallet class who respect the WalletLibraryInterface for Keepix
 */
export class Wallet {
  private wallet: AppWallet
  private mnemonic?: string
  private type: string
  private keepixTokens?: { coins: any; tokens: any }
  private apiKey?: any
  private provider: BlockfrostProvider
  private privateKey: string

  private _axios: AxiosInstance

  constructor({
    password,
    mnemonic,
    privateKey,
    type,
    keepixTokens,
    apiKey,
    privateKeyTemplate = '0x2050939757b6d498bb0407e001f0cb6db05c991b3c6f7d8e362f9d27c70128b9',
  }: {
    password?: string
    mnemonic?: string
    privateKey?: string
    type: string
    keepixTokens?: { coins: any; tokens: any } // whitelisted coins & tokens
    apiKey: string
    privateKeyTemplate?: string
  }) {
    this.type = type
    this.keepixTokens = keepixTokens
    this.apiKey = apiKey
    this.provider = new BlockfrostProvider(apiKey)

    this._axios = axios.create({
      baseURL: `https://cardano-${apiKey.slice(0, 7)}.blockfrost.io/api/v0`,
      headers: { project_id: apiKey },
    })

    // from password
    if (password !== undefined) {
      const newEntropyKey = createPrivateKey(privateKeyTemplate, password)
      this.mnemonic = entropyToMnemonic(newEntropyKey)
      this.privateKey = resolvePrivateKey(this.mnemonic.split(' '))
      this.wallet = new AppWallet({
        networkId: 0,
        fetcher: this.provider,
        submitter: this.provider,
        key: {
          type: 'mnemonic',
          words: this.mnemonic.split(' '),
        },
      })
      return
    }
    // from mnemonic
    if (mnemonic !== undefined) {
      this.mnemonic = mnemonic
      this.privateKey = resolvePrivateKey(this.mnemonic.split(' '))
      this.wallet = new AppWallet({
        networkId: 0,
        fetcher: this.provider,
        submitter: this.provider,
        key: {
          type: 'mnemonic',
          words: this.mnemonic.split(' '),
        },
      })
      return
    }
    // from privateKey only
    if (privateKey !== undefined) {
      this.mnemonic = undefined
      this.privateKey = privateKey
      this.wallet = new AppWallet({
        networkId: 0,
        fetcher: this.provider,
        submitter: this.provider,
        key: {
          type: 'root',
          bech32: privateKey,
        },
      })
      return
    }
    // Random
    const words = AppWallet.brew()
    this.mnemonic = words.join(' ')
    this.privateKey = resolvePrivateKey(words)
    this.wallet = new AppWallet({
      networkId: 0,
      fetcher: this.provider,
      submitter: this.provider,
      key: {
        type: 'mnemonic',
        words,
      },
    })
  }

  // PUBLIC

  public getPrivateKey() {
    return this.privateKey
  }

  public getMnemonic() {
    return this.mnemonic
  }

  public getAddress() {
    return this.wallet.getPaymentAddress()
  }

  public getProdiver() {
    return this.provider
  }

  public getConnectedWallet = () => {
    return this.wallet
  }

  // always display the balance in 0 decimals like 1.01 ADA
  public async getCoinBalance(walletAddress?: string) {
    try {
      const amounts = await this.fetchAssetsAmount(
        walletAddress ?? this.getAddress(),
      )
      const balance =
        amounts?.find((item: any) => item?.unit === 'lovelace')?.quantity ?? '0'
      return format(0, 6, balance).toString()
    } catch (err) {
      return '0'
    }
  }

  public async getTokenInformation(tokenAddress: string) {
    try {
      const { data } = await this._axios.get(`assets/${tokenAddress}`)

      return {
        name: data?.asset_name
          ? Buffer.from(data.asset_name, 'hex').toString()
          : undefined,
        symbol: data?.asset_name
          ? Buffer.from(data.asset_name, 'hex').toString()
          : undefined,
        decimals: data?.metadata?.decimals,
      }
    } catch (err) {
      console.log(err)
      return undefined
    }
  }

  // always display the balance in 0 decimals like 1.01 RPL
  public async getTokenBalance(tokenAddress: string, walletAddress?: string) {
    try {
      const metadata = await this.fetchAssetMetadata(tokenAddress)
      const amounts = await this.fetchAssetsAmount(
        walletAddress ?? this.getAddress(),
      )

      console.log(await this.getTokenInformation(tokenAddress))

      const balance =
        amounts?.find(
          (item: any) =>
            item?.unit?.toLowerCase() === tokenAddress.toLowerCase(),
        )?.quantity ?? 0
      return format(0, metadata?.decimals ?? 0, balance).toString()
    } catch (err) {
      return '0'
    }
  }

  public async sendCoinTo(receiverAddress: string, amount: string) {
    try {
      const parsedAmount = format(6, 0, amount).toString()
      const utxos = await this.provider.fetchAddressUTxOs(this.getAddress())
      const selectedUtxos = largestFirst(parsedAmount, utxos, true)
      const tx = new Transaction({ initiator: this.wallet })
        .sendLovelace(receiverAddress, parsedAmount.toString())
        .setTxInputs(selectedUtxos)

      const unsignedTx = await tx.build()
      const signedTx = await this.wallet.signTx(unsignedTx)
      const txHash = await this.wallet.submitTx(signedTx)

      return { success: true, description: txHash }
    } catch (err) {
      console.log(err)
      return { success: false, description: `Transaction Failed: ${err}` }
    }
  }

  public async sendTokenTo(
    tokenAddress: string,
    receiverAddress: string,
    amount: string,
  ) {
    try {
      const metadata = await this.fetchAssetMetadata(tokenAddress)
      const parsedAmount = format(metadata?.decimals ?? 0, 0, amount).toString()

      const utxos = await this.provider.fetchAddressUTxOs(this.getAddress())
      const assetMap = new Map<Unit, Quantity>()
      assetMap.set(tokenAddress, parsedAmount)
      const selectedUtxos = keepRelevant(assetMap, utxos)

      const tx = new Transaction({ initiator: this.wallet })
        .sendAssets(receiverAddress, [
          <Asset>{
            unit: tokenAddress,
            quantity: parsedAmount,
          },
        ])
        .setTxInputs(selectedUtxos)

      const unsignedTx = await tx.build()
      const signedTx = await this.wallet.signTx(unsignedTx)
      const txHash = await this.wallet.submitTx(signedTx)
      console.log(txHash)

      return { success: true, description: txHash }
    } catch (err) {
      console.log(err)
      return { success: false, description: `Transaction Failed: ${err}` }
    }
  }

  private async fetchAssetMetadata(asset: string) {
    try {
      const { data } = await this._axios.get(`assets/${asset}`)

      return data?.metadata
    } catch (err) {
      return undefined
    }
  }

  private async fetchAssetsAmount(address: string) {
    try {
      const { data } = await this._axios.get(`addresses/${address}`)
      return data?.amount
    } catch (err) {
      return undefined
    }
  }
}
