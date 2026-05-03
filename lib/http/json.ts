import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(err: ApiError): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    },
    { status: err.httpStatus },
  );
}

export function jsonUnexpected(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL" as const,
        message: "Error interno",
      },
    },
    { status: 500 },
  );
}
