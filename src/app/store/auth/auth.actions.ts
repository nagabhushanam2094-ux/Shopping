import { createAction, props } from '@ngrx/store';

export const login = createAction(
  '[Auth] Login',
  props<{ username: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ token: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction(
  '[Auth] Logout'
);

export const checkAuth = createAction(
  '[Auth] Check Auth'
);

export const setAuthenticated = createAction(
  '[Auth] Set Authenticated',
  props<{ isAuthenticated: boolean; token: string | null }>()
);
