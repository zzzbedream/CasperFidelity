import React, { useState } from 'react';
import { Gift, Wallet, User, ShieldCheck, ArrowRight, LogOut } from 'lucide-react';
import { Buffer } from 'buffer';
import * as CasperSDK from 'casper-js-sdk';
import { CONTRACT_HASH, ADMIN_ADDRESS, NETWORK_NAME, NODE_URL } from './config';

const { DeployUtil, CLPublicKey, CLValueBuilder, RuntimeArgs, CasperClient } = CasperSDK;

window.Buffer = window.Buffer || Buffer;

function App() {
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [csprBalance, setCSPRBalance] = useState('0');
  const [logs, setLogs] = useState([
    { msg: "System ready. Waiting for wallet connection...", type: "system", hash: null, time: new Date().toLocaleTimeString() }
  ]);
  const [loading, setLoading] = useState(false);

  const casperClient = new CasperClient(NODE_URL);

  // Add log to terminal
  const addLog = (message, type = "info", hash = null) => {
    setLogs(prev => [{
      msg: message,
      type,
      hash,
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 10));
  };

  // Fetch CFT Balance
  const fetchBalance = async (publicKey) => {
    try {
      addLog(`Querying CFT balance for ${publicKey.slice(0, 10)}...`, "info");

      const stateRootHash = await casperClient.nodeClient.getStateRootHash();
      const accountHash = CLPublicKey.fromHex(publicKey).toAccountHashStr();

      const contractHashBytes = Uint8Array.from(Buffer.from(CONTRACT_HASH, 'hex'));
      const key = `contract-${Buffer.from(contractHashBytes).toString('hex')}`;

      try {
        const result = await casperClient.nodeClient.getDictionaryItemByURef(
          stateRootHash,
          key,
          `balance_${accountHash}`
        );

        if (result && result.CLValue) {
          const bal = result.CLValue.toString();
          setBalance(bal);
          addLog(`CFT Balance: ${bal} tokens`, "success");
        }
      } catch (e) {
        console.log("Balance not found, defaulting to 0");
        setBalance('0');
        addLog("CFT Balance: 0 tokens (new account)", "info");
      }

      // Get CSPR balance
      try {
        const accountInfo = await casperClient.nodeClient.getAccountInfo(publicKey);
        const cspr = (accountInfo.account.mainPurse.balance / 1_000_000_000).toFixed(2);
        setCSPRBalance(cspr);
      } catch (e) {
        setCSPRBalance('0');
      }

    } catch (error) {
      console.error("Error fetching balance:", error);
      addLog(`Error fetching balance: ${error.message}`, "error");
    }
  };

  // Connect Wallet (Edge-optimized with delay)
  const connectWallet = async () => {
    addLog("Initializing wallet detection...", "info");
    setLoading(true);

    try {
      // Wait 2 seconds for extension to inject
      addLog("Waiting for Casper Wallet extension to load...", "info");
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Direct reference to window.casperWalletHelper
      const provider = window.casperWalletHelper;

      if (!provider) {
        // Debug: Log all window keys to find the extension
        console.log("=== DEBUGGING: window.casperWalletHelper not found ===");
        console.log("Searching for Casper Wallet in window object...");

        const casperKeys = Object.keys(window).filter(key =>
          key.toLowerCase().includes('casper') ||
          key.toLowerCase().includes('wallet') ||
          key.toLowerCase().includes('signer')
        );

        console.log("Found Casper-related keys:", casperKeys);
        console.log("All window keys:", Object.keys(window).sort());

        addLog("Casper Wallet extension not detected!", "error");
        alert(
          "❌ Casper Wallet Not Detected!\n\n" +
          "Please:\n" +
          "1. Install Casper Wallet from https://www.casperwallet.io/\n" +
          "2. Ensure it's enabled in Edge\n" +
          "3. Refresh this page (F5)\n\n" +
          "Check console (F12) for debugging info."
        );
        setLoading(false);
        return;
      }

      addLog("✅ Casper Wallet detected! Requesting connection...", "success");

      // Request connection
      const isConnected = await provider.requestConnection();

      if (!isConnected) {
        throw new Error("Connection rejected by user");
      }

      // Get active public key
      const publicKey = await provider.getActivePublicKey();

      if (!publicKey) {
        throw new Error("No active account found in wallet");
      }

      setConnectedAccount(publicKey);
      addLog(`Wallet connected: ${publicKey}`, "success");

      // Fetch balances
      await fetchBalance(publicKey);

    } catch (error) {
      console.error("❌ Connection error:", error);
      addLog(`Connection failed: ${error.message}`, "error");
      alert("Failed to connect wallet:\n\n" + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect
  const disconnect = () => {
    setConnectedAccount(null);
    setBalance('0');
    setCSPRBalance('0');
    addLog("Wallet disconnected", "info");
    if (window.casperWalletHelper?.disconnectFromSite) {
      window.casperWalletHelper.disconnectFromSite();
    }
  };

  // Issue Points (REAL)
  const issuePoints = async (recipient, amount) => {
    if (!connectedAccount) return;

    try {
      setLoading(true);
      addLog(`Preparing to issue ${amount} CFT to ${recipient.slice(0, 10)}...`, "info");

      const deployParams = new DeployUtil.DeployParams(
        CLPublicKey.fromHex(connectedAccount),
        NETWORK_NAME
      );

      const args = RuntimeArgs.fromMap({
        recipient: CLValueBuilder.key(CLPublicKey.fromHex(recipient)),
        amount: CLValueBuilder.u256(amount)
      });

      const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        Uint8Array.from(Buffer.from(CONTRACT_HASH, 'hex')),
        'mint',
        args
      );

      const payment = DeployUtil.standardPayment(5_000_000_000); // 5 CSPR
      const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

      addLog("Waiting for signature from Casper Wallet...", "info");

      const deployJson = DeployUtil.deployToJson(deploy);
      const signedDeployJson = await window.casperWalletHelper.sign(
        JSON.stringify(deployJson),
        connectedAccount
      );

      addLog("Deploy signed! Sending to Casper Network...", "info");

      const signedDeploy = DeployUtil.deployFromJson(signedDeployJson).unwrap();
      const deployHash = await casperClient.putDeploy(signedDeploy);

      addLog(`✅ Transaction SENT to blockchain!`, "success", deployHash);
      alert(`Success! Points issued.\n\nDeploy Hash: ${deployHash}\n\nView on Explorer: https://testnet.cspr.live/deploy/${deployHash}`);

      // Refresh balance after 10 seconds
      setTimeout(() => fetchBalance(connectedAccount), 10000);

    } catch (error) {
      console.error("Issue points error:", error);
      addLog(`❌ Transaction failed: ${error.message}`, "error");
      alert("Failed to issue points: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Redeem Reward (REAL)
  const redeemReward = async (rewardName, cost) => {
    if (!connectedAccount) return;

    try {
      setLoading(true);

      if (parseInt(balance) < cost) {
        addLog(`Redemption blocked: Insufficient balance (${balance} < ${cost})`, "error");
        alert(`Insufficient balance!\n\nYou have: ${balance} CFT\nNeed: ${cost} CFT`);
        setLoading(false);
        return;
      }

      addLog(`Initiating redemption: ${rewardName} (${cost} CFT)`, "info");

      const deployParams = new DeployUtil.DeployParams(
        CLPublicKey.fromHex(connectedAccount),
        NETWORK_NAME
      );

      const args = RuntimeArgs.fromMap({
        recipient: CLValueBuilder.key(CLPublicKey.fromHex(ADMIN_ADDRESS)),
        amount: CLValueBuilder.u256(cost)
      });

      const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
        Uint8Array.from(Buffer.from(CONTRACT_HASH, 'hex')),
        'transfer',
        args
      );

      const payment = DeployUtil.standardPayment(3_000_000_000); // 3 CSPR
      const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

      addLog("Waiting for signature from Casper Wallet...", "info");

      const deployJson = DeployUtil.deployToJson(deploy);
      const signedDeployJson = await window.casperWalletHelper.sign(
        JSON.stringify(deployJson),
        connectedAccount
      );

      addLog("Deploy signed! Sending to Casper Network...", "info");

      const signedDeploy = DeployUtil.deployFromJson(signedDeployJson).unwrap();
      const deployHash = await casperClient.putDeploy(signedDeploy);

      addLog(`✅ Redemption successful! ${rewardName} claimed.`, "success", deployHash);
      alert(`Success! ${rewardName} redeemed.\n\nDeploy Hash: ${deployHash}\n\nView on Explorer: https://testnet.cspr.live/deploy/${deployHash}`);

      setTimeout(() => fetchBalance(connectedAccount), 10000);

    } catch (error) {
      console.error("Redeem error:", error);
      addLog(`❌ Redemption failed: ${error.message}`, "error");
      alert("Failed to redeem: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = connectedAccount && connectedAccount.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // =============== LANDING PAGE ===============
  if (!connectedAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        </div>

        <div className="max-w-4xl text-center z-10">

          <div className="flex justify-center mb-8">
            <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
              <Gift className="w-20 h-20 text-blue-300" />
            </div>
          </div>

          <h1 className="text-7xl font-extrabold mb-6 tracking-tight">
            Casper<span className="text-blue-400">Fidelity</span>
          </h1>

          <p className="text-2xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Blockchain-Powered Loyalty Rewards
            <br /><span className="text-blue-300 font-medium">Secure • Transparent • Instant</span>
          </p>

          <button
            onClick={connectWallet}
            disabled={loading}
            className="group relative inline-flex items-center justify-center px-12 py-5 font-bold text-white transition-all duration-300 bg-blue-600 rounded-2xl hover:bg-blue-500 hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin mr-3 h-7 w-7" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting...</span>
              </span>
            ) : (
              <span className="flex items-center">
                <Wallet className="w-7 h-7 mr-3" />
                <span className="text-xl">CONNECT WALLET</span>
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
            )}
          </button>

          <div className="mt-16 grid grid-cols-3 gap-8 text-blue-200">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-8 h-8 mb-3" />
              <span className="text-sm font-medium">SECURE</span>
            </div>
            <div className="flex flex-col items-center">
              <User className="w-8 h-8 mb-3" />
              <span className="text-sm font-medium">DECENTRALIZED</span>
            </div>
            <div className="flex flex-col items-center">
              <Gift className="w-8 h-8 mb-3" />
              <span className="text-sm font-medium">REWARDING</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============== DASHBOARD ===============
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg text-white">
              <Gift size={24} />
            </div>
            <span className="font-extrabold text-2xl text-gray-800">
              Casper<span className="text-blue-600">Fidelity</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 ${isAdmin
              ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
              : 'bg-green-100 text-green-700 border-2 border-green-300'
              }`}>
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-600' : 'bg-green-600'}`}></div>
              {isAdmin ? 'ADMIN' : 'CUSTOMER'}
            </div>

            {!isAdmin && (
              <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <div className="text-[10px] uppercase font-bold text-blue-600">CFT Balance</div>
                <div className="font-mono text-sm font-bold text-blue-900">{balance} CFT</div>
              </div>
            )}

            <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
              <div className="text-[10px] uppercase font-bold text-gray-600">CSPR Balance</div>
              <div className="font-mono text-sm font-bold text-gray-900">{csprBalance} CSPR</div>
            </div>

            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-gray-400">Connected</span>
              <span className="font-mono text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded border">
                {connectedAccount.slice(0, 10)}...{connectedAccount.slice(-6)}
              </span>
            </div>

            <button
              onClick={disconnect}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-4 py-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        {isAdmin
          ? <AdminView onIssue={issuePoints} logs={logs} loading={loading} />
          : <UserView balance={balance} onRedeem={redeemReward} logs={logs} loading={loading} />
        }
      </main>
    </div>
  );
}

// =============== BLOCKCHAIN TERMINAL ===============
const BlockchainTerminal = ({ logs }) => (
  <div className="mt-8 bg-black rounded-xl p-4 font-mono text-sm shadow-2xl border border-slate-700">
    <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      <span className="text-slate-500 text-xs ml-2">CasperFidelity Node Terminal • LIVE</span>
    </div>

    <div className="space-y-2 h-40 overflow-y-auto">
      {logs.map((log, i) => (
        <div key={i} className="animate-fade-in">
          <span className="text-slate-500">[{log.time}]</span>{" "}
          <span className={`${log.type === 'success' ? 'text-green-400' :
            log.type === 'error' ? 'text-red-400' : 'text-blue-400'
            }`}>
            {log.msg}
          </span>
          {log.hash && (
            <div className="ml-4 mt-1">
              <span className="text-slate-500">└─ Hash: </span>
              <a
                href={`https://testnet.cspr.live/deploy/${log.hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-yellow-500 hover:underline break-all text-xs"
              >
                {log.hash} ↗
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// =============== ADMIN VIEW ===============
const AdminView = ({ onIssue, logs, loading }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!recipient || !amount) {
      alert("Please fill in all fields");
      return;
    }
    onIssue(recipient, amount);
    setRecipient('');
    setAmount('');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
        <p className="text-gray-600">Issue loyalty points to customers on Casper Testnet</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Customer Public Key
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="01..."
            disabled={loading}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Amount (CFT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            disabled={loading}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Issue Points'}
        </button>
      </form>

      <BlockchainTerminal logs={logs} />
    </div>
  );
};

// =============== USER VIEW ===============
const UserView = ({ balance, onRedeem, logs, loading }) => {
  const rewards = [
    { id: 1, name: "Premium Coffee", cost: 10, icon: "☕", description: "Enjoy a free premium coffee" },
    { id: 2, name: "20% Discount", cost: 50, icon: "🏷️", description: "Get 20% off your next purchase" },
    { id: 3, name: "Free Merchandise", cost: 100, icon: "🎁", description: "Claim exclusive branded merchandise" }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="text-blue-100 text-sm font-medium mb-2">Your Balance</div>
        <div className="text-6xl font-bold mb-4">
          {balance} <span className="text-2xl font-normal opacity-80">CFT</span>
        </div>
        <div className="text-sm text-blue-200">CasperFidelity Loyalty Tokens</div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Available Rewards</h2>
        <div className="space-y-4">
          {rewards.map(reward => (
            <div key={reward.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{reward.icon}</span>
                <div>
                  <div className="font-bold text-lg text-gray-900">{reward.name}</div>
                  <div className="text-sm text-gray-600">{reward.description}</div>
                  <div className="text-xs text-blue-600 font-semibold mt-1">{reward.cost} CFT Points</div>
                </div>
              </div>
              <button
                onClick={() => onRedeem(reward.name, reward.cost)}
                disabled={parseInt(balance) < reward.cost || loading}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow"
              >
                {loading ? 'Processing...' : 'Redeem'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <BlockchainTerminal logs={logs} />
    </div>
  );
};

export default App;
