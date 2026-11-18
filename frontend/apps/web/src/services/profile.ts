import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@ulis/apis';
import type { BaseResponse } from '@ulis/apis';

/**
 * API hồ sơ người dùng (ticket 03) — GET/PUT /profile/me, JWT bảo vệ.
 * Page không gọi http trực tiếp (vuhso-frontend-rules §7).
 */
export interface Profile {
  id: number;
  email: string;
  fullName: string;
  faculty?: string | null;
  major?: string | null;
  className?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  status: string;
  createdAt?: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  faculty?: string;
  major?: string;
  className?: string;
  phone?: string;
  avatarUrl?: string;
}

export const profileQueryKey = {
  all: ['profile', 'me'] as const,
};

const getProfile = () => http.get<BaseResponse<Profile>>('/profile/me');

const updateProfile = (data: UpdateProfilePayload) =>
  http.put<BaseResponse<Profile>>('/profile/me', data);

export const useGetProfile = () =>
  useQuery({ queryKey: profileQueryKey.all, queryFn: getProfile });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileQueryKey.all }),
  });
};
