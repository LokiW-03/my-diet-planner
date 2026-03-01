"use client";

import { useMemo } from "react";
import type { MealDefinition, MealId, Target, TargetId } from "@/shared/models";
import { useProfile } from "@/client/src/hooks/useProfile";

interface UserProfilePanelProps {
    open: boolean;
    onClose: () => void;
}

export function UserProfilePanel({ open, onClose }: UserProfilePanelProps) {
    const { profile, setProfile } = useProfile();

    const targets = useMemo(
        () => Object.values(profile.targets).slice().sort((a, b) => a.name.localeCompare(b.name)),
        [profile.targets]
    );

    const meals = useMemo(
        () => Object.values(profile.meals).slice().sort((a, b) => a.order - b.order),
        [profile.meals]
    );

    const updateTarget = (id: TargetId, patch: Partial<Target>) => {
        setProfile((p) => ({
            ...p,
            targets: {
                ...p.targets,
                [id]: { ...p.targets[id], ...patch },
            },
        }));
    };

    const updateMeal = (id: MealId, patch: Partial<MealDefinition>) => {
        setProfile((p) => ({
            ...p,
            meals: {
                ...p.meals,
                [id]: { ...p.meals[id], ...patch },
            },
        }));
    };

    if (!open) return null;

    return (
        <div style={overlay} onClick={onClose}>
            <div style={panel} onClick={(e) => e.stopPropagation()}>
                <div style={panelHeader}>
                    <h3 style={{ margin: 0 }}>User Profile</h3>
                    <button style={closeBtn} onClick={onClose}>✕</button>
                </div>

                <div style={scrollBody}>
                    <div style={section}>
                        <div style={row}>
                            <label style={label}>User ID</label>
                            <div style={readonlyBox}>{String(profile.userId)}</div>
                        </div>

                        {"profileId" in profile && (
                            <div style={row}>
                                <label style={label}>Profile ID</label>
                                <div style={readonlyBox}>{String((profile as any).profileId)}</div>
                            </div>
                        )}

                        <div style={row}>
                            <label style={label}>Name</label>
                            <input
                                style={input}
                                value={profile.userName}
                                onChange={(e) => setProfile((p) => ({ ...p, userName: e.target.value }))}
                            />
                        </div>

                        <div style={row}>
                            <label style={label}>Weight (kg)</label>
                            <input
                                style={input}
                                type="number"
                                step="0.1"
                                value={profile.weightKg}
                                onChange={(e) =>
                                    setProfile((p) => ({ ...p, weightKg: Number(e.target.value || 0) }))
                                }
                            />
                        </div>
                    </div>

                    <div style={section}>
                        <h4 style={h4}>Targets</h4>
                        {targets.map((t) => (
                            <div key={String(t.id)} style={card}>
                                <div style={row}>
                                    <label style={label}>ID</label>
                                    <div style={readonlyBox}>{String(t.id)}</div>
                                </div>
                                <div style={row}>
                                    <label style={label}>Name</label>
                                    <input
                                        style={input}
                                        value={t.name}
                                        onChange={(e) => updateTarget(t.id, { name: e.target.value })}
                                    />
                                </div>
                                <div style={row2}>
                                    <div style={{ flex: 1 }}>
                                        <label style={label}>Min kcal</label>
                                        <input
                                            style={input}
                                            type="number"
                                            value={t.minKcal}
                                            onChange={(e) =>
                                                updateTarget(t.id, { minKcal: Number(e.target.value || 0) })
                                            }
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={label}>Max kcal</label>
                                        <input
                                            style={input}
                                            type="number"
                                            value={t.maxKcal}
                                            onChange={(e) =>
                                                updateTarget(t.id, { maxKcal: Number(e.target.value || 0) })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={section}>
                        <h4 style={h4}>Meals</h4>
                        {meals.map((m) => (
                            <div key={String(m.id)} style={card}>
                                <div style={row}>
                                    <label style={label}>ID</label>
                                    <div style={readonlyBox}>{String(m.id)}</div>
                                </div>
                                <div style={row}>
                                    <label style={label}>Name</label>
                                    <input
                                        style={input}
                                        value={m.name}
                                        onChange={(e) => updateMeal(m.id, { name: e.target.value })}
                                    />
                                </div>
                                <div style={row2}>
                                    <div style={{ flex: 1 }}>
                                        <label style={label}>Order</label>
                                        <input
                                            style={input}
                                            type="number"
                                            value={m.order}
                                            onChange={(e) =>
                                                updateMeal(m.id, { order: Number(e.target.value || 0) })
                                            }
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={label}>Enabled</label>
                                        <div style={{ display: "flex", alignItems: "center", height: 38 }}>
                                            <input
                                                type="checkbox"
                                                checked={m.enabled}
                                                onChange={(e) => updateMeal(m.id, { enabled: e.target.checked })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
};

const panel: React.CSSProperties = {
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    borderRadius: 14,
    padding: 0,
    width: "90%",
    maxWidth: 520,
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
};

const panelHeader: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderBottom: "1px solid var(--card-border)",
};

const closeBtn: React.CSSProperties = {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "var(--foreground)",
    lineHeight: 1,
    padding: 4,
};

const scrollBody: React.CSSProperties = {
    overflowY: "auto",
    padding: 14,
    flex: 1,
};

const section: React.CSSProperties = { marginTop: 14 };
const h4: React.CSSProperties = { margin: 0, marginBottom: 10 };

const card: React.CSSProperties = {
    border: "1px solid var(--card-border)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
};

const row: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
};

const row2: React.CSSProperties = {
    display: "flex",
    gap: 10,
};

const label: React.CSSProperties = { fontWeight: 700, opacity: 0.85 };

const input: React.CSSProperties = {
    height: 38,
    borderRadius: 10,
    border: "1px solid var(--card-border)",
    background: "var(--background)",
    color: "var(--foreground)",
    padding: "0 10px",
    width: "100%",
    boxSizing: "border-box",
};

const readonlyBox: React.CSSProperties = {
    minHeight: 38,
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    borderRadius: 10,
    border: "1px dashed var(--card-border)",
    opacity: 0.9,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    overflowX: "auto",
};