const Footer = () => {
  return (
    <footer className="bg-transparent absolute bottom-4 flex justify-center w-full p-2 sm:p-4 space-x-4 text-white opacity-70 hover:opacity-100">
      <a
        href="https://www.linkedin.com/in/ethan-thornberg/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/linkedin-size-48.svg" alt="LinkedIn" className="h-8 w-8" />
      </a>
      <a
        href="https://github.com/EthanT89"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/github-size-48.svg" alt="GitHub" className="h-8 w-8" />
      </a>
      <a
        href="https://www.instagram.com/ethanthornberg/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="/instagram-size-48.svg" alt="Instagram" className="h-8 w-8" />
      </a>
    </footer>
  );
};

export default Footer;
