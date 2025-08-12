import { useLoaderData, useParams } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { json } from "stream/consumers";

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const { id, inventoryItemId } = params;

  if (!id || !inventoryItemId) {
    return json({ error: "Missing id or inventory_item_id" }, { status: 400 });
  }

  const response = await admin.graphql(
    `#graphql
    query($id: ID!) {
      inventoryLevel(id: $id) {
        id
        quantities(names: ["available", "incoming", "committed", "damaged", "on_hand", "quality_control", "reserved", "safety_stock"]) {
          name
          quantity
        }
        item {
          id
          sku
        }
        location {
          id
          name
        }
      }
    }`,
    {
      variables: {
        id: `gid://shopify/InventoryLevel/${id}?inventory_item_id=${inventoryItemId}`,
      },
    },
  );

  const data = await response.json();
  if (!data.data.inventoryLevel) {
    return json({ error: "Inventory level not found" }, { status: 404 });
  }

  return json({ inventoryData: data.data });
};

export default function InventoryDisplay() {
  const { inventoryData, error } = useLoaderData();
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }
  if (!inventoryData?.inventoryLevel) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading inventory data...
      </div>
    );
  }

  const { inventoryLevel } = inventoryData;
  const { quantities, item, location } = inventoryLevel;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Inventory Details
      </h2>

      {/* Item Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700">
          Item Information
        </h3>
        <p className="text-gray-600">ID: {item.id}</p>
        <p className="text-gray-600">SKU: {item.sku}</p>
      </div>

      {/* Location Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Location</h3>
        <p className="text-gray-600">ID: {location.id}</p>
        <p className="text-gray-600">Name: {location.name}</p>
      </div>

      {/* Inventory Quantities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700">
          Inventory Quantities
        </h3>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {quantities.map((qty) => (
            <div key={qty.name} className="p-3 bg-gray-100 rounded-md">
              <span className="font-medium text-gray-700 capitalize">
                {qty.name.replace("_", " ")}:
              </span>
              <span className="ml-2 text-gray-600">{qty.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
