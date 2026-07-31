import { auth } from "@zomlab/auth";
import { Elysia } from "elysia";
import { UnauthorizedError } from "../errors";

/**
 * Auth plugin: exposes an `auth: true` macro that resolves the current
 * session from the request cookies and attaches `user` to the context.
 *
 * Routes opt in with `{ auth: true }`; unauthenticated requests fail
 * with a 401 before the handler runs.
 */
export const authPlugin = new Elysia({ name: "auth" })
  .error({
    UnauthorizedError,
  })
  .macro({
    auth: {
      async resolve({ request }) {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
          throw new UnauthorizedError();
        }

        return {
          user: session.user,
        };
      },
    },
  });
