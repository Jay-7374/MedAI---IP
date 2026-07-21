import { useEffect } from 'react';

const useScrollReveal = () => {
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // If they prefer reduced motion, just show everything immediately
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        el.classList.add('revealed');
      });
      return;
    }

    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add revealed class when element comes into view
          entry.target.classList.add('revealed');
          // Unobserve after revealing to only animate once
          observer.unobserve(entry.target);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px', // Trigger slightly before it hits the bottom
      threshold: 0.1, // Trigger when 10% visible
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const revealElements = document.querySelectorAll('.scroll-reveal');

    // Add staggered delays based on DOM position if they have the stagger-group class
    const staggerGroups = document.querySelectorAll('.stagger-group');
    staggerGroups.forEach(group => {
      const children = group.querySelectorAll('.scroll-reveal');
      children.forEach((child, index) => {
        child.style.transitionDelay = `${index * 80}ms`;
      });
    });

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []); // Run once on mount

  // Return a helper function to manually trigger a re-check if DOM changes dynamically
  return () => {
    window.dispatchEvent(new Event('scroll'));
  };
};

export default useScrollReveal;
