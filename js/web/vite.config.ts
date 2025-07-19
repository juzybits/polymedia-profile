import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		chunkSizeWarningLimit: 1000,
	},
	preview: {
		port: 3000,
	},
	server: {
		port: 3000,
	},
	optimizeDeps: {
		exclude: ["@mysten/walrus-wasm"],
	},
});
