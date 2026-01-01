/**
 * Utility for CasperFidelity
 * Restored for compatibility if components import it
 */
import { DeployUtil, CLPublicKey, CLValueBuilder, RuntimeArgs } from 'casper-js-sdk';
import { CONTRACT_HASH, NETWORK_NAME } from '../config';

export const createIssuePointsDeploy = (contractHash, senderKeyHex, recipientKeyHex, amount) => {
    try {
        const senderKey = CLPublicKey.fromHex(senderKeyHex);
        const recipientKey = CLPublicKey.fromHex(recipientKeyHex);
        const contractHashBytes = Uint8Array.from(Buffer.from(contractHash.replace('hash-', ''), 'hex'));

        const args = RuntimeArgs.fromMap({
            recipient: CLValueBuilder.key(recipientKey),
            amount: CLValueBuilder.u256(amount)
        });

        const deploy = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(senderKey, NETWORK_NAME),
            DeployUtil.ExecutableDeployItem.newStoredContractByHash(
                contractHashBytes,
                "transfer",
                args
            ),
            DeployUtil.standardPayment(3000000000)
        );

        return deploy;
    } catch (e) {
        console.error("Error creating deploy:", e);
        throw e;
    }
};
