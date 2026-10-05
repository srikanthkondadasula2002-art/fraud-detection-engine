import Button from "../common/Button";
import { Plus } from "lucide-react";

function QuickActions({ onAdd }) {
  return (
    <Button onClick={onAdd} icon={<Plus size={17} />}>
      Add Transaction
    </Button>
  );
}

export default QuickActions;