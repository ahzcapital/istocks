import './globals.css';
import './matrix-theme.css';
import './north-africa-hub-brand.css';
import './people/people.css';
import type {Metadata} from 'next';
import Script from 'next/script';
import NorthAfricaShell from '@/components/navigation/north-africa-shell';

export const metadata: Metadata = {
  title: 'North Africa Hub',
  description: 'North Africa Hub is a North Africa information and intelligence platform covering markets, history, economy, travel, culture, geography, people, and data.',
  openGraph: {title:'North Africa Hub',description:'North Africa Hub is a North Africa information and intelligence platform covering markets, history, economy, travel, culture, geography, people, and data.',siteName:'North Africa Hub',type:'website'},
  twitter: {card:'summary_large_image',title:'North Africa Hub',description:'North Africa Hub is a North Africa information and intelligence platform covering markets, history, economy, travel, culture, geography, people, and data.'},
  applicationName:'North Africa Hub',
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><NorthAfricaShell>{children}</NorthAfricaShell><Script id="google-adsense" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2107729320853151" strategy="beforeInteractive" async crossOrigin="anonymous"/></body></html>}
