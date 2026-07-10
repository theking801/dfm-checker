/**
 * ScrollStack — Style odysser.com
 *
 * Les cartes s'empilent via position: sticky avec des top offsets
 * incrémentaux. Aucune animation JS — le navigateur gère l'empilement
 * nativement avec CSS sticky positioning.
 */

import { useRef, useState, useEffect } from "react";
import "./ScrollStack.css";

export const ScrollStackItem = ({ children, itemClassName = "" }) => (
  <div className="scroll-stack-card-wrapper">
    <div className={`scroll-stack-card ${itemClassName}`.trim()}>
      {children}
    </div>
  </div>
);

const ScrollStack = ({
  children,
  className = "",
  topStart = 80,
  topGap = 16,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardsRef = useRef([]);
  const absoluteTopsRef = useRef([]);
  const innerRef = useRef(null);

  const count = Array.isArray(children) ? children.length : 1;

  useEffect(() => {
    const cards = cardsRef.current;
    if (cards.length === 0) return;

    const updateTops = () => {
      absoluteTopsRef.current = cards.map((card) => {
        if (!card) return 0;
        let top = 0;
        let el = card;
        while (el) {
          top += el.offsetTop;
          el = el.offsetParent;
        }
        return top;
      });
    };

    const updateSpacerHeight = () => {
      if (!innerRef.current) return;
      const spacer = innerRef.current.querySelector(".scroll-stack-spacer");
      if (!spacer) return;
      const vh = window.innerHeight;
      // Avec topGap=16 et du sticky pur, les cartes n'ont besoin que
      // d'un peu d'espace pour s'empiler — bien moins qu'avant (0.55)
      spacer.style.height = `${count * vh * 0.15}px`;
    };

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const absoluteTops = absoluteTopsRef.current;
      const vh = window.innerHeight;

      if (absoluteTops.length === 0) {
        updateTops();
      }

      let currentActiveIndex = 0;

      cards.forEach((card, i) => {
        if (!card) return;

        // The scroll offset where this card starts sticking
        const stickStart = absoluteTops[i] - (topStart + i * topGap);

        // Active index corresponds to the topmost sticky card
        if (scrollTop >= stickStart - 10) {
          currentActiveIndex = i;
        }
      });

      setActiveIndex((prev) =>
        prev !== currentActiveIndex ? currentActiveIndex : prev
      );
    };

    // Initial calculations
    updateSpacerHeight();
    setTimeout(() => {
      updateTops();
      handleScroll();
    }, 100);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", () => {
      updateSpacerHeight();
      updateTops();
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateSpacerHeight);
    };
  }, [count, topStart, topGap]);

  const scrollToCard = (index) => {
    const absoluteTops = absoluteTopsRef.current;
    if (absoluteTops && absoluteTops[index] !== undefined) {
      const targetScroll = absoluteTops[index] - (topStart + index * topGap);
      window.scrollTo({
        top: targetScroll + 2,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={`scroll-stack-scroller ${className}`.trim()}>
      <div className="scroll-stack-inner" ref={innerRef}>
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) cardsRef.current[i] = el;
                }}
                className="scroll-stack-item-wrap"
                style={{ top: `${topStart + i * topGap}px` }}
              >
                <div
                  className="scroll-stack-item-inner"
                  style={{
                    willChange: "transform, opacity, filter",
                    transformOrigin: "top center",
                  }}
                >
                  {child}
                </div>
              </div>
            ))
          : children}
        <div className="scroll-stack-spacer" />
      </div>

      {/* Progress indicator — dots uniquement */}
      <div className="flex items-center justify-center mt-8">
        <div className="scroll-stack-dots">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              className={`scroll-stack-dot ${i === activeIndex ? "active" : ""}`}
              onClick={() => scrollToCard(i)}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollStack;
