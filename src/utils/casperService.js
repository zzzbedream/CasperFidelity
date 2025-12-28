import {
    CasperClient,
    Contracts,
    CLValueBuilder,
    RuntimeArgs,
    CLPublicKey,
    CLAccountHash,
    DeployUtil
} from 'casper-js-sdk';
import { NODE_URL, NETWORK_NAME } from '../config';

const casperClient = new CasperClient(NODE_URL);
const contract = new Contracts.Contract(casperClient);

export const getBalance = async (contractHash, publicKeyHex) => {
    try {
        contract.setContractHash(contractHash);

        // Convert Public Key Hex to Account Hash Key for dictionary lookup
        // CEP-18 typically uses the Key of the account (AccountHash or PublicKey) 
        // mapped to the balance.

        const accountKey = CLPublicKey.fromHex(publicKeyHex);

        // We try to query the dictionary API
        // Dictionary name is usually "balances" in CEP-18

        // However, standard JS SDK fetch is by string key usually for standard maps.
        // Let's rely on queryContractDictionary with the string representation of the key
        // The standard usually uses the base64 or hex representation of the key bytes as the dictionary item key

        // Simpler approach for CEP-18: Call the 'balance_of' entrypoint as a read-only call (query)
        // This avoids guessing dictionary serialization.

        // BUT calling entrypoint via RPC query is complex.
        // Let's stick to dictionary query if possible.
        // Standard CEP-18: dictionary "balances", key: encoded key.

        // Alternative: Use `queryContractDictionary` with the AccountHash string (without "account-hash-")
        const result = await contract.queryContractDictionary(
            "balances",
            accountKey.toAccountHashStr().substring(13) // Remove 'account-hash-' prefix to get hex
        );

        if (result) {
            return result.toString();
        }
        return "0";
    } catch (error) {
        console.error("Error fetching balance:", error);
        return "0";
    }
};

export const createIssuePointsDeploy = (contractHash, adminPublicKey, customerAddress, amount) => {
    contract.setContractHash(contractHash);

    // customerAddress is the public key hex string
    const recipientKey = CLValueBuilder.key(
        CLPublicKey.fromHex(customerAddress)
    );

    const args = RuntimeArgs.fromMap({
        recipient: recipientKey,
        amount: CLValueBuilder.u256(amount)
    });

    return contract.callEntrypoint(
        "mint",
        args,
        CLPublicKey.fromHex(adminPublicKey),
        NETWORK_NAME,
        "1000000000" // 1 CSPR payment (standard is generous)
    );
};

export const createRedeemDeploy = (contractHash, userPublicKey, adminPublicKey, amount) => {
    contract.setContractHash(contractHash);

    // Transfer from user (caller) to admin (recipient)
    const recipientKey = CLValueBuilder.key(
        CLPublicKey.fromHex(adminPublicKey)
    );

    const args = RuntimeArgs.fromMap({
        recipient: recipientKey,
        amount: CLValueBuilder.u256(amount)
    });

    return contract.callEntrypoint(
        "transfer",
        args,
        CLPublicKey.fromHex(userPublicKey),
        NETWORK_NAME,
        "500000000" // 0.5 CSPR
    );
};

