import {
  Bot,
  BrainCircuit,
  FileText,
  Headphones,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Support",
      description:
        "Give customers instant answers using an intelligent AI support assistant available around the clock.",
    },
    {
      icon: BrainCircuit,
      title: "Smart Conversations",
      description:
        "Maintain conversation context so customers don't have to repeat themselves.",
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description:
        "Create natural support conversations with real-time messaging and typing indicators.",
    },
    {
      icon: Headphones,
      title: "Human Escalation",
      description:
        "Automatically or manually transfer complex conversations to human support agents.",
    },
    {
      icon: FileText,
      title: "Ticket Management",
      description:
        "Turn support issues into trackable tickets with priorities, statuses, and assignments.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Support",
      description:
        "Keep customer accounts, conversations, and support data protected with authenticated access.",
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
          Powerful features
        </p>

        <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Everything your support team needs
        </h2>

        <p className="mt-5 text-lg leading-8 text-slate-400">
          SupportAI combines artificial intelligence with human support to
          create a complete customer service experience.
        </p>
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/10 bg-slate-900/60 p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-slate-900"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-500 group-hover:text-white">
                <Icon size={23} />
              </div>

              <h3 className="text-xl font-semibold">{feature.title}</h3>

              <p className="mt-3 leading-7 text-slate-400">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Features;
