import { Card, Layout, List, Page } from "@shopify/polaris";
import { apiVersion, authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";

export const query = `
{
    collections(first: 10) {
        edges {
            node {
                id
                handle
                title
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
      console.log(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const edges = data?.data?.collections?.edges || [];
    return { collections: edges };
  } catch (err) {
    console.log(err);
  }
};

const TestRoute = () => {
  const { collections } = useLoaderData();
  console.log("Collections:", collections);

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <h1>hello world</h1>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <List type="bullet" gap="loose">
              {collections.map((edge) => {
                const { node: collection } = edge;
                return (
                  <List.Item key={collection.id}>
                    <h2>{collection.title}</h2>
                    <h2>{collection.description}</h2>
                  </List.Item>
                );
              })}
            </List>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default TestRoute;
