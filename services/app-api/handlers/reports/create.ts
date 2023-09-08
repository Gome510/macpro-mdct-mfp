import KSUID from "ksuid";
import handler from "../handler-lib";
// utils
import dynamoDb from "../../utils/dynamo/dynamodb-lib";
import { hasReportPathParams } from "../../utils/dynamo/hasReportPathParams";
import s3Lib, { getFieldDataKey } from "../../utils/s3/s3-lib";
import { hasPermissions } from "../../utils/auth/authorization";
import {
  error,
  reportTables,
  reportBuckets,
} from "../../utils/constants/constants";
// types
import {
  DynamoWrite,
  isReportType,
  isState,
  S3Put,
  StatusCodes,
  UserRoles,
} from "../../utils/types";
import { getOrCreateFormTemplate } from "../../utils/formTemplates/formTemplates";
import { logger } from "../../utils/logging";
import { copyFieldDataFromSource } from "../../utils/reports/reports";

export const createReport = handler(async (event, _context) => {
  if (!hasPermissions(event, [UserRoles.STATE_USER, UserRoles.STATE_REP])) {
    return {
      status: StatusCodes.UNAUTHORIZED,
      body: error.UNAUTHORIZED,
    };
  }

  const requiredParams = ["reportType", "state"];

  // Return error if no state is passed.
  if (
    !event.pathParameters ||
    !hasReportPathParams(event.pathParameters, requiredParams)
  ) {
    return {
      status: StatusCodes.BAD_REQUEST,
      body: error.NO_KEY,
    };
  }

  const { state, reportType } = event.pathParameters;
  if (!isState(state)) {
    return {
      status: StatusCodes.BAD_REQUEST,
      body: error.NO_KEY,
    };
  }
  const unvalidatedPayload = JSON.parse(event.body!);
  const {
    metadata: unvalidatedMetadata,
    fieldData: unvalidatedFieldData,
    copySourceId,
  } = unvalidatedPayload;

  if (!isReportType(reportType)) {
    return {
      status: StatusCodes.BAD_REQUEST,
      body: error.NO_KEY,
    };
  }

  const reportBucket = reportBuckets[reportType];
  const reportTable = reportTables[reportType];

  let formTemplate, formTemplateVersion;

  try {
    ({ formTemplate, formTemplateVersion } = await getOrCreateFormTemplate(
      reportBucket,
      reportType
    ));
  } catch (err) {
    logger.error(err, "Error getting or creating template");
    throw err;
  }

  // Return MISSING_DATA error if missing unvalidated data or validators.
  if (!unvalidatedFieldData || !formTemplate.validationJson) {
    return {
      status: StatusCodes.BAD_REQUEST,
      body: error.MISSING_DATA,
    };
  }

  // Create report and field ids.
  const reportId: string = KSUID.randomSync().string;
  const fieldDataId: string = KSUID.randomSync().string;
  const formTemplateId: string = formTemplateVersion?.id;

  /*
   * Validate field data
   * const validatedFieldData = await validateFieldData(
   *   formTemplate.validationJson,
   *   unvalidatedFieldData
   * );
   */

  /*
   * Return INVALID_DATA error if field data is not valid.
   * if (!validatedFieldData || Object.keys(validatedFieldData).length === 0) {
   *   return {
   *     status: StatusCodes.SERVER_ERROR,
   *     body: error.INVALID_DATA,
   *   };
   * }
   */

  // If the `copySourceId` parameter is passed, merge the validated field data with the source ids data.

  let newFieldData;

  if (copySourceId) {
    newFieldData = await copyFieldDataFromSource(
      reportBucket,
      state,
      copySourceId,
      formTemplate,
      unvalidatedFieldData
    );
  } else {
    newFieldData = unvalidatedFieldData;
  }
  const fieldDataParams: S3Put = {
    Bucket: reportBucket,
    Key: getFieldDataKey(state, fieldDataId),
    Body: JSON.stringify(newFieldData),
    ContentType: "application/json",
  };

  try {
    await s3Lib.put(fieldDataParams);
  } catch (err) {
    return {
      status: StatusCodes.SERVER_ERROR,
      body: error.S3_OBJECT_CREATION_ERROR,
    };
  }

  /*
   * const validatedMetadata = await validateData(metadataValidationSchema, {
   *   ...unvalidatedMetadata,
   * });
   */

  /*
   * Return INVALID_DATA error if metadata is not valid.
   * if (!validatedMetadata) {
   *   return {
   *     status: StatusCodes.BAD_REQUEST,
   *     body: error.INVALID_DATA,
   *   };
   * }
   */

  // Create DyanmoDB record.
  const reportMetadataParams: DynamoWrite = {
    TableName: reportTable,
    Item: {
      ...unvalidatedMetadata,
      state,
      id: reportId,
      fieldDataId,
      status: "Not started",
      formTemplateId,
      createdAt: Date.now(),
      lastAltered: Date.now(),
      versionNumber: formTemplateVersion?.versionNumber,
    },
  };

  try {
    await dynamoDb.put(reportMetadataParams);
  } catch (err) {
    return {
      status: StatusCodes.SERVER_ERROR,
      body: error.DYNAMO_CREATION_ERROR,
    };
  }

  return {
    status: StatusCodes.CREATED,
    body: {
      ...reportMetadataParams.Item,
      fieldData: unvalidatedFieldData,
      formTemplate,
      formTemplateVersion: formTemplateVersion?.versionNumber,
    },
  };
});