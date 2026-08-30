import { UserPlus, MessageCircle, Bot, Headphones } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Create an account",
      description:
        "Register your account and access your personalized support workspace.",
    },
    {
      number: "02",
      icon: MessageCircle,
      title: "Start a conversation",
      description: "Ask your question through the SupportAI chat interface.",
    },
    {
      number: "03",
      icon: Bot,
      title: "AI solves your issue",
      description:
        "SupportAI understands your question and provides a helpful response.",
    },
    {
      number: "04",
      icon: Headphones,
      title: "Talk to a human",
      description:
        "If AI cannot solve the issue, escalate the conversation to a human agent.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="border-y border-white/10 bg-slate-900/40"
    >
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Simple workflow
          </p>

          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Support in four simple steps
          </h2>

          <p className="mt-5 text-lg text-slate-400">
            From the first question to human escalation, SupportAI keeps the
            experience simple.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.number} className="relative">
                <span className="text-5xl font-black text-white/5">
                  {step.number}
                </span>

                <div className="mt-[-20px]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                    <Icon size={22} />
                  </div>

                  <h3 className="text-xl font-semibold">{step.title}</h3>

                  <p className="mt-3 leading-7 text-slate-400">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
