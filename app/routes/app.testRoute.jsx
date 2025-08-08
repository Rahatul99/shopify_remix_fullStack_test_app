import { Card, Layout, Page } from "@shopify/polaris";

export const loader = async ({ request }) => {
  return null;
};
const testRoute = () => {
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <h1>Hello world</h1>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};
export default testRoute;
