type Props = { title: string; address?: string };

export default function ContractCard({ title, address }: Props) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, margin: "8px 0" }}>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div style={{ fontFamily: "monospace" }}>{address ?? "-"}</div>
    </div>
  );
}
