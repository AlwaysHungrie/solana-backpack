import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { KeyvalueStore } from '../target/types/keyvalue_store'
import { assert, expect } from 'chai'

const getKeyValueStorePda = (
  payer: anchor.web3.Keypair,
  key: string,
  program: Program<KeyvalueStore>
) => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(key), payer.publicKey.toBuffer()],
    program.programId
  )[0]
}

describe('keyvalue-store', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())
  const provider = anchor.getProvider()
  const connection = provider.connection

  const program = anchor.workspace.keyvalueStore as Program<KeyvalueStore>
  const payer = provider.wallet.payer

  const anotherPayer = anchor.web3.Keypair.generate()
  const keyValueStorePda = getKeyValueStorePda(payer, 'hello', program)
  const anotherKeyValueStorePda = getKeyValueStorePda(
    anotherPayer,
    'hello',
    program
  )

  it('Create a key value store', async () => {
    await program.methods
      .createKeyValueStore('hello', 'world')
      .accounts({
        owner: payer.publicKey,
        keyValueStore: keyValueStorePda,
      } as any)
      .rpc()

    const keyValueStore = await program.account.keyValueStoreState.fetch(
      keyValueStorePda
    )
    expect(keyValueStore.key).to.equal('hello')
    expect(keyValueStore.value).to.equal('world')
  })

  it('Update the key value store', async () => {
    const tx = await program.methods
      .updateKeyValueStore('hello', 'world 1')
      .accounts({
        owner: payer.publicKey,
        keyValueStore: keyValueStorePda,
      } as any)
      .rpc()
    console.log('Your transaction signature', tx)

    const keyValueStore = await program.account.keyValueStoreState.fetch(
      keyValueStorePda
    )
    expect(keyValueStore.key).to.equal('hello')
    expect(keyValueStore.value).to.equal('world 1')
  })

  it('Delete the key value store', async () => {
    const tx = await program.methods
      .deleteKeyValueStore('hello')
      .accounts({
        owner: payer.publicKey,
        keyValueStore: keyValueStorePda,
      } as any)
      .rpc()
    console.log('Your transaction signature', tx)

    const keyValueStore = await program.account.keyValueStoreState.fetch(
      keyValueStorePda
    )

    assert.fail('Key value store should not exist')
  })

  it('Should allow someone else to update the key value store', async () => {
    // transfer 1 SOL to the anotherPayer from the payer
    const transferTx = await connection.requestAirdrop(
      anotherPayer.publicKey,
      anchor.web3.LAMPORTS_PER_SOL * 2
    )
    await connection.confirmTransaction(
      {
        signature: transferTx,
        ...(await connection.getLatestBlockhash()),
      },
      'confirmed'
    )

    await program.methods
      .createKeyValueStore('hello', 'world')
      .accounts({
        owner: anotherPayer.publicKey,
        keyValueStore: anotherKeyValueStorePda,
      } as any)
      .signers([anotherPayer])
      .rpc()

    const keyValueStore = await program.account.keyValueStoreState.fetch(
      anotherKeyValueStorePda
    )
    expect(keyValueStore.key).to.equal('hello')
    expect(keyValueStore.value).to.equal('world')

    const tx = await program.methods
      .updateKeyValueStore('hello', 'world 2')
      .accounts({
        owner: anotherPayer.publicKey,
        keyValueStore: anotherKeyValueStorePda,
      } as any)
      .signers([anotherPayer])
      .rpc()

    const updatedKeyValueStore = await program.account.keyValueStoreState.fetch(
      anotherKeyValueStorePda
    )
    expect(updatedKeyValueStore.key).to.equal('hello')
    expect(updatedKeyValueStore.value).to.equal('world 2')
  })

  it('Should not allow the payer to update the key value store', async () => {
    const tx = await program.methods
      .updateKeyValueStore('hello', 'world 3')
      .accounts({
        owner: payer.publicKey,
        keyValueStore: anotherKeyValueStorePda,
      } as any)
      .signers([payer])
      .rpc()
  })
})
