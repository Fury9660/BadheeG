import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function will be rendered in the <head> of the page.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Badhee G — Premium Furniture in Sikar | Best Furniture Shop Online | BadheeG</title>
        <meta name="description" content="Badhee G (BadheeG) — Sikar ka sabse bada online furniture store. Buy premium sofa sets, beds, dining tables, almirahs, modular kitchen & home decor. Best furniture in Sikar, Rajasthan. Free delivery across India. Trusted by 500+ showroom partners." />
        <meta name="keywords" content="badhee g, badheeg, badhee, furniture in sikar, sikar furniture, furniture shop in sikar, best furniture sikar, furniture online sikar, rajasthan furniture, sofa set sikar, bed sikar, dining table sikar, almirah sikar, modular kitchen sikar, home decor sikar, luxury furniture india, premium furniture online, wooden furniture, modern furniture, designer furniture, office furniture, bedroom furniture, living room furniture, furniture showroom sikar, buy furniture online, affordable furniture india, custom furniture, handmade furniture rajasthan, furniture delivery india, badhee g furniture, badheeg.com, badhee g sikar, furniture store near me, online furniture shopping, indian furniture, sheesham wood furniture, teak wood furniture, furniture manufacturer sikar, wholesale furniture sikar" />
        
        {/* SEO Essentials */}
        <link rel="canonical" href="https://badheeg.com/" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Badhee G" />
        <meta name="publisher" content="Badhee G" />
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Badhee G" />
        <meta name="application-name" content="Badhee G" />
        
        {/* Geo Targeting */}
        <meta name="geo.region" content="IN-RJ" />
        <meta name="geo.placename" content="Sikar, Rajasthan" />
        <meta name="geo.position" content="27.6094;75.1399" />
        <meta name="ICBM" content="27.6094, 75.1399" />
        
        {/* Language / Locale */}
        <meta httpEquiv="content-language" content="en-IN" />
        <link rel="alternate" hrefLang="en-in" href="https://badheeg.com/" />
        <link rel="alternate" hrefLang="hi" href="https://badheeg.com/" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://badheeg.com/" />
        <meta property="og:site_name" content="Badhee G" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:title" content="Badhee G — Premium Furniture in Sikar | Best Furniture Shop Online" />
        <meta property="og:description" content="Sikar ka sabse bada online furniture store. Buy sofa sets, beds, dining tables & more. Free delivery across India. Trusted by 500+ showroom partners." />
        <meta property="og:image" content="https://badheeg.com/assets/images/favicon.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://badheeg.com/" />
        <meta property="twitter:title" content="Badhee G — Premium Furniture in Sikar | BadheeG" />
        <meta property="twitter:description" content="Buy premium sofa sets, beds, dining tables & luxury home decor from Badhee G. Best furniture shop in Sikar, Rajasthan." />
        <meta property="twitter:image" content="https://badheeg.com/assets/images/favicon.png" />

        {/* JSON-LD: WebSite + SearchAction (for Sitelinks search box) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Badhee G",
            "alternateName": ["BadheeG", "Badhee", "badhee g", "badheeg"],
            "url": "https://badheeg.com/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://badheeg.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }} />

        {/* JSON-LD: Organization */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Badhee G",
            "alternateName": "BadheeG",
            "url": "https://badheeg.com",
            "logo": "https://badheeg.com/assets/images/favicon.png",
            "description": "Premium furniture and home decor store based in Sikar, Rajasthan. Buy sofa sets, beds, dining tables, almirahs and more online.",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Sikar",
              "addressRegion": "Rajasthan",
              "postalCode": "332001",
              "addressCountry": "IN"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+91-9521633688",
              "contactType": "customer service",
              "areaServed": "IN",
              "availableLanguage": ["English", "Hindi"]
            },
            "sameAs": [
              "https://www.instagram.com/badheeg",
              "https://www.facebook.com/badheeg"
            ]
          })
        }} />

        {/* JSON-LD: LocalBusiness (helps Google Maps & local search) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FurnitureStore",
            "name": "Badhee G — Furniture in Sikar",
            "image": "https://badheeg.com/assets/images/favicon.png",
            "url": "https://badheeg.com",
            "telephone": "+91-9521633688",
            "priceRange": "₹₹",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Laxmangarh",
              "addressLocality": "Sikar",
              "addressRegion": "Rajasthan",
              "postalCode": "332311",
              "addressCountry": "IN"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 27.6094,
              "longitude": 75.1399
            },
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
              "opens": "09:00",
              "closes": "21:00"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Furniture Collection",
              "itemListElement": [
                {"@type": "OfferCatalog", "name": "Sofa Sets"},
                {"@type": "OfferCatalog", "name": "Beds & Mattresses"},
                {"@type": "OfferCatalog", "name": "Dining Tables"},
                {"@type": "OfferCatalog", "name": "Almirahs & Wardrobes"},
                {"@type": "OfferCatalog", "name": "Modular Kitchen"},
                {"@type": "OfferCatalog", "name": "Office Furniture"},
                {"@type": "OfferCatalog", "name": "Home Decor"}
              ]
            }
          })
        }} />

        {/* JSON-LD: BreadcrumbList */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://badheeg.com/"},
              {"@type": "ListItem", "position": 2, "name": "Categories", "item": "https://badheeg.com/categories"},
              {"@type": "ListItem", "position": 3, "name": "Stores", "item": "https://badheeg.com/stores"},
              {"@type": "ListItem", "position": 4, "name": "Partner Login", "item": "https://badheeg.com/partners/login"},
              {"@type": "ListItem", "position": 5, "name": "Help & Support", "item": "https://badheeg.com/help"}
            ]
          })
        }} />

        {/* JSON-LD: SiteNavigationElement */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": [
              {"@type": "SiteNavigationElement", "position": 1, "name": "Categories", "url": "https://badheeg.com/categories"},
              {"@type": "SiteNavigationElement", "position": 2, "name": "Showroom Stores", "url": "https://badheeg.com/stores"},
              {"@type": "SiteNavigationElement", "position": 3, "name": "Partner Dashboard", "url": "https://badheeg.com/partners/login"},
              {"@type": "SiteNavigationElement", "position": 4, "name": "Help & Support", "url": "https://badheeg.com/help"}
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
