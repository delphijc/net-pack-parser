// src/App.tsx
import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import { PerformanceDashboard } from './components/performance/PerformanceDashboard';
import { Toaster } from '@/components/ui/toaster';
import { useWebVitals } from './hooks/useWebVitals';
import { WebSocketProvider } from './context/WebSocketContext';
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"

function App() {
  useWebVitals();

  return (
    <WebSocketProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
          <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
              <div className="mr-4 flex">
                <Link className="mr-6 flex items-center space-x-2" to="/">
                  <span className="font-bold sm:inline-block text-primary">
                    NetPack Parser
                  </span>
                </Link>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <Link
                    to="/performance"
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                  >
                    Performance
                  </Link>
                  <ModeToggle />
                </nav>
              </div>
            </div>
          </header>
          <main className="container py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/performance" element={<PerformanceDashboard />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </ThemeProvider>
    </WebSocketProvider>
  );
}

export default App;
