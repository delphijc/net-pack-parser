// src/App.tsx
import Dashboard from './components/dashboard/Dashboard';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <main className="container mx-auto p-4 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">NetTraffic Parser</h1>
      </div>
      <div className="flex-1 overflow-hidden bg-gray-900 rounded-lg shadow-xl border border-gray-800">
        <Dashboard />
      </div>
      <Toaster />
    </main>
  );
}

export default App;