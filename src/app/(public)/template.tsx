/** Soft fade-in on every public page navigation (opacity only, so sticky/fixed elements are unaffected). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in [animation-duration:0.35s]">{children}</div>;
}
