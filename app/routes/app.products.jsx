import { useLoaderData } from "@remix-run/react";
import { apiVersion, authenticate } from "../shopify.server";

export const query = `
  query {
    products(first: 10) {
      edges {
        node {
          id
          title
          handle
          description
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop, accessToken } = session;

  try {
    const response = await fetch(
      `https://${shop}/admin/api/${apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query }),
      },
    );

    if (!response.ok) {
      throw new Response(`HTTP error! Status: ${response.status}`, {
        status: response.status,
      });
    }

    const data = await response.json();
    console.log(data, "----data-----");
    const edges = data?.data?.products?.edges || [];
    const products = edges.map((edge) => edge.node);

    return { products };
  } catch (err) {
    console.error(err);
    throw new Response("Failed to load products", { status: 500 });
  }
};

const Products = () => {
  const { products } = useLoaderData();
  console.log("Products:", products);

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <strong>{product.title}</strong> — {product.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Products;
