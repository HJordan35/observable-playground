import { Row } from "../api/Rows";

export const Child = ({ rows }: { rows: Row[] }) => {
  return (
    <div>
      <ul>
        {rows.map((row) => {
          return <li key={row.name}>{row.name}</li>;
        })}
      </ul>
    </div>
  );
};
