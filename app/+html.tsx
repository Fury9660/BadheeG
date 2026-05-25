import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function will be rendered in the <head> of the page.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Badhee G | Premium Furniture & Interior Solutions</title>
        <meta name="description" content="Discover premium furniture, luxury home decor, and interior solutions at Badhee G. Shop the best collection for your home and showroom partners." />
        <meta name="keywords" content="furniture, home decor, luxury furniture, Badhee G, interior design, showroom partners" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://badheeg.com/" />
        <meta property="og:title" content="Badhee G | Premium Furniture & Interior Solutions" />
        <meta property="og:description" content="Discover premium furniture and luxury home decor. Shop the best collection for your home." />
        <meta property="og:image" content="https://badheeg.com/assets/images/favicon.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://badheeg.com/" />
        <meta property="twitter:title" content="Badhee G | Premium Furniture & Interior Solutions" />
        <meta property="twitter:description" content="Discover premium furniture and luxury home decor." />
        <meta property="twitter:image" content="https://badheeg.com/assets/images/favicon.png" />

        {/* JSON-LD Structured Data for Sitelinks */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Badhee G",
            "url": "https://badheeg.com/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://badheeg.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }} />

        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "SiteNavigationElement",
                "position": 1,
                "name": "Categories",
                "url": "https://badheeg.com/categories"
              },
              {
                "@type": "SiteNavigationElement",
                "position": 2,
                "name": "Showroom Stores",
                "url": "https://badheeg.com/stores"
              },
              {
                "@type": "SiteNavigationElement",
                "position": 3,
                "name": "Partner Dashboard",
                "url": "https://badheeg.com/partners/login"
              },
              {
                "@type": "SiteNavigationElement",
                "position": 4,
                "name": "Help & Support",
                "url": "https://badheeg.com/help"
              }
            ]
          })
        }} />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no"
        />
        <link rel="icon" href="/favicon.png" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* 
            Inject @font-face rules manually to ensure icons load reliably 
            from a public CDN, serving as a fallback/primary source for Web.
        */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @font-face {
            font-family: 'Feather';
            src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/Feather.ttf') format('truetype');
          }
          @font-face {
            font-family: 'FontAwesome';
            src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/FontAwesome.ttf') format('truetype');
          }
          @font-face {
            font-family: 'MaterialCommunityIcons';
            src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/MaterialCommunityIcons.ttf') format('truetype');
          }
          @font-face {
            font-family: 'Ionicons';
            src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/Ionicons.ttf') format('truetype');
          }
          @font-face {
            font-family: 'Material Icons';
            src: url('https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.3/Fonts/MaterialIcons.ttf') format('truetype');
          }
        `}} />
        <style dangerouslySetInnerHTML={{
          __html: `
                        html, body {
                            touch-action: pan-x pan-y;
                            -webkit-text-size-adjust: 100%;
                            overflow: hidden; /* Prevent bounce */
                            height: 100%;
                        }
                    `
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `
                        // Prevent pinch to zoom
                        document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
                        document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
                        document.addEventListener('gestureend', function(e) { e.preventDefault(); });
                        
                        // Prevent double-tap zoom
                        let lastTouchEnd = 0;
                        document.addEventListener('touchend', function(event) {
                            const now = (new Date()).getTime();
                            if (now - lastTouchEnd <= 300) {
                                event.preventDefault();
                            }
                            lastTouchEnd = now;
                        }, { passive: false });

                        // Prevent keyboard zoom (Ctrl/Cmd + +/-/0)
                        window.addEventListener('keydown', function(e) {
                            if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
                                e.preventDefault();
                            }
                        });

                        // Prevent wheel zoom (Ctrl/Cmd + scroll)
                        window.addEventListener('wheel', function(e) {
                            if (e.ctrlKey || e.metaKey) {
                                e.preventDefault();
                            }
                        }, { passive: false });
                    `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
