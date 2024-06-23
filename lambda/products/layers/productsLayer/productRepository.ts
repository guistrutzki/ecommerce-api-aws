import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuidv4 } from 'uuid';

export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
}

export class ProductRepository {
  private ddbClient: DocumentClient;
  private productsDdb: string;

  constructor(ddbClient: DocumentClient, productsDdb: string) {
    this.ddbClient = ddbClient;
    this.productsDdb = productsDdb;
  }

  async getAllProducts(): Promise<Product[]> {
    const params: DocumentClient.ScanInput = {
      TableName: this.productsDdb,
    };
    const data = await this.ddbClient.scan(params).promise();

    return data.Items as Product[];
  }

  async getProductById(productId: string): Promise<Product | null> {
    const params: DocumentClient.GetItemInput = {
      TableName: this.productsDdb,
      Key: {
        id: productId,
      },
    };
    const data = await this.ddbClient.get(params).promise();

    if (!data.Item) {
      throw new Error('Product not found');
    }

    return data.Item as Product;
  }

  async create(product: Product): Promise<Product> {
    const newProduct = {
      ...product,
      id: uuidv4(),
    };
    const params: DocumentClient.PutItemInput = {
      TableName: this.productsDdb,
      Item: newProduct,
    };

    await this.ddbClient.put(params).promise();

    return newProduct;
  }

  async deleteProduct(productId: string): Promise<void> {
    const params: DocumentClient.DeleteItemInput = {
      TableName: this.productsDdb,
      Key: {
        id: productId,
      },
      ReturnValues: 'ALL_OLD',
    };

    const data = await this.ddbClient.delete(params).promise();

    if (data.Attributes === undefined) {
      throw new Error('Product not found');
    }
  }

  async updateProduct(productId: string, product: Product): Promise<Product> {
    const params: DocumentClient.UpdateItemInput = {
      TableName: this.productsDdb,
      Key: {
        id: productId,
      },
      ConditionExpression: 'attribute_exists(id)',
      UpdateExpression:
        'set productName = :productName, code = :code, price = :price, model = :model',
      ExpressionAttributeValues: {
        ':productName': product.productName,
        ':code': product.code,
        ':price': product.price,
        ':model': product.model,
      },
      ReturnValues: 'UPDATED_NEW',
    };

    const data = await this.ddbClient.update(params).promise();

    return data.Attributes as Product;
  }
}
