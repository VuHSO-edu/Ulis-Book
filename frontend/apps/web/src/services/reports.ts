import { useMutation, useQueryClient } from '@tanstack/react-query';
import { httpBlocking } from '@ulis/apis';
import { localDb } from './local-db';
import type { ReportItem, ReportReasonType, ReportSourceType } from './mock-data';
import { adminQueryKey } from './admin';

export interface CreateReportPayload {
  sourceType: ReportSourceType;
  targetId: number;
  targetTitle: string;
  targetSubtitle: string;
  reasonType: ReportReasonType;
  reasonLabel: string;
  description: string;
  reporterName: string;
  reporterEmail: string;
}

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReportPayload): Promise<ReportItem> => {
      try {
        const res = await httpBlocking.post<{ data?: ReportItem }>('/reports/create', payload);
        if (res.data?.data) return res.data.data;
      } catch {
        // Fallback local DB
      }
      const list = localDb.getReports();
      const newId = Math.max(10, ...list.map((r) => r.id)) + 1;
      const newReport: ReportItem = {
        id: newId,
        reportCode: `#RP-${8845 + newId}`,
        sourceType: payload.sourceType,
        targetId: payload.targetId,
        targetTitle: payload.targetTitle,
        targetSubtitle: payload.targetSubtitle,
        targetBadge: payload.sourceType,
        reasonType: payload.reasonType,
        reasonLabel: payload.reasonLabel,
        description: payload.description.trim(),
        severity: payload.reasonType === 'SCAM' ? 'HIGH' : 'MEDIUM',
        reporterName: payload.reporterName,
        reporterEmail: payload.reporterEmail,
        reporterMsv: '22040118',
        createdAt: '19/11/2026',
        createdTime: '16:40:00',
        status: 'PENDING',
      };
      localDb.saveReports([newReport, ...list]);
      return newReport;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKey.reports() });
    },
  });
};
