import { useEffect, useState } from "react";
import { ArrowRight, Clock, Menu, ShieldCheck, Sparkles, XIcon } from "lucide-react";
import { ChromaFlow, FilmGrain, FlutedGlass, Shader, Swirl } from "shaders/react";

const NAV_LINKS = [
  { label: "The problem", href: "#problem" },
  { label: "Solution", href: "#layers" },
  { label: "How it works", href: "#flow" },
  { label: "Log in", href: "/login" },
] as const;

function useLagosTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const t = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Lagos",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());
      setTime(t);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const EASE = "cubic-bezier(0.25,0.1,0.25,1)";

function RollText({ label }: { label: string }) {
  return (
    <span className="flex flex-col overflow-hidden h-[20px] leading-[20px]">
      <span
        className="transition-transform duration-500 group-hover:-translate-y-1/2"
        style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
      >
        <span className="block h-[20px]">{label}</span>
        <span className="block h-[20px]">{label}</span>
      </span>
    </span>
  );
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
        <ShieldCheck size={16} className="text-[#34D399]" />
      </span>
      <span className="text-[18px] sm:text-[19px] font-semibold tracking-tight text-gray-900">
        TrustFlow<span className="text-[#059669]"> AI</span>
      </span>
    </span>
  );
}

export default function Hero() {
  const time = useLagosTime();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section
      className="relative flex flex-col min-h-[640px] sm:min-h-[720px] lg:min-h-screen"
      style={{ backgroundColor: "#EFEFEF" }}
    >
      {/* Shader stack */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <Shader style={{ width: "100%", height: "100%" }}>
          <Swirl colorA="#ffffff" colorB="#f0f0f0" detail={1.7} />
          <ChromaFlow
            baseColor="#ffffff"
            downColor="#34D399"
            leftColor="#34D399"
            rightColor="#10B981"
            upColor="#34D399"
            momentum={13}
            radius={3.5}
          />
          <FlutedGlass
            aberration={0.61}
            angle={31}
            frequency={8}
            highlight={0.12}
            highlightSoftness={0}
            lightAngle={-90}
            refraction={4}
            shape="rounded"
            softness={1}
            speed={0.15}
          />
          <FilmGrain strength={0.05} />
        </Shader>
      </div>

      {/* Nav */}
      <div className="relative z-20 mx-auto w-full max-w-[1440px] p-2 sm:p-3">
        <nav className="bg-white rounded-full flex items-center justify-between gap-2" style={{ padding: 5 }}>
          <div className="flex items-center gap-4 lg:gap-6 min-w-0">
            <Wordmark className="pl-2" />
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              {NAV_LINKS.map((l) => (
                <a key={l.label} href={l.href} className="text-[14px] text-gray-900 hover:opacity-70 transition-opacity">
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-5 pr-1">
            <span className="hidden lg:flex items-center gap-1.5 text-[13px] text-gray-600">
              <Clock size={14} />
              {time} in Lagos
            </span>
            <a
              href="/login"
              className="group bg-gray-900 text-white text-[13px] font-medium rounded-full pl-4 lg:pl-5 pr-2 py-2 flex items-center gap-2 lg:gap-3 shrink-0"
            >
              <RollText label="Try the demo" />
              <span
                className="w-6 h-6 bg-[#34D399] rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
                style={{ transitionTimingFunction: EASE }}
              >
                <ArrowRight size={12} className="text-gray-900" />
              </span>
            </a>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden bg-gray-900 text-white rounded-full p-2.5"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute left-0 right-0 bottom-0 mx-3 mb-3 bg-white rounded-2xl p-6 translate-y-0 transition-transform duration-500"
            style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)", animation: "slideUp 0.5s cubic-bezier(0.32,0.72,0,1)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-[13px] text-gray-600 border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1.5">
                <Clock size={14} /> {time} in Lagos
              </span>
              <button onClick={() => setMenuOpen(false)} className="bg-gray-900 text-white rounded-full p-2.5">
                <XIcon size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3 mb-8">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-[28px] leading-[32px] font-medium text-gray-900"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <a
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="group w-full bg-[#34D399] text-gray-900 text-[14px] font-medium rounded-full pl-6 pr-2 py-2 flex items-center justify-between"
            >
              <RollText label="Try the demo" />
              <span
                className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
                style={{ transitionTimingFunction: EASE }}
              >
                <ArrowRight size={14} className="text-[#34D399]" />
              </span>
            </a>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Hero content */}
      <div className="relative z-20 mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20">
        <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur rounded-full pl-2 pr-3.5 py-1.5 mb-6 sm:mb-8 border border-white">
          <span className="text-[10px] sm:text-[11px] bg-gray-900 text-white px-2 py-0.5 rounded-full">OPay × Google '26</span>
          <span className="text-[12px] sm:text-[13px] font-medium text-gray-700">National Innovation Challenge</span>
        </div>

        <h1
          className="font-medium text-gray-900"
          style={{
            fontSize: "clamp(1.75rem,7vw,4.2rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          <span className="sm:hidden">
            Make every buyer–seller transaction <span className="italic font-light text-[#059669]">safe</span> — from chat to cash.
          </span>
          <span className="hidden sm:inline" style={{ fontSize: "clamp(2.5rem,5vw,4.2rem)" }}>
            Make every buyer–seller
            <br />
            transaction <span className="italic font-light text-[#059669]">safe</span> —
            <br />
            from chat to cash.
          </span>
        </h1>

        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center">
          <a
            href="/demo"
            className="group bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[13px] sm:text-[14px] font-medium rounded-full pl-5 sm:pl-6 pr-2 py-2 flex items-center gap-3 transition-colors"
          >
            <RollText label="Try the live demo" />
            <span
              className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
              style={{ transitionTimingFunction: EASE }}
            >
              <ArrowRight size={14} className="text-[#34D399]" />
            </span>
          </a>

          <a
            href="#flow"
            className="group bg-gray-900 hover:bg-gray-800 text-white text-[13px] sm:text-[14px] font-medium rounded-full pl-5 sm:pl-6 pr-2 py-2 flex items-center gap-3 transition-colors"
          >
            <RollText label="See how it works" />
            <span
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45"
              style={{ transitionTimingFunction: EASE }}
            >
              <ArrowRight size={14} className="text-gray-900" />
            </span>
          </a>

          <div
            className="bg-white flex items-center gap-2 px-3 py-2 transition-shadow"
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)")}
          >
            <Sparkles className="w-5 h-5 sm:w-5 sm:h-5 text-[#059669]" />
            <span className="text-[13px] sm:text-[14px] font-medium text-gray-900">Powered by Google Gemini</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
