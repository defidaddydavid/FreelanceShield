use borsh::{BorshDeserialize, BorshSerialize};
use mpl_token_metadata::state::{
    Creator, Collection, Uses, UseMethod, 
    Metadata, Edition, MasterEdition, EditionMarker
};

// This module provides compatibility serialization implementations
// for mpl-token-metadata enums that are missing BorshSerialize/BorshDeserialize

// Implement BorshSerialize for UseMethod if it's missing
#[cfg(not(feature = "no-borsh-impl"))]
impl BorshSerialize for UseMethod {
    fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        match self {
            UseMethod::Burn => 0u8.serialize(writer),
            UseMethod::Multiple => 1u8.serialize(writer),
            UseMethod::Single => 2u8.serialize(writer),
        }
    }
}

// Implement BorshDeserialize for UseMethod if it's missing
#[cfg(not(feature = "no-borsh-impl"))]
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

// Helper function to create a policy NFT metadata
pub fn create_policy_nft_metadata(
    name: String,
    symbol: String,
    uri: String,
    policy_id: String,
) -> Metadata {
    Metadata {
        key: mpl_token_metadata::state::Key::MetadataV1,
        update_authority: solana_program::pubkey::Pubkey::default(),
        mint: solana_program::pubkey::Pubkey::default(),
        data: mpl_token_metadata::state::Data {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: Some(vec![Creator {
                address: solana_program::pubkey::Pubkey::default(),
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
    }
}

// Add any other missing serialization implementations here as needed
