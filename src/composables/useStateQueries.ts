import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { stateService } from '../services/stateService';

// Every state mutation invalidates the whole ['states'] key, so the list and
// any open detail query refetch.
function useInvalidatingMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    // Vue Query passes extra context as a 2nd argument; the services take one.
    mutationFn: (variables: TVariables) => mutationFn(variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['states'] }),
  });
}

// Arguments are refs/getters so the query re-keys itself when the search box
// or the sort order changes.
export function useStates(
  search?: MaybeRefOrGetter<string | undefined>,
  sort?: MaybeRefOrGetter<string | undefined>,
) {
  return useQuery({
    queryKey: ['states', computed(() => toValue(search)), computed(() => toValue(sort))],
    queryFn: () => stateService.list(toValue(search), toValue(sort)),
    // Keep the table on screen while a new search/sort loads, instead of
    // swapping it for the spinner on every keystroke.
    placeholderData: keepPreviousData,
  });
}

export function useStateById(
  id: MaybeRefOrGetter<number>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  return useQuery({
    queryKey: ['states', computed(() => toValue(id))],
    queryFn: () => stateService.get(toValue(id)),
    enabled: computed(() => toValue(enabled)),
  });
}

export const useCreateState = () => useInvalidatingMutation(stateService.create);
export const useUpdateState = () => useInvalidatingMutation(stateService.update);
export const useDeleteState = () => useInvalidatingMutation(stateService.delete);
