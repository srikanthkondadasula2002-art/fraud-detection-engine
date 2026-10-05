import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import TransactionForm from "../components/transactions/TransactionForm";
import TransactionTable from "../components/transactions/TransactionTable";
import TransactionSearch from "../components/transactions/TransactionSearch";
import TransactionFilter from "../components/transactions/TransactionFilter";

function Transactions({ transactions, onAdd, onUpdate, onDelete }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());

      const matchesType = type === "all" || t.type === type;
      const matchesCategory = category === "all" || t.category === category;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, search, type, category]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (transaction) => {
    setEditing(transaction);
    setModalOpen(true);
  };

  const save = (transaction) => {
    if (editing) onUpdate({ ...transaction, id: editing.id });
    else onAdd(transaction);
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <section className="page">
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1>Transactions</h1>
          <p>Manage your income and expenses.</p>
        </div>
        <Button onClick={openAdd} icon={<Plus size={17} />}>
          Add Transaction
        </Button>
      </div>

      <div className="card">
        <div className="toolbar">
          <TransactionSearch value={search} onChange={setSearch} />
          <TransactionFilter
            type={type}
            category={category}
            onTypeChange={setType}
            onCategoryChange={setCategory}
          />
        </div>

        <TransactionTable
          transactions={filtered}
          onEdit={openEdit}
          onDelete={(id) => {
            if (window.confirm("Delete this transaction?")) onDelete(id);
          }}
        />
      </div>

      {modalOpen && (
        <Modal
          title={editing ? "Edit Transaction" : "Add Transaction"}
          onClose={() => setModalOpen(false)}
        >
          <TransactionForm
            initialTransaction={editing}
            onSubmit={save}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}
    </section>
  );
}

export default Transactions;