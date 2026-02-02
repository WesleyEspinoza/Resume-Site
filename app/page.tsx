// app/page.tsx
"use client";

import { motion } from "framer-motion";
import AdPlaceholder from "@/components/AdPlaceholder";

export default function Home() {
  return (
    <>
      {/* 
        Full-page wrapper with responsive padding, tailwind font, and
        light/dark gradient background support.
      */}
      <main className="bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900 min-h-screen px-4 sm:px-6 md:px-8 py-10 sm:py-16 font-sans">

        {/* 
          Desktop/Web Layout: 
          Sidebar-left (ad), main content, sidebar-right (ad)
          Auto-collapses into column layout on small/mobile screens.
        */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

          {/* LEFT SIDEBAR AD (Desktop Only, Sticky) */}
          <div className="hidden lg:block lg:w-[180px] xl:w-[220px] sticky top-6">
            <AdPlaceholder type="sidebar" />
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 w-full max-w-4xl mx-auto">

            {/* HERO SECTION ---------------------------------------- */}
            <motion.header
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 80 }}
              className="mb-14 sm:mb-16"
            >
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-50">
                Erick W. Espinoza
              </h1>

              <p className="mt-3 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-xl">
                IT wizard 🧰 • Software engineer 💻 • Customer-first problem solver 🧠
              </p>

              <p className="mt-2 text-sm sm:text-base text-zinc-500 dark:text-zinc-500">
                Based in Plymouth, MN • Proud promoter of “tech that helps people”
              </p>

              {/* Call-to-action buttons ---------------------------- */}
              <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row flex-wrap gap-4">
                <a
                  href="mailto:e.wesley.espinoza@gmail.com"
                  className="rounded-lg bg-blue-600 text-white px-5 py-3 text-center hover:bg-blue-700 transition-colors"
                >
                  Let’s Talk
                </a>
                <a
                  href="/resume.pdf"
                  className="rounded-lg border border-zinc-400 dark:border-zinc-700 px-5 py-3 text-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  Download Resume
                </a>
              </div>
            </motion.header>

            {/* ABOUT ---------------------------------------------- */}
            <Section title="A Little About Me">
              <p>
                I’m an IT professional turned software engineer who loves building
                solutions that connect people and tech without the headaches. I’ve worked
                on customer-facing apps used by millions, fixed more laptops than I can count,
                and I’m obsessed with learning how things work — and how to make them better.
              </p>
            </Section>

            {/* SKILLS ---------------------------------------------- */}
            <Section title="Skills I’m Known For">
              <SkillPillGroup
                title="Technical"
                items={["Git", "Mobile Dev", "API Design", "Web Apps", "Performance Optimization"]}
              />
              <SkillPillGroup title="Tech Support" items={["Hardware Repair", "Diagnostics", "Troubleshooting", "System Restore"]} />
              <SkillPillGroup title="People Skills" items={["Leadership", "Clear Communication", "Team Training", "Empathy-Driven Support"]} />
            </Section>

            {/* EXPERIENCE ---------------------------------------------- */}
            <Section title="Where I’ve Made an Impact">
              <Job
                role="Senior Agent — Geek Squad (Best Buy)"
                time="May 2023 – Present"
                points={[
                  "Lead advanced repair operations while maintaining 95%+ customer satisfaction.",
                  "Mentor and train junior techs on repair workflows and customer interaction.",
                  "Recognized as a top-performing agent in the district within 6 months.",
                ]}
              />
              <Job
                role="Freelance Web Developer"
                time="Jan 2023 – May 2023"
                points={[
                  "Designed and launched high-performing websites tailored to client brands.",
                  "Delivered hand-off documentation and training for client self-management.",
                  "Prioritized accessibility, SEO, and speed.",
                ]}
              />
              <Job
                role="Software Engineer — Nordstrom"
                time="May 2021 – Nov 2022"
                points={[
                  "Built scalable applications used by millions of customers.",
                  "Reduced internal tooling friction, speeding deployments across teams.",
                  "Led automation improvements resulting in measurable cost reductions.",
                ]}
              />
            </Section>

            {/* EDUCATION ---------------------------------------------- */}
            <Section title="Education & Highlights">
              <p className="font-semibold">
                B.S. Applied Computer Science — Dominican University of California
              </p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Graduated in 2 years • 2018 – 2020 • San Rafael, CA
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Promoted to Senior Agent at Geek Squad in just 6 months.</li>
                <li>Shipped software used by millions at Nordstrom.</li>
                <li>Known for tech → human translation skills, not jargon.</li>
              </ul>
            </Section>

            {/* ADS DISCLAIMER SECTION ---------------------------------------------- */}
            <Section title="Why You'll See Ads Here">
              <p>
                Yes — there are ads on this site. But they’re not here to fund a yacht or a Lambo.
                I added ads as a way to learn how modern web monetization works and to explore ad tech
                from a developer’s point of view.{" "}
                <span className="font-semibold">Instead of pocketing the revenue, anything generated from these ads
                  will be donated to nonprofits championing ethical tech, digital access, and human-centered engineering.</span>
              </p>
            </Section>

            {/* DONATION CTA SECTION ---------------------------------------------- */}
            <Section title="Want to Support Ethical Tech Directly?">
              <p>
                If you feel inspired to help build a more equitable digital world, here are a few
                organizations putting people first in tech. Each one champions digital inclusion,
                ethical engineering, or education for underrepresented voices.
              </p>

              <ul className="mt-4 list-disc pl-6 space-y-2 text-sm leading-relaxed">
                <li><a href="https://www.code2040.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Code2040</a> — Expanding opportunities for Black and Latinx people in tech.</li>
                <li><a href="https://www.girlswhocode.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Girls Who Code</a> — Closing the gender gap in tech.</li>
                <li><a href="https://www.eff.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Electronic Frontier Foundation (EFF)</a> — Defending civil liberties in the digital world.</li>
                <li><a href="https://www.techbridgegirls.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">TechBridge Girls</a> — Supporting STEM education for girls in low-income communities.</li>
                <li><a href="https://www.publicgood.github.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Public Good Software</a> — Connecting people with causes that matter.</li>
                <li><a href="https://www.blackgirlscode.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Black Girls Code</a> — Bringing young women of color into tech careers.</li>
                <li><a href="https://www.humanetech.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Center for Humane Technology</a> — Advocating for tech that respects people.</li>
              </ul>

              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Whether it’s shared knowledge, time, or resources — thank you for caring about a better tech future.
              </p>
            </Section>
          </div>

          {/* 
          Mobile-only top banner ad.
          Hidden on desktop or larger screens via Tailwind's lg:hidden utility.
        */}
        </div>
      </main>
    </>
  );
}

/* -------------------------------------------------
  ✅ SHARED COMPONENTS 
--------------------------------------------------*/
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4 text-zinc-800 dark:text-zinc-50">{title}</h2>
      <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">{children}</div>
    </section>
  );
}

function SkillPillGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-6">
      <p className="font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-zinc-200 dark:bg-zinc-800 text-xs px-3 py-1 text-zinc-700 dark:text-zinc-300"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function Job({
  role,
  time,
  points,
}: {
  role: string;
  time: string;
  points: string[];
}) {
  return (
    <div className="mb-6 border-l-2 border-zinc-300 dark:border-zinc-700 pl-4">
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">{role}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{time}</p>
      <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  );
}