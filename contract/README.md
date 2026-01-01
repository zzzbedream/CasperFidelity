# CasperFidelity Smart Contract

Built with **Odra Framework** (Rust) for the Casper Network.

## 📋 Contract Overview

This loyalty points smart contract implements a CEP-18 token standard with custom business logic for enterprise loyalty programs.

### Core Functions

| Function | Description | Access |
|----------|-------------|--------|
| `issue_points(customer, amount)` | Mint loyalty points to customer wallet | Admin only |
| `redeem_reward(amount, reward_id)` | Burn points and redeem reward | Any user |
| `get_total_burned()` | Query total redeemed points | Public view |

### Events

- **PointsIssued**: Emitted when business issues points to customer
- **RewardRedeemed**: Emitted when customer redeems points for reward

## 🛠️ Local Development

### Prerequisites

- Rust 1.70+
- Odra CLI (`cargo install odra-cli`)

### Build & Test

```bash
# Run tests
cargo odra test

# Build WASM
cargo odra build

# Deploy to testnet (requires funded wallet)
cargo odra deploy --network testnet
```

## 🔐 Security Features

✅ **Admin-only minting**: Prevents unauthorized point creation  
✅ **Balance validation**: Cannot redeem more than owned  
✅ **Event logging**: Full audit trail on-chain  
✅ **CEP-18 compliance**: Standard token interface  

---

**⚠️ Security Notice**: Never commit private keys or PEM files. See root `.gitignore` for excluded files.
