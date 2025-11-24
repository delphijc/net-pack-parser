// src/App.tsx
import SettingsPage from './components/SettingsPage';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Net Pack Parser</h1>
      <SettingsPage />
      <Toaster />
    </main>
  );
}

export default App;