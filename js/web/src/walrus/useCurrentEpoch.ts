import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "../app/context";

export function useCurrentEpoch() {
	const { walrusClient } = useAppContext();
	return useQuery({
		queryKey: ["currentEpoch"],
		queryFn: async () => {
			const systemState = await walrusClient.systemState();
			return systemState.committee.epoch;
		},
		staleTime: 30 * 1000,
	});
}
