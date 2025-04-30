#![allow(unexpected_cfgs)]
#![allow(clippy::result_large_err)]
use anchor_lang::prelude::*;

declare_id!("AkwgL7tnCrWdtfeCfiVBj15NfuNdbQ1R675uJDw6NEkF");

#[program]
pub mod keyvalue_store {
    use super::*;

    pub fn create_key_value_store(ctx: Context<CreateKeyValueStore>, 
        key: String, 
        value: String
    ) -> Result<()> {
        let key_value_store = &mut ctx.accounts.key_value_store;
        key_value_store.owner = *ctx.accounts.owner.key;
        key_value_store.key = key;
        key_value_store.value = value;
        Ok(())
    }

    pub fn update_key_value_store(ctx: Context<UpdateKeyValueStore>, 
        value: String
    ) -> Result<()> {
        let key_value_store = &mut ctx.accounts.key_value_store;
        key_value_store.value = value;
        Ok(())
    }

    pub fn delete_key_value_store(_ctx: Context<DeleteKeyValueStore>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(key: String, value: String)]
pub struct CreateKeyValueStore<'info> {
    #[account(
        init,
        seeds = [key.as_bytes(), owner.key().as_ref()],
        bump,
        payer = owner,
        space = 8 + KeyValueStoreState::INIT_SPACE,
    )]
    pub key_value_store: Account<'info, KeyValueStoreState>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(key: String, value: String)]
pub struct UpdateKeyValueStore<'info> {
    #[account(
        mut,
        seeds = [key.as_bytes(), owner.key().as_ref()],
        bump,
        realloc = 8 + KeyValueStoreState::INIT_SPACE + value.len(),
        realloc::payer = owner,
        realloc::zero = false,
    )]
    pub key_value_store: Account<'info, KeyValueStoreState>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(key: String)]
pub struct DeleteKeyValueStore<'info> {
    #[account(
        mut,
        seeds = [key.as_bytes(), owner.key().as_ref()],
        bump,
        close = owner,
    )]
    pub key_value_store: Account<'info, KeyValueStoreState>,

    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct KeyValueStoreState {
    pub owner: Pubkey,
    #[max_len(256)]
    pub key: String,
    #[max_len(4096)]
    pub value: String,
}

