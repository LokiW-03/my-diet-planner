"use client";

import { useProfile } from "@/client/src/hooks/useProfile";
import { ModalShell } from "@/client/src/components/ModalShell/ModalShell";
import styles from "./UserProfileModal.module.scss";

export function UserProfileModal({ open, onClose }: UserProfileModalProps) {
    const { profile, updateUser, saveProfileAsDefault } = useProfile();
    if (!open) return null;

    return (
        <ModalShell open={open} title="User Profile" onClose={onClose} size="md">
            <div className={styles.section}>
                <div className={styles.row}>
                    <label className={styles.label}>User ID</label>
                    <div className={styles.readonlyBox}>{String(profile.userId)}</div>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Profile ID</label>
                    <div className={styles.readonlyBox}>{String(profile.profileId)}</div>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Name</label>
                    <input
                        className={styles.input}
                        value={profile.userName}
                        onChange={(e) => updateUser({ userName: e.target.value })}
                    />
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Weight (kg)</label>
                    <input
                        className={styles.input}
                        type="number"
                        step="0.1"
                        value={profile.weightKg}
                        onChange={(e) => updateUser({ weightKg: Number(e.target.value || 0) })}
                    />
                </div>

                <button
                    className={styles.saveBtn}
                    onClick={async () => {
                        await saveProfileAsDefault();
                        onClose();
                    }}
                    type="button"
                >
                    Save Profile
                </button>
            </div>
        </ModalShell>
    );
}

type UserProfileModalProps = {
    open: boolean;
    onClose: () => void;
}