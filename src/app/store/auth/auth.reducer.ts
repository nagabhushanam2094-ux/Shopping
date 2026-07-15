import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(AuthActions.loginSuccess, (state, { token }) => ({
    ...state,
    isAuthenticated: true,
    token,
    loading: false,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    isAuthenticated: false,
    token: null,
    loading: false,
    error,
  })),
  on(AuthActions.logout, (state) => ({
    ...state,
    isAuthenticated: false,
    token: null,
    loading: false,
    error: null,
  })),
  on(AuthActions.setAuthenticated, (state, { isAuthenticated, token }) => ({
    ...state,
    isAuthenticated,
    token,
  }))
);
