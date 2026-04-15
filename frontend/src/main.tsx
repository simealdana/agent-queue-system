import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { WorkflowListPage } from './pages/WorkflowListPage';
import { WorkflowDetailPage } from './pages/WorkflowDetailPage';
import { WorkflowNewPage } from './pages/WorkflowNewPage';
import { WorkflowEditPage } from './pages/WorkflowEditPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<WorkflowListPage />} />
            <Route path="workflows/new" element={<WorkflowNewPage />} />
            <Route path="workflows/:id" element={<WorkflowDetailPage />} />
            <Route path="workflows/:id/edit" element={<WorkflowEditPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
