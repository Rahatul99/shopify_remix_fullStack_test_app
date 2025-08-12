import { authenticate } from "../shopify.server";
import { Button, Card, Form, Page, TextField, Text } from "@shopify/polaris";
import { useActionData, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const discountTitle = formData.get("discountTitle");

    if (!discountTitle) {
      return json({ error: "Discount title is required" }, { status: 400 });
    }

    const discountCode = "150FORYOU";
    const startsAt = new Date("2025-01-01T00:00:00Z").toISOString();
    const endsAt = new Date("2025-12-31T23:59:59Z").toISOString();

    const response = await admin.graphql(
      `#graphql
      mutation CreateDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                startsAt
                endsAt
                customerSelection {
                  ... on DiscountCustomers {
                    customers {
                      id
                    }
                  }
                }
                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          basicCodeDiscount: {
            title: discountTitle,
            code: discountCode,
            startsAt,
            endsAt,
            customerSelection: {
              customers: {
                add: ["gid://shopify/Customer/8368828186763"],
              },
            },
            customerGets: {
              value: {
                percentage: 0.1,
              },
              items: {
                all: true,
              },
            },
            minimumRequirement: {
              subtotal: {
                greaterThanOrEqualToSubtotal: "50.0",
              },
            },
            usageLimit: 100,
            appliesOncePerCustomer: true,
          },
        },
      },
    );

    const responseData = await response.json();
    if (responseData.data.discountCodeBasicCreate.userErrors.length > 0) {
      return json(
        {
          error:
            responseData.data.discountCodeBasicCreate.userErrors[0].message,
        },
        { status: 400 },
      );
    }
    return json({
      discount: responseData.data.discountCodeBasicCreate.codeDiscountNode,
    });
  } catch (error) {
    console.error("Error creating discount:", error);
    return json({ error: "Something went wrong" }, { status: 500 });
  }
};

const Discounts = () => {
  const [discountTitle, setDiscountTitle] = useState("");
  const submit = useSubmit();
  const actionData = useActionData();

  const generateDiscount = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("discountTitle", discountTitle);
    submit(formData, { replace: true, method: "POST" });
  };

  return (
    <Page title="Create Discount">
      <Card sectioned>
        <Form onSubmit={generateDiscount}>
          <TextField
            id="discountTitle"
            name="discountTitle"
            label="Discount Title"
            autoComplete="off"
            value={discountTitle}
            onChange={setDiscountTitle}
            error={actionData?.error}
          />
          <Button submit variant="primary" style={{ marginTop: "1rem" }}>
            Create Discount
          </Button>
          {actionData?.discount && (
            <Text as="p" tone="success" style={{ marginTop: "1rem" }}>
              Discount created successfully:{" "}
              {actionData.discount.codeDiscount.title}
            </Text>
          )}
        </Form>
      </Card>
    </Page>
  );
};

export default Discounts;
