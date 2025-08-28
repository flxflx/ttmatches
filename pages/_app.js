import { SessionProvider } from 'next-auth/react';
import Head from 'next/head';

/**
 * Custom App component to provide NextAuth session context to the entire application.
 * This wraps every page (including the Home page) with SessionProvider,
 * which is required for the useSession hook to work correctly.
 */
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body {
            margin: 0;
            font-family: 'Inter', sans-serif;
            color: #ffffff;
            background: transparent;
          }
        `}</style>
      </Head>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
