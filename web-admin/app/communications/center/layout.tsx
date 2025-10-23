export default function CommunicationsCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return children directly without header/nav wrapper
  // The page itself handles the full layout
  return <>{children}</>;
}
