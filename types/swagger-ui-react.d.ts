declare module "swagger-ui-react" {
  import type { FC } from "react";

  export interface SwaggerUIProps {
    spec?: Record<string, unknown>;
    url?: string;
    docExpansion?: "list" | "full" | "none";
    deepLinking?: boolean;
  }

  const SwaggerUI: FC<SwaggerUIProps>;
  export default SwaggerUI;
}
