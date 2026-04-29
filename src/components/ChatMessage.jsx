export function ChatMessage({ role, children }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-md bg-neon-500/15 px-4 py-2.5 text-sm leading-relaxed text-neon-100 ring-1 ring-neon-500/30">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-3xl rounded-bl-md bg-white/[0.04] px-4 py-2.5 text-sm leading-relaxed text-neutral-100 ring-1 ring-white/10">
        {children}
      </div>
    </div>
  );
}
