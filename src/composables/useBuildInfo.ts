import { useQuery } from '@tanstack/vue-query';
import { infoService } from '../services/infoService';

// Footer data is informational, not critical: if either lookup fails (no
// version.json in local dev, backend down) the query just stays errored and
// the footer section hides, without an alert.
export function useFrontendVersion() {
  return useQuery({
    queryKey: ['frontendVersion'],
    queryFn: infoService.getFrontendVersion,
    retry: false,
  });
}

export function useBackendInfo() {
  return useQuery({
    queryKey: ['backendInfo'],
    queryFn: infoService.getBackendInfo,
    retry: false,
  });
}
