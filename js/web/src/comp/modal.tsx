import { useCallback, useEffect } from "react";
import "./modal.css";

type ModalProps = {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: React.ReactNode;
	confirmBeforeClose?: boolean;
	confirmMessage?: string;
};

export const Modal: React.FC<ModalProps> = ({
	open,
	onClose,
	children,
	title,
	confirmBeforeClose = false,
	confirmMessage = "Are you sure you want to close? Your progress will be lost.",
}) => {
	const handleClose = useCallback(() => {
		if (confirmBeforeClose && !confirm(confirmMessage)) {
			return; // User clicked "Cancel", don't close
		}
		onClose();
	}, [confirmBeforeClose, confirmMessage, onClose]);

	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleClose();
			}
		};

		if (open) {
			document.addEventListener("keydown", handleEscapeKey);
			// prevent body scroll when modal is open
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscapeKey);
			document.body.style.overflow = "unset";
		};
	}, [open, handleClose]);

	if (!open) {
		return null;
	}

	return (
		<div className="modal-background" onClick={handleClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					{title && <h2>{title}</h2>}
					<button className="modal-close" onClick={handleClose}>
						✕
					</button>
				</div>
				<div className="modal-body">{children}</div>
			</div>
		</div>
	);
};
