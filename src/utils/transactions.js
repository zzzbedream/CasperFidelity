/**
 * Transaction Helper for CasperFidelity
 * Handles contract interactions with proper error handling
 */

import { CONTRACT_HASH, NODE_URL } from '../config';

/**
 * Issue points to a recipient (DEMO MODE for testing)
 */
export async function issuePointsDemo(recipient, amount, connectedAccount, addLog) {
    if (!connectedAccount) {
        throw new Error('Wallet not connected');
    }

    addLog(`🔍 DEMO: Preparing to issue ${amount} CFT to ${recipient.slice(0, 10)}...`, "info");

    // Log transaction details
    console.log('=== DEMO TRANSACTION ===');
    console.log('Contract:', CONTRACT_HASH);
    console.log('From:', connectedAccount);
    console.log('To:', recipient);
    console.log('Amount:', amount);
    console.log('=======================');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate demo hash
    const demoHash = 'demo-' + Date.now().toString(16);

    addLog(`✅ DEMO SUCCESS: Simulated issuing ${amount} CFT`, "success", demoHash);

    return {
        success: true,
        hash: demoHash,
        message: `Demo: Would issue ${amount} CFT to ${recipient.slice(0, 10)}...`
    };
}

/**
 * Redeem reward (DEMO MODE for testing)
 */
export async function redeemRewardDemo(rewardName, cost, connectedAccount, addLog) {
    if (!connectedAccount) {
        throw new Error('Wallet not connected');
    }

    addLog(`🔍 DEMO: Redeeming ${rewardName} (${cost} CFT)...`, "info");

    console.log('=== DEMO REDEMPTION ===');
    console.log('Reward:', rewardName);
    console.log('Cost:', cost);
    console.log('User:', connectedAccount);
    console.log('======================');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate demo hash
    const demoHash = 'redeem-' + Date.now().toString(16);

    addLog(`✅ DEMO SUCCESS: Redeemed ${rewardName}`, "success", demoHash);

    return {
        success: true,
        hash: demoHash,
        message: `Demo: Redeemed ${rewardName} for ${cost} CFT`
    };
}
