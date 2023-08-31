import { getRows } from "../models/Rows";
import { useObservable } from "../observable";
import { Between } from "./Between";

export const Parent = () => {
  const [rows] = useObservable(getRows, { id: "id" });

  return <div>{rows.data && <Between rows={rows.data} />}</div>;
};
