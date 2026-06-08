import { createFileRoute } from "@tanstack/react-router";
import Hero from "@/components/axion/Hero";
import Marquee from "@/components/axion/Marquee";
import About from "@/components/axion/About";
import ValueProps from "@/components/axion/ValueProps";
import HowItWorks from "@/components/axion/HowItWorks";
import CaseStudies from "@/components/axion/CaseStudies";
import CTA from "@/components/axion/CTA";
import Footer from "@/components/axion/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "TrustFlow AI — Making every transaction between buyers and sellers safe" },
      {
        name: "description",
        content:
          "TrustFlow AI is the trust layer for African digital commerce — OPay-backed escrow, Gemini-powered fraud detection, and network-wide fraud intelligence.",
      },
    ],
  }),
});

function Index() {
  return (
    <main>
      <Hero />
      <Marquee />
      <div id="problem"><About /></div>
      <div id="layers"><ValueProps /></div>
      <div id="flow"><HowItWorks /></div>
      <div id="domains"><CaseStudies /></div>
      <CTA />
      <Footer />
    </main>
  );
}
