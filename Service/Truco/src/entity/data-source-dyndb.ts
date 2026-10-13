/*
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import { AppConfig } from '@app/app-config';

const dynclient = new DynamoDBClient({
  region: AppConfig.awsConfig?.region,
  credentials: {
    accessKeyId: AppConfig.awsConfig?.accessKeyId!,
    secretAccessKey: AppConfig.awsConfig?.secretAccessKey!,
  },
  endpoint: AppConfig.awsConfig?.endpoint!,
});

export const dyndoclient = DynamoDBDocumentClient.from(dynclient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
});
*/