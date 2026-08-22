export default function Logo({ size = 36, rounded = "rounded-lg" }) {
  return (
    <div
      className={`grid grid-cols-2 grid-rows-2 gap-[2px] ${rounded} overflow-hidden shrink-0`}
      style={{ width: size, height: size }}
    >
      <div className="bg-orange-500" />
      <div className="bg-amber-300" />
      <div className="bg-sky-400" />
      <div className="bg-fuchsia-400" />
    </div>
  );
}
