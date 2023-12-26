import { Wallet } from './Wallet'

describe('basic wallet', () => {
  const mnemonic =
    'celery net original hire stand seminar cricket reject draft hundred hybrid dry three chair sea enable perfect this good race tooth junior beyond since'
  const privateKey =
    'xprv19rp4pgeynwhp3sunhhj0pccs9aycqqe0ha3md7uqjhc26ylwdf28dl465wacsfvfecvse4r29ys8q3rskdv6hcpze2wz3q3qp0zug75dwxhdyn2zaaxrtdcy0erly6mwernynu36lhnpm8cvak07hdg68cypc665'
  const address =
    'addr_test1vp56y7ejmwfjqu9k5pgcwpp855rc5zx3ytkf3w83u6w2dyqrdr5da'

  it('can generate same wallet', async () => {
    const wallet = new Wallet({
      password: 'toto',
      type: 'ada',
      apiKey: 'preprodbKt0gesKbzVfV2EJx5Sr8h7P36Mbt3ll',
    })
    expect(wallet.getAddress()).toEqual(address)
    expect(wallet.getPrivateKey()).toEqual(privateKey)
    expect(wallet.getMnemonic()).toEqual(mnemonic)
  })

  it('can generate with Mnemonic', async () => {
    const wallet = new Wallet({
      mnemonic,
      type: 'ada',
      apiKey: 'preprodbKt0gesKbzVfV2EJx5Sr8h7P36Mbt3ll',
    })

    expect(wallet.getAddress()).toEqual(address)
    expect(wallet.getPrivateKey()).toEqual(privateKey)
    expect(wallet.getMnemonic()).toEqual(mnemonic)
  })

  it('can generate with PrivateKey', async () => {
    const wallet = new Wallet({
      privateKey,
      type: 'ada',
      apiKey: 'preprodbKt0gesKbzVfV2EJx5Sr8h7P36Mbt3ll',
    })

    expect(wallet.getAddress()).toEqual(address)
    expect(wallet.getPrivateKey()).toEqual(privateKey)
    expect(wallet.getMnemonic()).toBe(undefined)
  })

  it('can generate with random', async () => {
    const wallet = new Wallet({
      type: 'ada',
      apiKey: 'preprodbKt0gesKbzVfV2EJx5Sr8h7P36Mbt3ll',
    })

    expect(wallet.getAddress()).toBeDefined()
    expect(wallet.getPrivateKey()).toBeDefined()
    expect(wallet.getMnemonic()).toBeDefined()
  })

  it('can getTokenInformation', async () => {
    const wallet = new Wallet({
      mnemonic,
      type: 'ada',
      apiKey: 'preprodbKt0gesKbzVfV2EJx5Sr8h7P36Mbt3ll',
    })

    expect(
      await wallet.getTokenInformation(
        'aa8fb4358cfc9a167738d45d770cc4d777a05d5a2afa7f7840609f1e6c70',
      ),
    ).toEqual({ name: 'lp', symbol: 'lp', decimals: 0 })
  })

  it('can getBalance', async () => {
    const wallet = new Wallet({
      mnemonic,
      type: 'ada',
      apiKey: 'preprodbKt0gesKbzVfV2EJx5Sr8h7P36Mbt3ll',
    })
    expect(
      await wallet.getCoinBalance(
        'addr_test1qp56y7ejmwfjqu9k5pgcwpp855rc5zx3ytkf3w83u6w2dyyf480xvenplvfftvdm3enxgyfzeqz9z50j8kfracd8tlksx7fcy6',
      ),
    ).toEqual('10000')
  })

  it('can getTokenBalance', async () => {
    const wallet = new Wallet({
      mnemonic,
      type: 'ada',
      apiKey: 'preprodbKt0gesKbzVfV2EJx5Sr8h7P36Mbt3ll',
    })
    expect(
      await wallet.getTokenBalance(
        'aa8fb4358cfc9a167738d45d770cc4d777a05d5a2afa7f7840609f1e6c70',
        'addr_test1wq3qkajpxlrlgt8d8axge2y0zfugsahn2lp6jctt6vdaqnsesz2dg',
      ),
    ).toEqual('999999800')
  })

  it('can estimate sendCoin', async () => {
    const wallet = new Wallet({
      mnemonic,
      type: 'ada',
      apiKey: 'preprodbKt0gesKbzVfV2EJx5Sr8h7P36Mbt3ll',
    })
    const txResult = await wallet.sendCoinTo(
      'addr_test1qpa0kx83ywtmgzpkpwufas98qltplh8l5jalztg7peg2cvhyylmggv2p802epq3t4yhpp7cxqgf2shvvlvkavd6rh28slzmmzq',
      '100',
    )
    expect(txResult.success).toBe(true)
  })

  it('can estimate sendToken', async () => {
    const wallet = new Wallet({
      mnemonic,
      type: 'ada',
      apiKey: 'preprodbKt0gesKbzVfV2EJx5Sr8h7P36Mbt3ll',
    })
    const txResult = await wallet.sendTokenTo(
      '65a938b778af9a654b2a005d8ea902485f16a878ff81c458eaa7bdbb494e4459',
      'addr_test1vqslp49gcrvah8c9vjpxm4x9j7s2m4zw0gkscqh0pqjg4wcjzvcfr',
      '10',
    )
    expect(txResult.success).toBe(false)
  })
})
