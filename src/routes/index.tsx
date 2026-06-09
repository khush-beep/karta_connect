import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Quote } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Karta Connect — Student & Company Network" },
      { name: "description", content: "A platform by Karta Foundation connecting students, companies, and opportunities." },
    ],
  }),
  component: Landing,
});

const bgImages = [
  "/student-presentation.png",
  "/student-group-monument.png",
  "/student-group-uniforms.png",
  "/student-group-classroom.png",
];

const partners = [
  { name: "Trent Limited", logo: "/trent-logo.png", isImage: true },
  { name: "Tata Consultancy Services", logo: "TCS", isImage: false },
  { name: "Infosys Limited", logo: "Infosys", isImage: false },
  { name: "Reliance Industries", logo: "Reliance", isImage: false },
  { name: "Wipro Technologies", logo: "Wipro", isImage: false },
  { name: "HDFC Bank", logo: "HDFC Bank", isImage: false },
];

const quotes = [
  {
    text: "Empowering scholars from underprivileged communities by bridging the gap between education and global career opportunities.",
    author: "Karta Initiative Mission"
  },
  {
    text: "Building a future where career success is defined by talent and ambition, not by social or economic background.",
    author: "Equality of Opportunity"
  },
  {
    text: "An ecosystem connecting top-tier corporate partners with high-potential scholars through structured matching.",
    author: "Frictionless Matching"
  },
  {
    text: "Transforming communities by unlocking youth leadership potential and fostering corporate academic collaborations.",
    author: "Social Impact"
  }
];

function BackgroundSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % bgImages.length);
    }, 6000); // Transition every 6 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      {bgImages.map((src, idx) => (
        <div
          key={src}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
            idx === index ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          style={{ backgroundImage: `url('${src}')` }}
        />
      ))}
      {/* Dark overlay for maximum contrast and readability */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
    </div>
  );
}

function QuoteRotator() {
  const [qIndex, setQIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQIndex((prev) => (prev + 1) % quotes.length);
        setFade(true);
      }, 500); // Wait for fade out
    }, 8000); // Change quote every 8 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center h-full p-8 text-white space-y-6">
      <div className="bg-primary/20 w-fit p-3 rounded-2xl border border-primary/30">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <div className={`transition-opacity duration-500 min-h-[140px] flex flex-col justify-between ${fade ? "opacity-100" : "opacity-0"}`}>
        <blockquote className="text-base md:text-lg font-medium italic leading-relaxed text-zinc-200">
          "{quotes[qIndex].text}"
        </blockquote>
        <div className="mt-4 flex items-center gap-2">
          <Quote className="h-4 w-4 text-primary opacity-60" />
          <p className="text-xs font-bold uppercase tracking-widest text-primary">— {quotes[qIndex].author}</p>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-slate-950 font-sans">
      <BackgroundSlideshow />

      {/* Transparent Header */}
      <header className="relative z-20 w-full px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <div className="bg-white rounded-md p-1 shadow-sm border border-slate-100 flex items-center justify-center h-7 w-7 shrink-0">
              <img src="/karta-logo.png" className="h-full w-full object-contain" alt="Karta Initiative Logo" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">Karta Connect</span>
          </Link>
          <Link to="/login">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white text-xs px-4 py-1.5 h-8">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      {/* Central Glassmorphic Portal Card */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-4xl bg-black/40 border border-white/10 rounded-3xl backdrop-blur-md overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[440px] animate-in fade-in duration-700">
          
          {/* Left Panel: Quote Rotator */}
          <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
            <QuoteRotator />
          </div>

          {/* Right Panel: Small Sign In Action Card */}
          <div className="w-full md:w-[380px] p-8 flex flex-col justify-center space-y-6">
            <div className="bg-white rounded-2xl p-4 max-w-[180px] mx-auto shadow-md border border-white/10 flex items-center justify-center backdrop-blur-sm">
              <img src="/karta-logo.png" className="w-full h-auto object-contain max-h-[54px]" alt="Karta Initiative Logo" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-extrabold tracking-tight text-white">Portal Sign In</h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Access your Karta matching network profile, opportunities pipeline, and admin controls.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/login" className="w-full">
                <Button size="lg" className="w-full font-bold shadow-lg hover:scale-102 transition-transform duration-200 flex items-center justify-center gap-2">
                  Enter Portal <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Continuous Scrolling Partner Logo Marquee Footer */}
      <footer className="w-full bg-black/40 border-t border-white/10 py-5 overflow-hidden relative z-20 mt-auto">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative w-full overflow-hidden">
            {/* Gradient Edge Fades */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-950/80 to-transparent z-10 pointer-events-none" />
            
            {/* Sliding Track */}
            <div className="animate-marquee flex gap-8 items-center py-1.5">
              {partners.map((partner, i) => (
                <div key={i} className="flex items-center justify-center bg-white/5 px-5 py-2.5 rounded-xl border border-white/10 shadow-sm min-w-[150px] h-[48px] shrink-0">
                  {partner.isImage ? (
                    <img src={partner.logo} alt={partner.name} className="max-h-[26px] w-auto object-contain brightness-0 invert opacity-75" />
                  ) : (
                    <span className="font-bold text-xs tracking-tight text-white/70 uppercase">{partner.name}</span>
                  )}
                </div>
              ))}
              {/* Duplicate set for seamless looping */}
              {partners.map((partner, i) => (
                <div key={`dup-${i}`} className="flex items-center justify-center bg-white/5 px-5 py-2.5 rounded-xl border border-white/10 shadow-sm min-w-[150px] h-[48px] shrink-0">
                  {partner.isImage ? (
                    <img src={partner.logo} alt={partner.name} className="max-h-[26px] w-auto object-contain brightness-0 invert opacity-75" />
                  ) : (
                    <span className="font-bold text-xs tracking-tight text-white/70 uppercase">{partner.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
