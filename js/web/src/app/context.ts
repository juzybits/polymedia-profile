import { createContext, useContext } from "react";

import type { AppContextType } from "./app";

export const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useAppContext must be used within an AppContextProvider");
	}
	return context;
};
