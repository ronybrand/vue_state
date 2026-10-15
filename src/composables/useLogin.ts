import { useMutation } from '@tanstack/vue-query';
import { authService, type LoginCredentials } from '../services/authService';

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
  });
}
