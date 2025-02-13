interface TitleProps {
  theme: "dark" | "light";
}

const Title = ({ theme }: TitleProps) => {
  return (
    <h1
      className={`text-3xl sm:text-4xl font-annie break-words whitespace-normal max-w-[90%] leading-tight mx-auto [text-wrap:balance] ${
        theme === "dark" ? "text-white" : "text-black"
      }`}
    >
      This Story Does Not Exist
    </h1>
  );
};

export default Title;
