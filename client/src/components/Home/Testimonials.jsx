import { Quote, Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Customer Success Manager",
      initials: "SJ",
      text: "SupportAI gives our customers immediate answers while allowing our team to focus on complex issues.",
    },
    {
      name: "Daniel Smith",
      role: "SaaS Founder",
      initials: "DS",
      text: "The combination of AI conversations and human escalation makes this feel like a complete support platform.",
    },
    {
      name: "Emily Wilson",
      role: "Support Lead",
      initials: "EW",
      text: "Our customers get help faster, and our support agents have much more time for important conversations.",
    },
  ];

  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      {" "}
      <div className="mx-auto max-w-2xl text-center">
        {" "}
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
          Customer stories{" "}
        </p>
        <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
          Built for better support
        </h2>
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.name}
            className="rounded-2xl border border-white/10 bg-slate-900/60 p-7"
          >
            <Quote size={28} className="text-blue-400" />

            <div className="mt-5 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={15}
                  className="fill-current text-yellow-400"
                />
              ))}
            </div>

            <p className="mt-5 leading-7 text-slate-300">
              "{testimonial.text}"
            </p>

            <div className="mt-7 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-semibold">
                {testimonial.initials}
              </div>

              <div>
                <p className="font-semibold">{testimonial.name}</p>

                <p className="text-sm text-slate-500">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
