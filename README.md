# CasperFidelity 🎯

### The Future of Liquid Loyalty on Casper Network

![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Casper](https://img.shields.io/badge/Casper-FF0000?style=for-the-badge&logo=casper&logoColor=white)
![Testnet](https://img.shields.io/badge/Testnet-Deployed-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

> Transforming dead capital loyalty points into liquid, tradable on-chain assets. Built for **Casper Hackathon 2026**.

---

## 📸 Screenshots

<!-- Add your UI screenshots here -->

```
[ Screenshot 1: Dashboard View ]
[ Screenshot 2: Issue Points Flow ]
[ Screenshot 3: Redeem Rewards Flow ]
[ Screenshot 4: Transaction Confirmation ]
```

---

## ✨ Key Features

✅ **Issue Points** — Businesses can distribute loyalty rewards on-chain  
✅ **Redeem Rewards** — Customers can instantly claim real value  
✅ **Real-time Balance** — Transparent, verifiable point tracking via Casper Wallet  
✅ **Non-Custodial** — True ownership through wallet integration  
✅ **Fraud-Proof** — Immutable transaction history on-chain  
✅ **Fast-Track Eligible** — Fully deployed and functional on Casper Testnet  

---

## 🏗️ Architecture

```
┌─────────────────────┐
│   React Frontend    │  (Tailwind CSS, Dark Fintech UI)
│   (Vercel Hosted)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Casper Wallet     │  (Transaction Signing & Auth)
│   Browser Plugin    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Casper Testnet    │  (RPC Node)
│   Public RPC        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Smart Contract     │  (Odra Framework - Rust)
│  (Verified Hash)    │  • Issue Points
│                     │  • Redeem Rewards
│                     │  • Query Balances
└─────────────────────┘
```

---

## 🔐 Verified Contract

Our smart contract is **deployed and verified** on Casper Testnet:

| Property | Value |
|----------|-------|
| **Contract Hash** | `[AQUÍ_PONDRE_MI_HASH]` |
| **Network** | Casper Testnet |
| **Framework** | Odra (Rust) |
| **Explorer** | [View on Testnet Explorer →](https://testnet.cspr.live/) |

> 🔍 **Fast-Track Eligible**: Judges can verify all functionality on-chain.

---

## 🚀 Getting Started

### Repository Structure

```
CasperFidelity/
├── casper_fidelity/          # Smart Contract (Rust + Odra)
│   ├── src/
│   │   └── lib.rs           # Main contract logic
│   ├── Cargo.toml           # Rust dependencies
│   ├── Odra.toml            # Odra configuration
│   └── wasm/                # Compiled contract binaries
├── casper-fidelity-frontend/ # React Frontend (this directory)
│   ├── src/                 # React components
│   ├── public/              # Static assets
│   └── contract/            # Contract artifacts & LICENSE
├── README.md                # Main project README
└── SUBMISSION.md            # Hackathon submission text
```

### Prerequisites

- **Node.js** v18+ (for frontend)
- **Rust** 1.70+ (for smart contract development)
- **Casper Wallet** browser extension
- **Git**

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/CasperFidelity.git
cd CasperFidelity/casper-fidelity-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` and connect your Casper Wallet.

### Smart Contract Setup

```bash
# Navigate to contract directory (from frontend directory)
cd ../casper_fidelity

# Run Odra tests
cargo odra test

# Build the contract
cargo odra build -b casper

# Deploy to Testnet (requires funded wallet)
# See deployment scripts in the contract directory
```

---

## 📅 Roadmap 2026

| Phase | Timeline | Milestones | Status |
|-------|----------|------------|--------|
| **Phase 1: MVP** | Q1 2026 | ✅ Smart contract deployment<br>✅ Web UI with wallet integration<br>✅ Issue & redeem flows<br>✅ Testnet launch | ✅ **COMPLETE** |
| **Phase 2: Liquid Staking** | Q2 2026 | 🔄 Integrate Casper Liquid Staking<br>🔄 Staked points earn yield<br>🔄 Maintain redemption liquidity<br>🔄 Advanced analytics dashboard | 🔜 **PLANNED** |
| **Phase 3: Mainnet** | Q3 2026 | 🔮 Security audit<br>🔮 Mainnet deployment<br>🔮 Partner onboarding<br>🔮 Multi-tier rewards system | 🔜 **PLANNED** |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Smart Contract** | Rust + Odra Framework | Secure, efficient on-chain logic |
| **Frontend** | React + Vite | Fast, modern UI development |
| **Styling** | Tailwind CSS | Dark fintech aesthetic |
| **Blockchain** | Casper Network (Testnet) | Account-based, eco-friendly L1 |
| **Wallet** | Casper Wallet | Non-custodial user authentication |
| **Hosting** | Vercel | Edge-optimized frontend delivery |

---

## 📖 Documentation

- **[Contract API Reference](./docs/CONTRACT_API.md)** — Smart contract methods and types
- **[Deployment Guide](./docs/DEPLOYMENT.md)** — Step-by-step testnet deployment
- **[Architecture Deep Dive](./docs/ARCHITECTURE.md)** — System design decisions

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md).

```bash
# Fork the repo, create a feature branch
git checkout -b feature/your-feature-name

# Make changes, commit with conventional commits
git commit -m "feat: add advanced analytics dashboard"

# Push and open a PR
git push origin feature/your-feature-name
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🏆 Hackathon Submission

- **Hackathon**: Casper Hackathon 2026
- **Track**: Main Track + Liquid Staking (Roadmap)
- **Team**: [Your Team Name]
- **Demo**: [https://web-eight-eta-28.vercel.app](https://web-eight-eta-28.vercel.app)
- **Status**: ✅ Fast-Track Eligible

---

## 🌐 Links

- **Live Demo**: [https://web-eight-eta-28.vercel.app](https://web-eight-eta-28.vercel.app)
- **Contract Explorer**: [View on Testnet →](https://testnet.cspr.live/)
- **Documentation**: [Full Docs →](./docs/)
- **Video Demo**: [Coming Soon]

---

<div align="center">

**Built with ❤️ on Casper Network**

⭐ Star this repo if you believe in liquid loyalty!

</div>
