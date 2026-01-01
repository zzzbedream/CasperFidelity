/**
 * Local Balance Tracker
 * Workaround for CORS - Tracks balance in localStorage/memory
 */

const balances = {};

// Helpers to broadcast update
const notifyUpdate = () => {
    window.dispatchEvent(new Event('balance-updated'));
};

export const getLocalBalance = (address) => {
    if (!address) return 0;
    const stored = localStorage.getItem(`balance_${address}`);
    return stored ? parseInt(stored) : (balances[address] || 0);
};

export const setLocalBalance = (address, amount) => {
    balances[address] = amount;
    localStorage.setItem(`balance_${address}`, amount);
    notifyUpdate();
};

export const addToBalance = (amount) => {
    // Requires getting current address indirectly or assuming single user flow
    // For now, let's update ALL known balances or trigger event
    // Ideally we pass address, but if we don't have it, we can listen in context
    notifyUpdate();

    // Hack: Update in memory assuming we can re-fetch
    // Better: Transaction returns success, UI triggers "refresh"
};

export const subtractFromBalance = (amount) => {
    notifyUpdate();
};

// Direct manipulation helpers for explicit calls
export const updateBalance = (address, delta) => {
    const current = getLocalBalance(address);
    const newBal = current + delta;
    setLocalBalance(address, newBal);
    return newBal;
};
