import NextAuth from 'next-auth';
import AzureAD from 'next-auth/providers/azure-ad';

export default NextAuth({
  providers: [
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Additional checks can be added here if needed
      return true;
    },
    async session({ session, token }) {
      // Include user info in the session
      session.user = {
        ...session.user,
        email: token.email,
        name: token.name,
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
