export class ResponseTemplate {
    constructor(
        public statusCode: number,
        public message: string,
        public data?: any,
    ) { }
}
