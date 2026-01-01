#![no_std]
use odra::prelude::*;
use odra::modules::cep18::{Cep18, Cep18DeployInitArg};
use odra::types::U256;

#[odra::module]
pub struct CasperFidelity {
    pub token: SubModule<Cep18>,
    pub admin: Var<Address>,
    pub total_redeemed: Var<U256>,
}

#[odra::module]
impl CasperFidelity {
    #[odra(init)]
    pub fn init(&mut self, name: String, symbol: String, decimals: u8, initial_supply: U256) {
        self.token.init(name, symbol, decimals, initial_supply);
        self.admin.set(self.env().caller());
        self.total_redeemed.set(U256::zero());
    }

    pub fn issue_points(&mut self, customer: Address, amount: U256) {
        if self.env().caller() != self.admin.get_or_default() {
            self.env().revert(1); // Error: NotAdmin
        }
        self.token.mint(customer, amount);
        
        self.env().emit_event(PointsIssued {
            customer,
            amount,
            timestamp: self.env().get_block_time(),
        });
    }

    pub fn redeem_reward(&mut self, amount: U256, reward_id: String) {
        let caller = self.env().caller();
        
        // Validación de saldo
        if self.token.balance_of(caller) < amount {
            self.env().revert(2); // Error: InsufficientBalance
        }
        self.token.burn(caller, amount);
        
        let current = self.total_redeemed.get_or_default();
        self.total_redeemed.set(current + amount);
        
        self.env().emit_event(RewardRedeemed {
            user: caller,
            amount,
            reward_id,
            timestamp: self.env().get_block_time(),
        });
    }

    pub fn get_total_burned(&self) -> U256 {
        self.total_redeemed.get_or_default()
    }
}

#[odra::event]
pub struct PointsIssued {
    pub customer: Address,
    pub amount: U256,
    pub timestamp: u64,
}

#[odra::event]
pub struct RewardRedeemed {
    pub user: Address,
    pub amount: U256,
    pub reward_id: String,
    pub timestamp: u64,
}
