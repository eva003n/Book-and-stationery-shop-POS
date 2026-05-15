//standardize success  responses
import type { ApiResponseObj, MetaData } from "../validator/validators";

class ApiResponse {
  success: boolean;
  data: any;
  meta: MetaData;
  message: string;
  constructor(obj: ApiResponseObj) {
    this.success = obj.status < 400; //false if statusCode > 400
    this.data = obj.data;
    this.message = obj.message;
    this.meta = obj.meta;
  }
}

export default ApiResponse;
