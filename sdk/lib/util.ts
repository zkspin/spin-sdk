function converToBigInts(input: any[]): bigint[] {
    try {
        if (Array.isArray(input)) {
            return input.map((i) => BigInt(i));
        } else {
            return [BigInt(input)];
        }
    } catch (e) {
        throw new Error(`Invalid input: ${e}`);
    }
}

export { converToBigInts };
