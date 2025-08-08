import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log("----------------Webhook called------------------------");

  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        console.log(`App uninstalled from shop: ${shop}`);
        await db.session.deleteMany({ where: { shop } });
      }
      break;
    default:
      throw new Response("Unhandled webhook topic", { status: 400 });
  }

  return new Response(null, { status: 200 });
};
