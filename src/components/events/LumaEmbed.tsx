interface LumaEmbedProps {
  calendarUrl: string; // e.g., "https://lu.ma/baish"
  height?: number;
}

export function LumaEmbed({ calendarUrl, height = 600 }: LumaEmbedProps) {
  // Append ?embed=true to calendar URL for embed mode
  const embedUrl = calendarUrl.includes("?")
    ? `${calendarUrl}&embed=true`
    : `${calendarUrl}?embed=true`;

  return (
    <iframe
      src={embedUrl}
      className="w-full border-0 rounded-lg"
      style={{ height: `${height}px` }}
      allow="payment"
      loading="lazy"
      title="Events Calendar"
    />
  );
}
