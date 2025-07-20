import { useEffect } from "react";
import "./modal.less";

type ModalProps = {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
	title?: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ open, onClose, children, title }) => {
	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
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
	}, [open, onClose]);

	if (!open) {
		return null;
	}

	return (
		<div className="modal-background" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					{title && <h2>{title}</h2>}
					<button className="modal-close" onClick={onClose}>
						✕
					</button>
				</div>
				<div className="modal-body">{children}</div>
			</div>
		</div>
	);
};
