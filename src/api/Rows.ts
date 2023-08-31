class Rows {
  constructor() {}

  getRows(args: GetRowsRequest): Promise<GetRowsResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log("HERE");
        if (!args.causeError) {
          resolve({ data: [{ name: "row-1" }, { name: "row-2" }] });
        } else {
          reject({ cause: "This is an error" });
        }
      }, 3000);
    });
  }
}

export interface GetRowsResponse {
  data: Row[];
}

export interface GetRowsRequest {
  id: string;
  causeError?: boolean;
}

export interface Row {
  name: string;
}

export default new Rows();
