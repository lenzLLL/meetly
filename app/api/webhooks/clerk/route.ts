import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log("📩 Clerk Webhook POST received");

    const payload = await request.text();
    const headers = {
      "svix-id": request.headers.get("svix-id") || "",
      "svix-timestamp": request.headers.get("svix-timestamp") || "",
      "svix-signature": request.headers.get("svix-signature") || "",
    };

    // ⚠️ Utilise bien la clé "Signing secret" du webhook Clerk
    const webhookSecret = process.env.CLERK_SECRET_WEBHOOK;

    if (!webhookSecret) {
      console.error("❌ CLERK_WEBHOOK_SECRET manquant dans .env");
      return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
    }

    // ✅ Vérification de la signature avec Svix
    try {
      const wh = new Webhook(webhookSecret);
      wh.verify(payload, headers);
    } catch (err) {
      console.error("❌ Invalid signature:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Parse l’événement JSON
    const event = JSON.parse(payload);
    console.log("✅ Clerk webhook reçu:", event.type);

    if (event.type === "user.created") {
      const { id, email_addresses, first_name, last_name } = event.data;

      const primaryEmail = email_addresses?.find(
        (email: any) => email.id === event.data.primary_email_address_id
      )?.email_address;

      // 🔹 On garde TA logique de création d'utilisateur
      const newUser = await prisma.user.create({
        data: {
          id: id,
          clerkId: id,
          email: primaryEmail || null,
          name: `${first_name} ${last_name}`,
        },
      });

      console.log("✅ User created:", newUser.id, newUser.email);
      return NextResponse.json({ message: "user created successfully" });
    } else if (event.type === "user.updated") {
      // futur traitement
    } else if (event.type === "user.deleted") {
      // futur traitement
    }

    return NextResponse.json({ message: "webhook received" });
  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
