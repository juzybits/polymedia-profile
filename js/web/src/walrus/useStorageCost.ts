import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "../app/context";

export function useStorageCost(fileSize: number, epochs: number) {
	const { walrusClient } = useAppContext();
	return useQuery({
		queryKey: ["storageCost", fileSize, epochs],
		queryFn: async () => {
			const storageCost = await walrusClient.storageCost(fileSize, epochs);
			return {
				storageCost: storageCost.storageCost.toString(),
				writeCost: storageCost.writeCost.toString(),
				totalCost: storageCost.totalCost.toString(),
			};
		},
		enabled: fileSize > 0 && epochs > 0,
		staleTime: 5 * 60 * 1000,
	});
}
