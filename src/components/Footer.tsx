const Footer = () => {
  return (
    <footer className="absolute bottom-4 flex justify-between w-full px-6 text-white">
      <a
        href="https://www.linkedin.com/in/ethan-thornberg/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="/linkedin.svg"
          alt="LinkedIn"
          className="h-8 w-8 opacity-75 hover:opacity-100"
        />
      </a>
      <a
        href="https://github.com/EthanT89"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="/github.svg"
          alt="GitHub"
          className="h-8 w-8 opacity-75 hover:opacity-100"
        />
      </a>
      <a
        href="https://www.instagram.com/ethanthornberg/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="/instagram.svg"
          alt="Instagram"
          className="h-8 w-8 opacity-75 hover:opacity-100"
        />
      </a>
    </footer>
  );
};

export default Footer;
