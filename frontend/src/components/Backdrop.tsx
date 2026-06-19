// Decorative blurred-blob backdrop ported from the prototype.
// Purely visual; sits behind page content (z-0, non-interactive).
export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-24 -right-16 h-[340px] w-[340px] rounded-full bg-[#ffe4d4] opacity-55 blur-lg" />
      <div className="absolute top-60 -left-28 h-[300px] w-[300px] rounded-full bg-[#e7defb] opacity-50 blur-lg" />
      <div className="absolute -bottom-28 right-[18%] h-[360px] w-[360px] rounded-full bg-[#dff3ea] opacity-50 blur-lg" />
      <div className="animate-floaty absolute top-36 left-[12%] text-[22px] text-[#e8a36a]">✦</div>
      <div className="animate-floaty absolute top-20 right-[30%] text-[14px] text-[#b89adf]">✦</div>
      <div className="animate-floaty-slow absolute top-[340px] right-[8%] text-[18px] text-[#79c4a0]">✦</div>
    </div>
  );
}
