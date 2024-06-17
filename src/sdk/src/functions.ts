/// Convenience functions, copied from @polymedia/suitcase-core

import { SuiClient, SuiExecutionResult } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

/**
 * Split an array into multiple chunks of a certain size.
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        chunks.push(chunk);
    }
    return chunks;
}

/**
 * Call `SuiClient.devInspectTransactionBlock()` and return the results.
 */
export async function devInspectAndGetResults(
    suiClient: SuiClient,
    tx: Transaction,
    sender = "0x7777777777777777777777777777777777777777777777777777777777777777",
): Promise<SuiExecutionResult[]> {
    const resp = await suiClient.devInspectTransactionBlock({
        sender: sender,
        transactionBlock: tx,
    });
    if (resp.error) {
        throw Error(`response error: ${JSON.stringify(resp, null, 2)}`);
    }
    if (!resp.results?.length) {
        throw Error(`response has no results: ${JSON.stringify(resp, null, 2)}`);
    }
    return resp.results;
}
