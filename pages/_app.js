import { SessionProvider } from 'next-auth/react';

/**
 * Custom App component to provide NextAuth session context to the entire application.
 * This wraps every page (including the Home page) with SessionProvider,
 * which is required for the useSession hook to work correctly.
 */
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
