// Child/hero avatar: shows the photo when present, otherwise a coloured circle
// with the name initial. Colour is derived from the name for stable variety.
const SCHEMES = [
  "bg-[#ffe0cd] text-primary-dark",
  "bg-[#e0f3ea] text-green",
  "bg-[#ece0fb] text-purple",
  "bg-[#fff9e6] text-[#b8860b]",
  "bg-[#eef2ff] text-[#4f46e5]",
];

function scheme(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SCHEMES[h % SCHEMES.length];
}

export default function Avatar({
  name,
  imageUrl,
  className = "h-10 w-10 text-[17px] rounded-full",
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center font-display font-extrabold ${scheme(name)} ${className}`}
    >
      {initial}
    </div>
  );
}
