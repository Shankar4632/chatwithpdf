export default function UserMessage({ text }) {
  return (
    <div className="flex justify-end px-5 py-2">
      <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
        {text}
      </p>
    </div>
  );
}
