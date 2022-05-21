use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    system_instruction,
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};
use solana_program::instruction::Instruction;
use solana_program::instruction::AccountMeta;
use solana_program::program::invoke_signed;

#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
pub enum InstructionData {
    UpdateAdddress {
        address: [u8; 512]
    },
    UpdateUserInfo {
        name: [u8; 512],
        date: i32,
        month: i32,
        year: i32,
    },
    Initialize {

    }
}

#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
pub struct AddressInstructionData {
    address: [u8; 512]
}

#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
pub struct UserProfileInstructionData {
    name: [u8; 512],
    date: i32,
    month: i32,
    year: i32,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct AddressSchema {
    address: [u8; 512]
}


pub fn getAddressSeeds(account: &AccountInfo, program_id: &Pubkey)  -> (Pubkey, u8) {
    return Pubkey::find_program_address(&[b"address", &account.key.to_bytes()[..32]], program_id);
}


pub fn getUserProfileSeeds(account: &AccountInfo, program_id: &Pubkey) -> (Pubkey, u8) {
    return Pubkey::find_program_address(&[b"profile", &account.key.to_bytes()[..32]], program_id);
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    instruction_data: &[u8], // Ignored, all helloworld instructions are hellos
) -> ProgramResult {
    msg!("Hello World Rust program entrypoint");

    let instruction = InstructionData::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    match instruction {
        InstructionData::Initialize {

        } => {
          msg!("Initialise PDAs");
          let account = next_account_info(accounts_iter)?;
          let update_user_info_account = next_account_info(accounts_iter)?;
          let update_address_account = next_account_info(accounts_iter)?;
          let update_user_profile_contract = next_account_info(accounts_iter)?;
          let update_address_contract = next_account_info(accounts_iter)?;
          let system_program = next_account_info(accounts_iter)?;

          let (found_address_account, address_bump) = getAddressSeeds(account, program_id);
          if found_address_account != *update_address_account.key {
              msg!("Incorrect address PDA as input");
              msg!(&update_address_account.key.to_string());
              return Err(ProgramError::InvalidInstructionData)
          }

          msg!(&found_address_account.to_string());
          let (found_user_info_account, user_profile_bump) = getUserProfileSeeds(account, program_id);
          msg!(&found_user_info_account.to_string());
          if found_user_info_account != *update_user_info_account.key {
              msg!("Incorrect user info PDA as input");
              msg!(&update_user_info_account.key.to_string());
              return Err(ProgramError::InvalidInstructionData)
          }

          invoke_signed(
            &system_instruction::create_account(
                account.key,
                update_address_account.key,
                Rent::get()?.minimum_balance(std::mem::size_of::<AddressSchema>()),
                std::mem::size_of::<AddressSchema>().try_into().unwrap(),
                update_address_contract.key,
            ),
            &[update_address_account.clone(), account.clone(), system_program.clone()],
            &[&[b"address", account.key.as_ref(), &[address_bump]]],
          )?;

          invoke_signed(
            &system_instruction::create_account(
                account.key,
                update_user_info_account.key,
                Rent::get()?.minimum_balance(std::mem::size_of::<AddressSchema>()),
                std::mem::size_of::<AddressSchema>().try_into().unwrap(),
                update_user_profile_contract.key,
            ),
            &[update_user_info_account.clone(), account.clone(), system_program.clone()],
            &[&[b"profile", account.key.as_ref(), &[user_profile_bump]]],
          )?;
        }
        InstructionData::UpdateAdddress {
            address
         } => {
            msg!("Update address");

            let account = next_account_info(accounts_iter)?;
            let update_address_account = next_account_info(accounts_iter)?;
            let update_address_contract = next_account_info(accounts_iter)?;

            let (found_address_account, address_bump) = getAddressSeeds(account, program_id);
            
            if found_address_account != *update_address_account.key {
                msg!("address pda is not equal to incoming address pda")
                return Err(ProgramError::InvalidInstructionData)
            }

            let mut acct_metas = Vec::new();
            acct_metas.push(AccountMeta{
                pubkey: *update_address_account.key,
                is_signer: true,
                is_writable: true,
            });

            let address_instruction_data = AddressInstructionData {
                address: address
            };
            let instruction = Instruction{
                program_id: *update_address_contract.key,
                accounts: acct_metas,
                data: address_instruction_data.try_to_vec()?,
            };
            invoke_signed(
                &instruction,
                &[update_address_account.clone()],
                &[&[b"address", account.key.as_ref(), &[address_bump]]]).map_err(|_| ProgramError::IncorrectProgramId
            )?;
        }
        InstructionData::UpdateUserInfo {
            name, date, year, month
        } => {
            msg!("Update user info");

            let account = next_account_info(accounts_iter)?;
            let update_profile_account = next_account_info(accounts_iter)?;
            let update_profile_contract = next_account_info(accounts_iter)?;

            let (found_user_info_account, user_profile_bump) = getUserProfileSeeds(account, program_id);

            if found_user_info_account != *update_profile_account.key {
                msg!("User pda is not equal to incoming address pda")
                return Err(ProgramError::InvalidInstructionData)
            }

            let mut acct_metas = Vec::new();
            acct_metas.push(AccountMeta{
                pubkey: *update_profile_account.key,
                is_signer: true,
                is_writable: true,
            });

            let profile_instruction_data = UserProfileInstructionData {
                name, date, year, month
            };
            let instruction = Instruction{
                program_id: *update_profile_contract.key,
                accounts: acct_metas,
                data: profile_instruction_data.try_to_vec()?,
            };
            invoke_signed(&instruction, 
                &[update_profile_account.clone()],
                &[&[b"profile", account.key.as_ref(), &[user_profile_bump]]]
            ).map_err(|_| ProgramError::IncorrectProgramId)?;
        }
    }

    Ok(())
}

// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;
    use std::mem;
    #[test]
    fn test_sanity() {
        
    }
}