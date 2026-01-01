import {
    DeployUtil,
    CLPublicKey,
    CLValueBuilder,
    RuntimeArgs
} from 'casper-js-sdk';
import { NODE_URL, NETWORK_NAME, CONTRACT_HASH, ADMIN_ADDRESS } from '../config';

export async function issuePointsReal(recipient, amount, connectedAccount, walletProvider, addLog) {
    try {
        console.log("🚀 [1/6] Iniciando proceso para:", recipient);
        addLog(`📝 Preparing deploy to issue ${amount} CFT...`, "info");

        const senderKey = CLPublicKey.fromHex(connectedAccount);
        const recipientPubKey = CLPublicKey.fromHex(recipient);

        const contractHashBytes = Uint8Array.from(
            CONTRACT_HASH.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        );

        console.log("🟡 [2/6] Creating deploy...");

        // ✅ CLAVE: Usar CLValueBuilder.key para el recipient
        const args = RuntimeArgs.fromMap({
            "recipient": CLValueBuilder.key(recipientPubKey),
            "amount": CLValueBuilder.u256(amount)
        });

        const deploy = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(senderKey, NETWORK_NAME || 'casper-test'),
            DeployUtil.ExecutableDeployItem.newStoredContractByHash(
                contractHashBytes,
                "transfer",  // ✅ CLAVE: transfer, NO mint
                args
            ),
            DeployUtil.standardPayment(3_000_000_000)
        );

        const deployJson = DeployUtil.deployToJson(deploy);

        console.log("🟡 [3/6] Solicitando firma...");
        addLog("🔏 Requesting signature from Casper Wallet...", "info");

        const response = await walletProvider.sign(
            JSON.stringify(deployJson),
            connectedAccount
        );

        if (response.cancelled) {
            throw new Error("❌ Cancelado por usuario");
        }

        // ✅ CLAVE: Extracción defensiva de firma
        let signatureHex = null;
        if (response.signatureHex) {
            signatureHex = response.signatureHex;
        } else if (response.signature && typeof response.signature === 'string') {
            signatureHex = response.signature;
        } else if (response.deploy?.approvals?.[0]?.signature) {
            signatureHex = response.deploy.approvals[0].signature;
        }

        if (!signatureHex) {
            throw new Error("No se encontró la firma");
        }

        // ✅ CLAVE: Convertir hex STRING a BYTES
        let signatureBytes;
        if (typeof signatureHex === 'string') {
            const cleanHex = signatureHex.startsWith('0x') ? signatureHex.slice(2) : signatureHex;
            signatureBytes = Uint8Array.from(
                cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
            );
        } else {
            signatureBytes = signatureHex;
        }

        const signedDeploy = DeployUtil.setSignature(deploy, signatureBytes, senderKey);

        const rawDeployJson = DeployUtil.deployToJson(signedDeploy);
        const cleanDeployJson = JSON.parse(JSON.stringify(rawDeployJson));

        // ✅ CLAVE: Params como OBJETO, no array
        const rpcBody = {
            jsonrpc: "2.0",
            id: Date.now(),
            method: "account_put_deploy",
            params: {
                deploy: cleanDeployJson.deploy  // OBJETO
            }
        };

        addLog("📡 Sending deploy to Casper Network...", "info");

        // Use NODE_URL directly (already has full URL in production, relative in dev)
        const rpcUrl = window.location.origin + NODE_URL;

        const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rpcBody)
        });

        const data = await res.json();

        if (data.error) {
            throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
        }

        const deployHash = data.result.deploy_hash;
        console.log("🏆 [SUCCESS] Hash:", deployHash);
        addLog(`✅ Deploy sent successfully!`, "success", deployHash);

        // Local balance tracking
        const { updateBalance } = await import('./localBalanceTracker');
        updateBalance(recipient, amount);

        return {
            success: true,
            hash: deployHash,
            message: `Successfully issued ${amount} CFT`
        };

    } catch (error) {
        console.error("❌ Error:", error);
        throw new Error(`Transaction failed: ${error.message}`);
    }
}

export async function redeemRewardReal(rewardName, cost, connectedAccount, walletProvider, addLog) {
    try {
        console.log("🎁 [REDEEM 1/6] Starting redemption:", { rewardName, cost, connectedAccount });
        addLog(`📝 Preparing redeem for ${rewardName} (${cost} CFT)...`, "info");

        const senderKey = CLPublicKey.fromHex(connectedAccount);
        const adminPubKey = CLPublicKey.fromHex(ADMIN_ADDRESS);

        const contractHashBytes = Uint8Array.from(
            CONTRACT_HASH.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        );

        console.log("🎁 [REDEEM 2/6] Creating deploy...");

        const args = RuntimeArgs.fromMap({
            "recipient": CLValueBuilder.key(adminPubKey),
            "amount": CLValueBuilder.u256(cost)
        });

        const deploy = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(senderKey, NETWORK_NAME || 'casper-test'),
            DeployUtil.ExecutableDeployItem.newStoredContractByHash(
                contractHashBytes,
                "transfer",
                args
            ),
            DeployUtil.standardPayment(3_000_000_000)
        );

        const deployJson = DeployUtil.deployToJson(deploy);
        console.log("🎁 [REDEEM 3/6] Deploy created, requesting signature...");

        addLog("🔏 Requesting signature...", "info");
        const response = await walletProvider.sign(JSON.stringify(deployJson), connectedAccount);

        if (response.cancelled) {
            throw new Error("❌ Cancelado");
        }

        console.log("🎁 [REDEEM 4/6] Signature received:", response);

        let signatureHex = response.signatureHex || response.signature;
        if (!signatureHex && response.deploy?.approvals?.[0]?.signature) {
            signatureHex = response.deploy.approvals[0].signature;
        }

        if (!signatureHex) {
            throw new Error("No signature found");
        }

        let signatureBytes;
        if (typeof signatureHex === 'string') {
            const cleanHex = signatureHex.startsWith('0x') ? signatureHex.slice(2) : signatureHex;
            signatureBytes = Uint8Array.from(
                cleanHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
            );
        } else {
            signatureBytes = signatureHex;
        }

        const signedDeploy = DeployUtil.setSignature(deploy, signatureBytes, senderKey);
        const rawDeployJson = DeployUtil.deployToJson(signedDeploy);
        const cleanDeployJson = JSON.parse(JSON.stringify(rawDeployJson));

        const rpcBody = {
            jsonrpc: "2.0",
            id: Date.now(),
            method: "account_put_deploy",
            params: {
                deploy: cleanDeployJson.deploy
            }
        };

        console.log("🎁 [REDEEM 5/6] Sending to RPC...");
        console.log("📋 Full RPC Body:", JSON.stringify(rpcBody, null, 2));
        addLog("📡 Sending deploy to network...", "info");

        const rpcUrl = window.location.origin + NODE_URL;
        const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rpcBody)
        });

        const data = await res.json();
        console.log("🎁 [REDEEM 6/6] RPC Response:", JSON.stringify(data, null, 2));

        if (data.error) {
            console.error("❌ RPC Error Full Details:", JSON.stringify(data.error, null, 2));
            throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
        }

        const deployHash = data.result.deploy_hash;
        console.log("🏆 [REDEEM SUCCESS] Hash:", deployHash);
        addLog(`✅ Redeemed!`, "success", deployHash);

        const { updateBalance } = await import('./localBalanceTracker');
        updateBalance(connectedAccount, -cost);

        return {
            success: true,
            hash: deployHash,
            message: `Redeemed ${rewardName}`
        };

    } catch (error) {
        console.error("❌ Redeem Error:", error);
        addLog(`❌ Redemption failed: ${error.message}`, "error");
        throw new Error(`Redemption failed: ${error.message}`);
    }
}
