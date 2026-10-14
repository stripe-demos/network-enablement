// The authors byline, after the "Add multi-currency account" pill in Figma
// (Sally's Sandbox, node 329:46544): overlapping round avatars with a white
// ring, then a label. Avatars show initials if there's no `image`.

export type Author = {
  handle: string
  initials: string
  image?: string
  fill: string
  ink: string
}

export const AUTHORS: Author[] = [
  { handle: "sallykang", initials: "SK", image: "/authors/sallykang.jpg", fill: "#D9DBFC", ink: "#1C1E54" },
  { handle: "sadhika", initials: "SA", image: "/authors/sadhika.jpg", fill: "#CBF5E5", ink: "#0B4F3F" },
]

function Avatar({ author }: { author: Author }) {
  return (
    <span
      className="-mr-[10px] flex size-[33px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white text-[11px] font-[600] leading-none"
      style={{ backgroundColor: author.fill, color: author.ink }}
    >
      {author.image ? <img src={author.image} alt="" className="size-full object-cover" /> : author.initials}
    </span>
  )
}

export function AuthorPill({ authors = AUTHORS }: { authors?: Author[] }) {
  const handles = authors.map((author) => `@${author.handle}`)
  const label = handles.length > 1 ? `${handles.slice(0, -1).join(", ")} and ${handles.at(-1)}` : handles[0]
  return (
    <div className="inline-flex items-center gap-[7.5px] rounded-full border border-[#E3E8EE] bg-white py-[7.5px] pr-[15px] pl-[7.5px] shadow-[0_1px_2px_rgba(20,34,52,0.04)]">
      <span className="flex items-center pr-[10px]">
        {authors.map((author) => (
          <Avatar key={author.handle} author={author} />
        ))}
      </span>
      <span className="whitespace-nowrap text-[13px] font-[600] leading-[1.48] text-[#273951]">{label}</span>
    </div>
  )
}
