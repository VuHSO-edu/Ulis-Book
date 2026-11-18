import { getHealth } from '@ulis/apis';

/**
 * API tầng service — page không gọi http trực tiếp (vuhso-frontend-rules §7).
 */
export const fetchHealth = async () => {
  const res = await getHealth();
  return res.data;
};
