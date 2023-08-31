import { Row } from "../api/Rows";
import { Child } from "./Child";

export const Between = ({ rows }: { rows: Row[] }) => {
  return (
    <div>
      <Child rows={rows} />
    </div>
  );
};
