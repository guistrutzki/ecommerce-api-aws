#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { ProductsAppStack } from '../lib/productsApp-stack';
import { ECommerceApiStack } from '../lib/ecommerceApi-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: '024553639249',
  region: 'us-east-1',
};

const tags = {
  cost: 'ECommerce',
  team: 'Aguitech',
};

const productsAppStack = new ProductsAppStack(app, 'ProductsApp', {
  env,
  tags,
});

const eCommerceApiStack = new ECommerceApiStack(app, 'ECommerceApi', {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  env,
  tags,
});

eCommerceApiStack.addDependency(productsAppStack);
