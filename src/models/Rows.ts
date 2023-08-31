import Rows, { GetRowsRequest, Row } from "../api/Rows";
import { Observable } from "../observable";

export const getRows = () => {
  return new Observable<Row[], GetRowsRequest>(({ id }) => {
    console.log("MODEL ROWS");
    return Rows.getRows({
      id: id,
    });
  });
};
