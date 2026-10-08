import Script from "next/script";

/**
 * Meta Pixel base code — injected when a Pixel ID is configured in the dashboard.
 * Supports advanced matching (email/phone are hashed automatically by the pixel).
 */
export default function MetaPixelScript({
  pixelId,
  enabled,
  advancedMatching,
}: {
  pixelId: string;
  enabled: boolean;
  advancedMatching: boolean;
}) {
  if (!enabled || !pixelId) return null;

  const advanced = advancedMatching ? ", { advancedMatching: {} }" : "";

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}'${advanced});
fbq('track', 'PageView');`}
    </Script>
  );
}
