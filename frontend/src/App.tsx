import type { ReactElement } from 'react';
import { Outlet } from 'react-router';
import { useSocket } from './hooks/useSocket';
import { Layout } from './components/Layout';

const App = (): ReactElement => {
  useSocket();

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default App;
