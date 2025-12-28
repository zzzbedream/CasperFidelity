import React, { useState, useEffect } from 'react';
import { ClickProvider, useClickRef } from '@make-software/csprclick-react';
import { Gift, Wallet, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { ADMIN_ADDRESS } from './config';
import AdminView from './components/AdminView';
import UserView from './components/UserView';

// Configuración mínima de CSPRClick
const clickOptions = {
  appName: 'CasperFidelity',
  appId: 'csprclick-template',
  contentMode: 'popup', // POPUP es más estable que iframe
  providers: ['casper-wallet', 'casper-signer']
};

function AppContent() {
  const clickRef = useClickRef();
  const [isAdmin, setIsAdmin] = useState(false);

  // Detectar si es admin
  useEffect(() => {
    if (clickRef?.activeAccount?.public_key && ADMIN_ADDRESS) {
      const isAdminUser = clickRef.activeAccount.public_key.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
      setIsAdmin(isAdminUser);
    }
  }, [clickRef?.activeAccount]);

  // Mientras carga CSPR.click
  if (!clickRef) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-xl">Inicializando...</p>
        </div>
      </div>
    );
  }

  const { activeAccount, signIn, signOut, isConnected } = clickRef;

  // LANDING PAGE - No conectado
  if (!isConnected || !activeAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-4xl text-center">

          <div className="flex justify-center mb-8">
            <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
              <Gift className="w-20 h-20 text-blue-300" />
            </div>
          </div>

          <h1 className="text-7xl font-extrabold mb-6 tracking-tight">
            Casper<span className="text-blue-300">Fidelity</span>
          </h1>

          <p className="text-2xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Loyalty Rewards on the Blockchain
            <br /><span className="text-blue-300 font-medium">Secure • Transparent • Instant</span>
          </p>

          {/* BOTÓN SIMPLE */}
          <button
            onClick={() => {
              console.log("🔌 Connecting...");
              signIn();
            }}
            className="group relative inline-flex items-center justify-center px-12 py-5 font-bold text-white transition-all duration-300 bg-blue-500 rounded-2xl hover:bg-blue-400 hover:scale-105 shadow-2xl"
          >
            <Wallet className="w-7 h-7 mr-3" />
            <span className="text-xl">CONNECT WALLET</span>
            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>

          <div className="mt-16 grid grid-cols-3 gap-8 text-blue-200">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-8 h-8 mb-3" />
              <span className="text-sm font-medium">SECURE</span>
            </div>
            <div className="flex flex-col items-center">
              <User className="w-8 h-8 mb-3" />
              <span className="text-sm font-medium">DIRECT</span>
            </div>
            <div className="flex flex-col items-center">
              <Gift className="w-8 h-8 mb-3" />
              <span className="text-sm font-medium">REWARDS</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD - Conectado
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

            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-gray-400">Connected</span>
              <span className="font-mono text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded border">
                {activeAccount.public_key.slice(0, 10)}...{activeAccount.public_key.slice(-6)}
              </span>
            </div>

            <button
              onClick={signOut}
              className="text-sm font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg px-4 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        {isAdmin
          ? <AdminView activeAccount={activeAccount} />
          : <UserView activeAccount={activeAccount} />
        }
      </main>
    </div>
  );
}

// Componente principal con Provider
function App() {
  return (
    <ClickProvider options={clickOptions}>
      <AppContent />
    </ClickProvider>
  );
}

export default App;
