import { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ChatProvider>
        <Component {...pageProps} />
      </ChatProvider>
    </AuthProvider>
  );
}

export default MyApp;