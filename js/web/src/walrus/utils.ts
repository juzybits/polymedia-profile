export const makeWalrusImageUrl = (network: string, patchId: string) => {
	const AGGREGATOR_URL = `https://aggregator.walrus-${network}.walrus.space`;
	return `${AGGREGATOR_URL}/v1/blobs/by-quilt-patch-id/${patchId}`;
};

export const formatEpochDuration = (epochs: number, epochDurationDays: number) => {
	if (epochDurationDays % 7 === 0) {
		const weeks = Math.floor((epochs * epochDurationDays) / 7);
		const weekLabel = weeks === 1 ? "week" : "weeks";
		return `${weeks} ${weekLabel}`;
	}
	const dayLabel = epochs === 1 ? "day" : "days";
	return `${epochs} ${dayLabel}`;
};

export const formatSmallNumber = (
	value: number,
): { prefix: string; significantDigits: string; subscript?: number } => {
	if (value === 0) return { prefix: "", significantDigits: "0" };

	const valueStr = value.toString();
	const scientificMatch = valueStr.match(/^(\d+(?:\.\d+)?)e-(\d+)$/);

	if (scientificMatch) {
		// Handle scientific notation
		const coefficient = parseFloat(scientificMatch[1]);
		const exponent = parseInt(scientificMatch[2]);

		if (exponent >= 4) {
			// Extract significant digits without decimal point
			const coefficientStr = coefficient.toString().replace(".", "");
			const paddedDigits = coefficientStr.padEnd(3, "0").substring(0, 3);
			return {
				prefix: "0.0",
				significantDigits: paddedDigits,
				subscript: exponent - 1,
			};
		}
	}

	// Check for leading zeros after decimal point
	const decimalMatch = valueStr.match(/^0\.0+(\d+)/);
	if (decimalMatch) {
		const leadingZerosMatch = valueStr.match(/^0\.0+/);
		if (leadingZerosMatch) {
			const leadingZeros = leadingZerosMatch[0].length - 2; // subtract "0."
			if (leadingZeros >= 4) {
				const significantDigits = decimalMatch[1];
				const formattedDigits = significantDigits.substring(0, 3);
				return {
					prefix: "0.0",
					significantDigits: formattedDigits,
					subscript: leadingZeros,
				};
			}
		}
	}

	// For regular numbers, use toPrecision
	return { prefix: "", significantDigits: value.toPrecision(3) };
};
