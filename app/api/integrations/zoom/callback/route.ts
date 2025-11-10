import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!userId || !code || state !== userId) {
    return NextResponse.redirect(
      new URL("/integrations?error=auth_failed", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  try {
    const redirectUri = process.env.ZOOM_REDIRECT_URI!;

    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Authorization":
          "Basic " +
          Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Zoom token exchange failed:", errText);
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();
     const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;
    await prisma.userIntegration.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "zoom",
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        updatedAt: new Date(),
        expiresAt
      },
      create: {
        userId,
        platform: "zoom",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt
      },
    });

    return NextResponse.redirect(
      new URL(
        "/integrations?success=zoom_connected&setup=zoom",
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  } catch (error) {
    console.error("Error saving Zoom integration:", error);
    return NextResponse.redirect(
      new URL("/integrations?error=save_failed", process.env.NEXT_PUBLIC_APP_URL)
    );
  }
}
