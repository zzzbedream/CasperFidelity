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
        const senderKey = CLPublicKey.fromHex(connectedAccount);
        const adminPubKey = CLPublicKey.fromHex(ADMIN_ADDRESS);

        const contractHashBytes = Uint8Array.from(
            CONTRACT_HASH.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        );

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

        addLog("🔏 Requesting signature...", "info");
        const response = await walletProvider.sign(JSON.stringify(deployJson), connectedAccount);

        if (response.cancelled) {
            throw new Error("❌ Cancelado");
        }

        let signatureHex = response.signatureHex || response.signature;
        if (!signatureHex && response.deploy?.approvals?.[0]?.signature) {
            signatureHex = response.deploy.approvals[0].signature;
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
        addLog(`✅ Redeemed!`, "success", deployHash);

        const { updateBalance } = await import('./localBalanceTracker');
        updateBalance(connectedAccount, -cost);

        return {
            success: true,
            hash: deployHash,
            message: `Redeemed ${rewardName}`
        };

    } catch (error) {
        throw new Error(`Redemption failed: ${error.message}`);
    }
}
