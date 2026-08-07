#!/usr/bin/env tsx

/**
 * Better Auth Worker verification script.
 * Tests the complete auth flow against a deployed worker probe.
 */
interface CookieJar {
  cookies: Map<string, string>;
  setCookie(header: string): void;
  getCookieHeader(): string;
}

function createCookieJar(): CookieJar {
  const cookies = new Map<string, string>();
  return {
    cookies,
    setCookie(header: string) {
      // Parse Set-Cookie headers
      const parts = header.split(",");
      for (const part of parts) {
        const [cookie] = part.split(";");
        const [name, value] = cookie.split("=");
        if (name && value) {
          cookies.set(name.trim(), value.trim());
        }
      }
    },
    getCookieHeader() {
      return Array.from(this.cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    },
  };
}

async function verifyAuthWorker(baseUrl: string, token: string): Promise<void> {
  // Jar 1: for authenticated requests
  const authJar = createCookieJar();
  // Jar 2: for unauthenticated requests (proving isolation)
  const unauthJar = createCookieJar();

  const headers = (jar: CookieJar) => ({
    Authorization: `Bearer ${token}`,
    Cookie: jar.getCookieHeader(),
    "Content-Type": "application/json",
  });

  const updateJar = (jar: CookieJar, response: Response) => {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      jar.setCookie(setCookie);
    }
  };

  const testEmail = `test-${Date.now()}@migration.test`;
  const legacyEmail = `legacy-${Date.now()}@migration.test`;

  try {
    // 1. Sign up a unique @migration.test user
    console.log("1. Signing up new user...");
    const signupRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: headers(authJar),
      body: JSON.stringify({
        email: testEmail,
        password: "TestPass123!",
        name: "Test User",
      }),
    });
    if (!signupRes.ok) {
      throw new Error(`Sign up failed: ${signupRes.status} ${await signupRes.text()}`);
    }
    updateJar(authJar, signupRes);
    console.log("   Sign up successful");

    // 2. Fetch /api/auth/get-session and assert the same email
    console.log("2. Getting session...");
    const sessionRes = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: headers(authJar),
    });
    if (!sessionRes.ok) {
      throw new Error(`Get session failed: ${sessionRes.status}`);
    }
    const session = await sessionRes.json();
    if (session.user?.email !== testEmail) {
      throw new Error(`Session email mismatch: ${session.user?.email} !== ${testEmail}`);
    }
    console.log("   Session valid");

    // 3. Use separate empty cookie jar to reject wrong password and prove no session
    console.log("3. Testing wrong password with separate jar...");
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: headers(unauthJar),
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPass123!",
      }),
    });
    if (wrongPassRes.ok) {
      throw new Error("Wrong password should have been rejected");
    }
    updateJar(unauthJar, wrongPassRes);
    if (unauthJar.getCookieHeader()) {
      throw new Error("Unauthenticated jar should not have session cookie");
    }
    console.log("   Wrong password correctly rejected, no session cookie set");

    // Preserve authenticated jar
    console.log("   Authenticated jar preserved");

    // 4. Change the signed-in user's password and sign out
    console.log("4. Changing password...");
    const changePassRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: "POST",
      headers: headers(authJar),
      body: JSON.stringify({
        currentPassword: "TestPass123!",
        newPassword: "NewPass456!",
      }),
    });
    if (!changePassRes.ok) {
      throw new Error(`Change password failed: ${changePassRes.status}`);
    }
    updateJar(authJar, changePassRes);
    console.log("   Password changed");

    console.log("5. Signing out...");
    const signOutRes = await fetch(`${baseUrl}/api/auth/sign-out`, {
      method: "POST",
      headers: headers(authJar),
    });
    if (!signOutRes.ok) {
      throw new Error(`Sign out failed: ${signOutRes.status}`);
    }
    updateJar(authJar, signOutRes);
    console.log("   Signed out");

    // 5. Reject old password and accept new password
    console.log("6. Testing old password rejection...");
    const oldPassRes = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: headers(authJar),
      body: JSON.stringify({
        email: testEmail,
        password: "TestPass123!",
      }),
    });
    if (oldPassRes.ok) {
      throw new Error("Old password should be rejected");
    }
    console.log("   Old password correctly rejected");

    console.log("7. Testing new password acceptance...");
    const newPassRes = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: headers(authJar),
      body: JSON.stringify({
        email: testEmail,
        password: "NewPass456!",
      }),
    });
    if (!newPassRes.ok) {
      throw new Error(`New password sign in failed: ${newPassRes.status}`);
    }
    updateJar(authJar, newPassRes);
    console.log("   New password accepted");

    // 6. Seed the fixed legacy-hash user through the protected probe route
    console.log("8. Seeding legacy user...");
    const seedRes = await fetch(`${baseUrl}/__probe/seed-legacy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: legacyEmail }),
    });
    if (!seedRes.ok) {
      throw new Error(`Seed legacy failed: ${seedRes.status}`);
    }
    console.log("   Legacy user seeded");

    // 7. Sign in that existing user through Better Auth and assert valid session
    console.log("9. Signing in legacy user...");
    const legacySignInRes = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: headers(authJar),
      body: JSON.stringify({
        email: legacyEmail,
        password: "ZomLab-Argon2-Compatibility-1!",
      }),
    });
    if (!legacySignInRes.ok) {
      throw new Error(`Legacy sign in failed: ${legacySignInRes.status}`);
    }
    updateJar(authJar, legacySignInRes);

    const legacySessionRes = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: headers(authJar),
    });
    const legacySession = await legacySessionRes.json();
    if (legacySession.user?.email !== legacyEmail) {
      throw new Error(`Legacy session email mismatch`);
    }
    console.log("   Legacy user sign in successful");
  } finally {
    // 8. Clean up both test users
    console.log("10. Cleaning up test users...");
    for (const email of [testEmail, legacyEmail]) {
      try {
        await fetch(`${baseUrl}/__probe/users/${email}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore cleanup errors
      }
    }
    console.log("   Cleanup complete");
  }

  console.log("PASS auth");
}

// Main entry
const baseUrl = process.argv[2];
const token = process.env.PROBE_TOKEN;

if (!baseUrl || !token) {
  console.error("Usage: PROBE_TOKEN=<token> tsx verify-auth-worker.ts <base-url>");
  process.exit(1);
}

await verifyAuthWorker(baseUrl, token);

export {};
