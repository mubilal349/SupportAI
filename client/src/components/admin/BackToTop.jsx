import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const BackToTop = ({ scrollContainer = null }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const container = scrollContainer?.current;

    // =========================================================
    // CUSTOM SCROLL CONTAINER
    // =========================================================

    if (container) {
      const handleScroll = () => {
        setShowButton(container.scrollTop > 30);
      };

      handleScroll();

      container.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }

    // =========================================================
    // WINDOW SCROLL
    // =========================================================

    const handleWindowScroll = () => {
      setShowButton(window.scrollY > 30);
    };

    handleWindowScroll();

    window.addEventListener("scroll", handleWindowScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [scrollContainer]);

  // =========================================================
  // SCROLL TO TOP
  // =========================================================

  const scrollToTop = () => {
    const container = scrollContainer?.current;

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!showButton) {
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
        z-[100]
        flex
        h-11
        w-11
        cursor-pointer
        items-center
        justify-center
        rounded-xl
        border
        border-slate-700
        bg-[#0a1222]/95
        text-slate-400
        shadow-2xl
        shadow-black/30
        backdrop-blur-md
        transition-all
        duration-200
        hover:border-blue-500/40
        hover:bg-blue-600
        hover:text-white
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500/30
        sm:bottom-7
        sm:right-7
      "
    >
      <ArrowUp size={18} strokeWidth={2.2} />
    </button>
  );
};

export default BackToTop;
