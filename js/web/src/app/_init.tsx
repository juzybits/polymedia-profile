import ReactDOM from "react-dom/client";

import { AppRouter } from "./app";

// @ts-expect-error Property 'toJSON' does not exist on type 'BigInt'
BigInt.prototype.toJSON = function () {
	return this.toString();
};

ReactDOM.createRoot(document.getElementById("app") as Element).render(<AppRouter />);
