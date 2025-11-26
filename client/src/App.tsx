// src/App.tsx
import Dashboard from './components/dashboard/Dashboard';


function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold sm:inline-block text-primary">NetPack Parser</span>
            </a>
          </div>
        </div>
      </header>
      <main className="container py-6">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;