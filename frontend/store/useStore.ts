import { create } from 'zustand';
import { User, Customer, Site, Equipment, Dispatch, Route, FormTemplate, FormResponse } from '../types';

interface AppState {
  currentUser: User | null;
  customers: Customer[];
  sites: Site[];
  equipment: Equipment[];
  crews: User[];
  dispatches: Dispatch[];
  routes: Route[];
  formTemplates: FormTemplate[];
  formResponses: FormResponse[];
  setCurrentUser: (user: User | null) => void;
  setCustomers: (customers: Customer[]) => void;
  setSites: (sites: Site[]) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setCrews: (crews: User[]) => void;
  setDispatches: (dispatches: Dispatch[]) => void;
  setRoutes: (routes: Route[]) => void;
  setFormTemplates: (formTemplates: FormTemplate[]) => void;
  setFormResponses: (formResponses: FormResponse[]) => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  customers: [],
  sites: [],
  equipment: [],
  crews: [],
  dispatches: [],
  routes: [],
  formTemplates: [],
  formResponses: [],
  setCurrentUser: (user) => set({ currentUser: user }),
  setCustomers: (customers) => set({ customers }),
  setSites: (sites) => set({ sites }),
  setEquipment: (equipment) => set({ equipment }),
  setCrews: (crews) => set({ crews }),
  setDispatches: (dispatches) => set({ dispatches }),
  setRoutes: (routes) => set({ routes }),
  setFormTemplates: (formTemplates) => set({ formTemplates }),
  setFormResponses: (formResponses) => set({ formResponses }),
}));