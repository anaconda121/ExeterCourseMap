import nextAuth from 'next-auth';
import azureADProvider from 'next-auth/providers/azure-ad';
import googleProvider from 'next-auth/providers/google';
import emailProvider from 'next-auth/providers/email';
import sequelizeAdapter from '@next-auth/sequelize-adapter';
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL ?? '');

export default nextAuth({
  providers: [
    azureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID ?? '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
    googleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    emailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  theme: {
    colorScheme: 'light',
  },
  callbacks: {
    async jwt({ token }) {
      token.userRole = 'admin';
      return token;
    },
  },
  adapter: sequelizeAdapter(sequelize),
});
