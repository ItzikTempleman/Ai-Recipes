
    import { StatusCode } from "./status-code";

    export class ClientErrors {

        public status: StatusCode;
        public message: string;

        public constructor(status: StatusCode, message: string) {
            this.status = status;
            this.message = message;
        };
    }

    export class RouteNotFound extends ClientErrors {
        public constructor(method: string, route: string) {
            super(StatusCode.NotFound, `Route ${route} on method: ${method} not found`);
        };
    }

    export class ResourceNotFound extends ClientErrors {
        public constructor(id: number) {
            super(StatusCode.NotFound, `id ${id} not found.`);
        };
    }

    export class ValidationError extends ClientErrors {
        public constructor(message: string) {
            super(StatusCode.BadRequest, message);
        };
    }


