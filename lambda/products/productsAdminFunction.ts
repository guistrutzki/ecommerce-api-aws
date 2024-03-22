import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { Product, ProductRepository } from '/opt/nodejs/productsLayer';

const productsDdb = process.env.PRODUCTS_DDB ?? '';
const ddbClient = new DynamoDB.DocumentClient();

const productRepository = new ProductRepository(ddbClient, productsDdb);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const lambdaRequestId = context.awsRequestId;
  const apiRequestId = event.requestContext.requestId;

  console.log(
    `API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`
  );

  if (event.resource === '/products') {
    console.log('POST /products');
    const product = JSON.parse(event.body ?? '') as Product;
    const createdProduct = await productRepository.create(product);

    return {
      statusCode: 201,
      body: JSON.stringify(createdProduct),
    };
  } else if (event.resource === '/products/{id}') {
    const productId = event.pathParameters?.id ?? '';
    const product = JSON.parse(event.body ?? '') as Product;

    if (event.httpMethod === 'PUT') {
      console.log(`PUT /products/${productId}`);
      try {
        const productUpdated = await productRepository.updateProduct(
          productId,
          product
        );

        return {
          statusCode: 200,
          body: JSON.stringify(productUpdated),
        };
      } catch (err) {
        console.error((<Error>err).message);
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: 'Product not found',
          }),
        };
      }
    }

    if (event.httpMethod === 'DELETE') {
      console.log(`DELETE /products/${productId}`);
      try {
        await productRepository.deleteProduct(productId);
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: `DELETE /products/${productId}`,
          }),
        };
      } catch (err) {
        console.error((<Error>err).message);
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: (<Error>err).message,
          }),
        };
      }
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Bad request',
    }),
  };
}
