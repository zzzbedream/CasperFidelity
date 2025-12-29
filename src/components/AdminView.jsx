import React, { useState } from 'react';
import { DeployUtil } from 'casper-js-sdk';
import { CONTRACT_HASH } from '../config';
import { createIssuePointsDeploy } from '../utils/casperService';

const AdminView = ({ activeAccount }) => {
    const [customerAddr, setCustomerAddr] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');

    const handleIssue = async (e) => {
        e.preventDefault();
        if (!activeAccount?.public_key) return;

        try {
            setStatus('Preparing deploy...');

            // 1. Create Deploy Object
            const deploy = createIssuePointsDeploy(
                CONTRACT_HASH,
                activeAccount.public_key,
                customerAddr,
                amount
            );

            // 2. Convert to JSON for Wallet
            const deployJson = DeployUtil.deployToJson(deploy);

            // 3. Sign with native Casper Wallet
            setStatus('Please sign the transaction in your wallet...');

            const signedDeploy = await window.casperlabsSdkBrowserHelper.sign(
                JSON.stringify(deployJson),
                activeAccount.public_key
            );

            // 4. Send to network
            const deployObject = DeployUtil.deployFromJson(signedDeploy).unwrap();
            const response = await fetch(`https://node.testnet.casper.network/rpc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'account_put_deploy',
                    params: [DeployUtil.deployToJson(deployObject)],
                    id: 1
                })
            });

            const result = await response.json();
            const deployHash = result.result?.deploy_hash;

            if (!deployHash) throw new Error('Failed to submit deploy');

            setStatus(`Transaction sent! Hash: ${deployHash}`);
            alert(`Success! View on Explorer: https://testnet.cspr.live/deploy/${deployHash}`);

            // Clear form
            setCustomerAddr('');
            setAmount('');

        } catch (err) {
            console.error(err);
            setStatus('Error: ' + err.message);
            alert('Error issuing points: ' + err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4 p-6">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-4">Admin Dashboard</div>
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Issue Loyalty Points</h1>

            <form onSubmit={handleIssue} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Address (Public Key)</label>
                    <input
                        type="text"
                        value={customerAddr}
                        onChange={(e) => setCustomerAddr(e.target.value)}
                        placeholder="01..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Issue Points
                </button>
            </form>

            {status && <div className="mt-4 text-sm text-gray-600">{status}</div>}
        </div>
    );
};

export default AdminView;
