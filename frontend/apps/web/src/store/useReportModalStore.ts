import { create } from 'zustand';
import type { ReportSourceType } from '../services/mock-data';

export interface ReportModalTarget {
  sourceType: ReportSourceType;
  targetId: number;
  targetTitle: string;
  targetSubtitle: string;
  targetCode?: string;
}

interface ReportModalState {
  open: boolean;
  target: ReportModalTarget | null;
  openReportModal: (target: ReportModalTarget) => void;
  closeReportModal: () => void;
}

export const useReportModalStore = create<ReportModalState>((set) => ({
  open: false,
  target: null,
  openReportModal: (target) => set({ open: true, target }),
  closeReportModal: () => set({ open: false, target: null }),
}));
