import React, { useState } from 'react';
import Dashboard from './components/Dashboard';

function App() {
  const [userProfile, setUserProfile] = useState(null);

  const handleLogin = (name, disability) => {
    setUserProfile({ name, disability });
  };

  if (!userProfile) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="p-8 bg-slate-800 rounded-lg">
          <h1 className="text-3xl font-bold mb-4 text-blue-400">SenseMesh Login</h1>
          {/* Simple Mock Login for Demo */}
          <div className="flex gap-4">
            <button onClick={() => handleLogin('User', 'deaf')} className="bg-yellow-500 p-3 rounded text-black font-bold">I am Deaf</button>
            <button onClick={() => handleLogin('User', 'blind')} className="bg-green-500 p-3 rounded font-bold">I am Blind</button>
            <button onClick={() => handleLogin('User', 'mute')} className="bg-blue-500 p-3 rounded font-bold">I am Mute</button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard userProfile={userProfile} />;
}

export default App;
