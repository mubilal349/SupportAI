import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      className="
        fixed
        bottom-6
        right-6
        z-50
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-xl
        border
        border-white/10
        bg-slate-900/90
        text-slate-300
        shadow-xl
        shadow-black/20
        backdrop-blur-xl
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-blue-500/40
        hover:bg-blue-600
        hover:text-white
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500/50
        sm:bottom-8
        sm:right-8
      "
    >
      <ArrowUp size={20} strokeWidth={2.2} />
    </button>
  );
};

export default BackToTop;
