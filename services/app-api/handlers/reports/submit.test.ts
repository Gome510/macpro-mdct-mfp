import { submitReport } from "./submit";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
// utils
import { proxyEvent } from "../../utils/testing/proxyEvent";
import { error } from "../../utils/constants/constants";
import {
  mockApiKey,
  mockDynamoData,
  mockDynamoDataWPCompleted,
  mockReportFieldData,
  mockReportJson,
  mockS3PutObjectCommandOutput,
} from "../../utils/testing/setupJest";
import s3Lib from "../../utils/s3/s3-lib";
// types
import { APIGatewayProxyEvent, StatusCodes } from "../../utils/types";

const dynamoClientMock = mockClient(DynamoDBDocumentClient);

jest.mock("../../utils/auth/authorization", () => ({
  isAuthorized: jest.fn().mockReturnValue(true),
  hasPermissions: jest.fn().mockReturnValue(true),
}));

const testSubmitEvent: APIGatewayProxyEvent = {
  ...proxyEvent,
  headers: { "cognito-identity-id": "test", "x-api-key": mockApiKey },
  pathParameters: {
    reportType: "WP",
    state: "NJ",
    id: "mock-report-id",
  },
};

describe("Test submitReport API method", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    dynamoClientMock.reset();
  });
  test("Test Report not found in DynamoDB", async () => {
    dynamoClientMock.on(GetCommand).resolves({
      Item: undefined,
    });
    const res = await submitReport(testSubmitEvent, null);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  test("Test Successful Report Submittal", async () => {
    // s3 mocks
    const s3GetSpy = jest.spyOn(s3Lib, "get");
    s3GetSpy
      .mockResolvedValueOnce(mockReportJson)
      .mockResolvedValueOnce(mockReportFieldData);
    const s3PutSpy = jest.spyOn(s3Lib, "put");
    s3PutSpy.mockResolvedValue(mockS3PutObjectCommandOutput);
    // dynamodb mocks
    dynamoClientMock.on(GetCommand).resolves({
      Item: mockDynamoDataWPCompleted,
    });
    const res = await submitReport(testSubmitEvent, null);
    expect(res.statusCode).toBe(StatusCodes.SUCCESS);
    const body = JSON.parse(res.body);
    expect(body.lastAlteredBy).toContain("Thelonious States");
    expect(body.submissionName).toContain("testProgram");
    expect(body.isComplete).toStrictEqual(true);
    expect(body.status).toStrictEqual("Submitted");
    expect(body.submittedBy).toStrictEqual("Thelonious States");
    expect(body.submittedOnDate).toBeTruthy();
    expect(body.locked).toBe(true);
  });

  test("Test WP reports get locked and have submission count updated.", async () => {
    // s3 mocks
    const s3GetSpy = jest.spyOn(s3Lib, "get");
    s3GetSpy
      .mockResolvedValueOnce(mockReportJson)
      .mockResolvedValueOnce(mockReportFieldData);
    const s3PutSpy = jest.spyOn(s3Lib, "put");
    s3PutSpy.mockResolvedValue(mockS3PutObjectCommandOutput);
    // dynamodb mocks
    dynamoClientMock.on(GetCommand).resolves({
      Item: {
        ...mockDynamoDataWPCompleted,
        reportType: "WP",
      },
    });
    const res = await submitReport(testSubmitEvent, null);
    expect(res.statusCode).toBe(StatusCodes.SUCCESS);
    const body = JSON.parse(res.body);
    expect(body.lastAlteredBy).toContain("Thelonious States");
    expect(body.submissionName).toContain("testProgram");
    expect(body.isComplete).toStrictEqual(true);
    expect(body.status).toStrictEqual("Submitted");
    expect(body.submittedBy).toStrictEqual("Thelonious States");
    expect(body.submittedOnDate).toBeTruthy();
    expect(body.locked).toBe(true);
    expect(body.submissionCount).toBe(1);
  });

  test("Test report submittal fails if incomplete.", async () => {
    dynamoClientMock.on(GetCommand).resolves({
      Item: mockDynamoData,
    });
    const res = await submitReport(testSubmitEvent, null);
    expect(res.statusCode).toBe(StatusCodes.SERVER_ERROR);
    const body = JSON.parse(res.body);
    expect(body).toStrictEqual(error.REPORT_INCOMPLETE);
  });

  test("Test reportKeys not provided throws 400 error", async () => {
    const noKeyEvent: APIGatewayProxyEvent = {
      ...testSubmitEvent,
      pathParameters: {},
    };
    const res = await submitReport(noKeyEvent, null);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain(error.NO_KEY);
  });

  test("Test reportKeys empty throws 400 error", async () => {
    const noKeyEvent: APIGatewayProxyEvent = {
      ...testSubmitEvent,
      pathParameters: { state: "", id: "" },
    };
    const res = await submitReport(noKeyEvent, null);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain(error.NO_KEY);
  });
});
