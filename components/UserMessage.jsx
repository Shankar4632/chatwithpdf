import Logo from "./Logo";

export default function UserMessage({ text }) {
  return (
    <div className="flex items-start gap-3 px-6 py-3">
      <Logo size={30} />
      <p className="pt-1 text-[15px] leading-relaxed text-gray-800">{text}</p>
    </div>
  );
}
