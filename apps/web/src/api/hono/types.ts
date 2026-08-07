import type { AuthSession, AuthUser } from "@zomlab/auth";

export type AuthVariables = {
  session: AuthSession;
  user: AuthUser;
};

export interface AppVariables extends AuthVariables {}

export interface HonoEnv {
  Variables: AppVariables;
}
