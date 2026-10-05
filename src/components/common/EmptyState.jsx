function EmptyState({ message = "No data available." }) {
  return <div className="empty">{message}</div>;
}

export default EmptyState;