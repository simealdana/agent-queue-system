import { useSocket } from './hooks/useSocket';
import { Layout } from './components/Layout';
import { WorkflowList } from './components/WorkflowList';

export default function App() {
  useSocket();

  return (
    <Layout>
      <WorkflowList />
    </Layout>
  );
}
