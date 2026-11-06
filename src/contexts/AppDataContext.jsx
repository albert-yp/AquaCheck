
import { createContext, useEffect, useState } from 'react';
import { createAppService } from '../services/appService.js';
import { preparePresentationDemo } from '../data/presentationDemo.js';

// eslint-disable-next-line react-refresh/only-export-components -- Context dan provider berbagi modul ini.
export const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [service] = useState(() => createAppService());

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      try {
        if (import.meta.env.VITE_PRESENTATION_DEMO !== 'false') {
          await preparePresentationDemo();
        }
        const savedData = await service.getData();

        if (isActive) {
          setData(savedData);
          setError(null);
        }
      } catch (cause) {
        if (isActive) {
          setError(cause.message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isActive = false;
    };
  }, [service]);

  async function runMutation(operation) {
    try {
      const { data: nextData, result } = await operation();
      setData(nextData);
      setError(null);
      return result;
    } catch (cause) {
      setError(cause.message);
      throw cause;
    }
  }

  const actions = {
    saveTank: (input) => runMutation(() => service.saveTank(input)),
    setTankActive: (tankId, isActive) => runMutation(() => service.setTankActive(tankId, isActive)),
    deleteTank: (tankId) => runMutation(() => service.deleteTank(tankId)),
    createAssignment: (input) => runMutation(() => service.createAssignment(input)),
    saveReportDraft: (assignmentId, input) => runMutation(() => service.saveReportDraft(assignmentId, input)),
    clearReportDraft: (assignmentId) => runMutation(() => service.clearReportDraft(assignmentId)),
    submitReport: (assignmentId, input) => runMutation(() => service.submitReport(assignmentId, input)),
    returnForRevision: (assignmentId, input) => runMutation(() => service.returnForRevision(assignmentId, input)),
    approveInspection: (assignmentId, input) => runMutation(() => service.approveInspection(assignmentId, input)),
  };

  return (
    <AppDataContext.Provider
      value={{
        data,
        actions,
        isLoading,
        error,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}
