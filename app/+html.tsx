import React from 'react';

// This file is web-only and used to configure the root HTML document.
// It is a static file, so you can't use React state or effects here.
export default function HTML({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

                {/* Preconnect & Google Fonts */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />

                {/* Google Analytics (gtag.js) */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-EKR0W1C1P8" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', 'G-EKR0W1C1P8');
                        `,
                    }}
                />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
