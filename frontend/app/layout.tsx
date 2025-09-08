import './globals.css';
import { Providers } from '../components/Providers';
import { Header } from '../components/Header';

export const metadata = {
  title: 'BitLease Protocol',
  description: 'Decentralized Bitcoin-backed GPU leasing on Core DAO Testnet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Block Reown font loading
              if (typeof window !== 'undefined') {
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                  if (args[0] && args[0].includes && args[0].includes('fonts.reown.com')) {
                    return Promise.reject(new Error('Blocked Reown font'));
                  }
                  return originalFetch.apply(this, args);
                };
                
                // Block font preloading
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                      if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.reown.com')) {
                        node.remove();
                      }
                    });
                  });
                });
                
                if (document.head) {
                  observer.observe(document.head, { childList: true });
                }
                
                document.addEventListener('DOMContentLoaded', function() {
                  const links = document.querySelectorAll('link[href*="fonts.reown.com"]');
                  links.forEach(link => link.remove());
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-900 text-gray-100">
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
