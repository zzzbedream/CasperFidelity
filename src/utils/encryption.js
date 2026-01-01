/**
 * CasperFidelity Encryption Utilities
 * Based on SolCipher-Casper AES-256-GCM implementation
 * Uses wallet-derived keys for zero-password encryption
 */

// Generate encryption key from wallet public key
export async function deriveKeyFromWallet(publicKey) {
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(publicKey);
  
  // Import key material
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES-256-GCM key
  const salt = encoder.encode('casper-fidelity-v1'); // Static salt for consistency
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    cryptoKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return key;
}

// Encrypt data (returns base64 encrypted string)
export async function encryptData(plaintext, publicKey) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(plaintext));
    
    // Derive key from wallet
    const key = await deriveKeyFromWallet(publicKey);
    
    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data (from base64 encrypted string)
export async function decryptData(encryptedBase64, publicKey) {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    // Derive key from wallet
    const key = await deriveKeyFromWallet(publicKey);
    
    // Decrypt
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );
    
    // Decode and parse JSON
    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Encrypt balance for storage
export async function encryptBalance(balance, publicKey) {
  const data = {
    amount: balance,
    timestamp: Date.now(),
    version: 'v1'
  };
  return await encryptData(data, publicKey);
}

// Decrypt balance from storage
export async function decryptBalance(encryptedBalance, publicKey) {
  const data = await decryptData(encryptedBalance, publicKey);
  return data.amount;
}

// Generate secure random ID for transactions
export function generateSecureId() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Batch encryption for multiple items
export async function encryptBatch(items, publicKey) {
  return Promise.all(items.map(item => encryptData(item, publicKey)));
}

// Key rotation support
export async function rotateEncryptionKey(oldPublicKey, newPublicKey, encryptedData) {
  // Decrypt with old key
  const plaintext = await decryptData(encryptedData, oldPublicKey);
  
  // Re-encrypt with new key
  const newEncrypted = await encryptData(plaintext, newPublicKey);
  
  return newEncrypted;
}

// Verify integrity
export async function verifyIntegrity(encryptedData, expectedHash) {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', 
    Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
  );
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === expectedHash;
}
