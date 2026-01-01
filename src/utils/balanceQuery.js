/**
 * Query balance from CEP-18 contract
 * Uses direct RPC endpoint (not proxy) for state queries
 */
import { CasperClient, CLPublicKey } from 'casper-js-sdk';
import { CONTRACT_HASH } from '../config';

// Use DIRECT testnet URL for queries (proxy doesn't work for state queries)
const DIRECT_RPC = 'https://node.testnet.casper.network/rpc';

/**
 * Get CFT token balance for an account
 */
export async function getTokenBalance(accountAddress) {
    try {
        console.log("🔍 Querying balance for:", accountAddress);
        console.log("🌐 Using DIRECT RPC:", DIRECT_RPC);

        // Use direct RPC endpoint, not proxy
        const casperClient = new CasperClient(DIRECT_RPC);

        const stateRootHash = await casperClient.nodeClient.getStateRootHash();
        console.log("✅ State root hash:", stateRootHash);

        // Get contract
        const contractHashKey = `hash-${CONTRACT_HASH}`;
        console.log("📦 Contract:", contractHashKey);

        // CEP-18 can use different key formats
        const accountPublicKey = CLPublicKey.fromHex(accountAddress);

        // Try different key formats
        const keyFormats = [
            `account-hash-${accountPublicKey.toAccountHashStr().slice(13)}`, // Without prefix
            accountPublicKey.toAccountHashStr(), // Full account-hash-...
            accountAddress, // Raw public key hex
        ];

        console.log("🔑 Will try these key formats:");
        keyFormats.forEach((k, i) => console.log(`   ${i + 1}. ${k.substring(0, 50)}...`));

        for (let i = 0; i < keyFormats.length; i++) {
            const dictionaryItemKey = keyFormats[i];
            try {
                console.log(`\n📍 Attempt ${i + 1}/${keyFormats.length}:`);
                console.log(`   Key: ${dictionaryItemKey.substring(0, 50)}...`);

                const result = await casperClient.nodeClient.getDictionaryItemByName(
                    stateRootHash,
                    contractHashKey,
                    'balances',  // Dictionary name
                    dictionaryItemKey
                );

                console.log("   📥 Raw result:", result);

                if (result && result.CLValue && result.CLValue.bytes) {
                    // Parse U256 balance
                    const balanceHex = result.CLValue.bytes;
                    console.log("   📊 Balance hex:", balanceHex);

                    const cleanHex = balanceHex.startsWith('0x') ? balanceHex.slice(2) : balanceHex;
                    const balance = parseInt(cleanHex, 16);

                    console.log("✅ SUCCESS! Found balance:", balance, "CFT");
                    console.log("   Used key format:", dictionaryItemKey.substring(0, 30) + "...");
                    return balance;
                }
            } catch (err) {
                console.log(`   ❌ Failed:`, err.message);
                console.error("   Full error:", err);
                continue;
            }
        }

        console.log("\nℹ️ No balance found in any format");
        console.log("This could mean:");
        console.log("- Account has 0 balance (never received tokens)");
        console.log("- Dictionary uses a different name than 'balances'");
        console.log("- Key format is different");
        return 0;

    } catch (error) {
        console.error("❌ CRITICAL ERROR in getTokenBalance:", error);
        console.error("Full error object:", error);
        return 0;
    }
}
