import { useLoaderData } from "@remix-run/react";
import { apiVersion, authenticate } from "../shopify.server";
import { Card, Layout, List, Page } from "@shopify/polaris";

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
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <List type="bullet" gap="loose">
              {products?.map((product) => (
                <List.Item key={product.id}>
                  <h2>{product.title}</h2>
                  <h2>{product.description}</h2>
                </List.Item>
              ))}
            </List>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Products;
