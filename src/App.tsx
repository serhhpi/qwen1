import CodeExplorer from "./components/CodeExplorer";
import Demo from "./components/Demo";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Nav from "./components/Nav";
import RunGuide from "./components/RunGuide";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg0 font-body text-ink antialiased">
      {/* амбиентные слои */}
      <div className="glow glow-amber" aria-hidden="true" />
      <div className="glow glow-teal" aria-hidden="true" />
      <div className="bg-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      <div className="bg-noise pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <Nav />

      <main className="relative z-10">
        <Hero />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-line2/70 to-transparent" />
        </div>
        <HowItWorks />
        <CodeExplorer />
        <RunGuide />
        <Demo />
      </main>

      <Footer />
    </div>
  );
}
