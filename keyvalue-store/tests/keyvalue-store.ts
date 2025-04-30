import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { KeyvalueStore } from "../target/types/keyvalue_store";

describe("keyvalue-store", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.keyvalueStore as Program<KeyvalueStore>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.createKeyValueStore("key", "value").rpc();
    console.log("Your transaction signature", tx);
  });

  it("Is updated!", async () => {
    const tx = await program.methods.updateKeyValueStore("value2").rpc();
    console.log("Your transaction signature", tx);
  });

  it("Is deleted!", async () => {
    const tx = await program.methods.deleteKeyValueStore().rpc();
    console.log("Your transaction signature", tx);
  });
});
