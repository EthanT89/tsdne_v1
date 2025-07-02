interface FooterProps {
  theme?: "dark" | "light";
}

const Footer = ({ theme = "dark" }: FooterProps) => {
  const isDark = theme === "dark";
  const iconFilter = isDark ? "" : "invert(1)";
  const opacityClasses = isDark ? "opacity-70 hover:opacity-100" : "opacity-60 hover:opacity-90";

  return (
    /**
     * Footer is last in normal flow.
     * If there's not enough vertical space, it gets clipped 
     * by the parent's 'overflow-hidden'.
     */
    <footer
      className={`
        flex
        justify-center
        w-full
        p-2
        sm:p-4
        space-x-4
        transition-opacity
        duration-200
        ${opacityClasses}
      `}
    >
      <a
        href="https://www.linkedin.com/in/ethan-thornberg/"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform hover:scale-110"
      >
        <img 
          src="/linkedin-size-48.svg" 
          alt="LinkedIn" 
          className="h-8 w-8" 
          style={{ filter: iconFilter }}
        />
      </a>
      <a
        href="https://github.com/EthanT89"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform hover:scale-110"
      >
        <img 
          src="/github-size-48.svg" 
          alt="GitHub" 
          className="h-8 w-8" 
          style={{ filter: iconFilter }}
        />
      </a>
      <a
        href="https://www.instagram.com/ethanthornberg/"
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform hover:scale-110"
      >
        <img 
          src="/instagram-size-48.svg" 
          alt="Instagram" 
          className="h-8 w-8" 
          style={{ filter: iconFilter }}
        />
      </a>
    </footer>
  );
};

export default Footer;
