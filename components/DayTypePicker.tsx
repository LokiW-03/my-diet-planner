type Props = {
    value: "FULL" | "HALF" | "REST";
    onChange: (v: "FULL" | "HALF" | "REST") => void;
};

export function DayTypePicker({ value, onChange }: Props) {
    return (
        <div style={{ display: "flex", gap: 8 }}>
            {(["FULL", "HALF", "REST"] as const).map(d => (
                <button
                    key={d}
                    onClick={() => onChange(d)}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid #444",
                        background: value === d ? "#fff" : "#111",
                        color: value === d ? "#000" : "#fff",
                    }}
                >
                    {d}
                </button>
            ))}
        </div>
    );
}
