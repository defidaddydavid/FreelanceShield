use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};
use mpl_token_metadata::state::{
    Creator, Collection, Uses, UseMethod, 
    Metadata, Edition, MasterEdition, EditionMarker, Key
};
use mpl_token_metadata::instruction::*;

// This wrapper module handles all interactions with mpl-token-metadata
// and provides necessary compatibility layers for serialization

// Custom wrapper for creating policy NFT metadata
pub fn create_policy_nft_metadata(
    name: String,
    symbol: String,
    uri: String,
    creator: Pubkey,
    policy_id: String,
) -> Result<Metadata> {
    // Create metadata for the policy NFT
    let metadata = Metadata {
        key: mpl_token_metadata::state::Key::MetadataV1,
        update_authority: creator,
        mint: Pubkey::default(), // Will be set later
        data: mpl_token_metadata::state::Data {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: Some(vec![Creator {
                address: creator,
                verified: true,
                share: 100,
            }]),
        },
        primary_sale_happened: false,
        is_mutable: true,
        edition_nonce: None,
        token_standard: None,
        collection: None,
        uses: None,
    };
    
    Ok(metadata)
}

// Direct Borsh implementation for UseMethod (no feature flags)
impl BorshSerialize for UseMethod {
    fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        let value = match self {
            UseMethod::Burn => 0u8,
            UseMethod::Multiple => 1u8,
            UseMethod::Single => 2u8,
        };
        value.serialize(writer)
    }
}

// Direct Borsh implementation for UseMethod (no feature flags)
impl BorshDeserialize for UseMethod {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let value = u8::deserialize(buf)?;
        match value {
            0 => Ok(UseMethod::Burn),
            1 => Ok(UseMethod::Multiple),
            2 => Ok(UseMethod::Single),
            _ => Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Invalid UseMethod value",
            )),
        }
    }
}

// Also implement BorshSerialize for Key as it might be missing in this version
impl BorshSerialize for Key {
    fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        let value = match self {
            Key::Uninitialized => 0u8,
            Key::EditionV1 => 1u8,
            Key::MasterEditionV1 => 2u8,
            Key::ReservationListV1 => 3u8,
            Key::MetadataV1 => 4u8,
            Key::ReservationListV2 => 5u8,
            Key::MasterEditionV2 => 6u8,
            Key::EditionMarker => 7u8,
            Key::UseAuthorityRecord => 8u8,
            Key::CollectionAuthorityRecord => 9u8,
            Key::TokenRecord => 10u8,
            Key::MetadataCollection => 11u8,
            Key::ProgrammableConfig => 12u8,
        };
        value.serialize(writer)
    }
}

// Also implement BorshDeserialize for Key
impl BorshDeserialize for Key {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let value = u8::deserialize(buf)?;
        match value {
            0 => Ok(Key::Uninitialized),
            1 => Ok(Key::EditionV1),
            2 => Ok(Key::MasterEditionV1),
            3 => Ok(Key::ReservationListV1),
            4 => Ok(Key::MetadataV1),
            5 => Ok(Key::ReservationListV2),
            6 => Ok(Key::MasterEditionV2),
            7 => Ok(Key::EditionMarker),
            8 => Ok(Key::UseAuthorityRecord),
            9 => Ok(Key::CollectionAuthorityRecord),
            10 => Ok(Key::TokenRecord),
            11 => Ok(Key::MetadataCollection),
            12 => Ok(Key::ProgrammableConfig),
            _ => Err(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                "Invalid Key value",
            )),
        }
    }
}

// Export the wrapper implementations
pub use mpl_token_metadata::instruction::*;
