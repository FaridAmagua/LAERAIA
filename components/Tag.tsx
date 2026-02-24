export default function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-100">{children}</span>
}
