import { KanbanProvider } from './context/KanbanContext';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <KanbanProvider>
      <Dashboard />
      <Toaster position="top-center" reverseOrder={false} />
    </KanbanProvider>
  );
}

export default App;
